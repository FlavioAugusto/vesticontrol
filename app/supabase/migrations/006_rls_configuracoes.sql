-- ═══════════════════════════════════════════════════════════════
-- POLÍTICAS DE ACESSO — Configurações e Storage
-- Execute após 005_banco_completo_final.sql
-- ═══════════════════════════════════════════════════════════════

-- Habilitar RLS na tabela configuracoes
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Leitura pública (site precisa ler configs para renderizar)
CREATE POLICY "configuracoes_public_read"
  ON configuracoes FOR SELECT
  USING (true);

-- Escrita somente para admins autenticados
CREATE POLICY "configuracoes_admin_write"
  ON configuracoes FOR ALL
  USING (
    auth.uid() IN (SELECT id FROM admins)
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM admins)
  );

-- ─── PERMISSÃO SERVICE ROLE (para nossas APIs) ───────────────────
-- O service_role sempre bypassa RLS, então as APIs com admin client
-- funcionam independente das políticas acima.

-- ─── RLS para cupons (admin write) ──────────────────────────────
ALTER TABLE cupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cupons_public_read"
  ON cupons FOR SELECT USING (ativo = true);

CREATE POLICY "cupons_admin_write"
  ON cupons FOR ALL
  USING (auth.uid() IN (SELECT id FROM admins));

-- ─── Storage: permitir leitura pública e upload para autenticados ─
-- (já deve ter sido criado em 005, mas garantindo)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'storage_public_read') THEN
    EXECUTE 'CREATE POLICY "storage_public_read" ON storage.objects FOR SELECT USING (bucket_id = ''imagens'')';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'storage_auth_upload') THEN
    EXECUTE 'CREATE POLICY "storage_auth_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = ''imagens'' AND auth.role() = ''authenticated'')';
  END IF;
END $$;

-- ─── Verificar se bucket existe, criar se não ────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'imagens', 'imagens', true,
  2097152, -- 2MB em bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
