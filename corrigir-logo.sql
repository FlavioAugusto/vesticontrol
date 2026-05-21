-- ════════════════════════════════════════════════════════════════
-- Corrigir logo da By Marcelo Medeiros
-- ════════════════════════════════════════════════════════════════

-- 1. Ver qual logo está salva atualmente em CADA loja
SELECT
  loja_id,
  chave,
  CASE
    WHEN length(valor) > 80 THEN substring(valor, 1, 80) || '...'
    ELSE valor
  END AS valor
FROM configuracoes
WHERE chave IN ('loja_logo_url', 'loja_favicon_url', 'loja_nome')
ORDER BY loja_id, chave;

-- 2. Identificar qual loja é a By Marcelo (vamos limpar logo dessa)
SELECT id, nome, slug, dominio FROM lojas;

-- 3. LIMPAR o logo e favicon da By Marcelo Medeiros
-- (sistema vai cair no fallback /images/logo.svg que é a logo M)
UPDATE configuracoes
SET valor = '', updated_at = now()
WHERE chave IN ('loja_logo_url', 'loja_favicon_url')
  AND loja_id = '00000000-0000-0000-0000-000000000001';

-- 4. Verificação
SELECT chave, valor FROM configuracoes
WHERE chave IN ('loja_logo_url', 'loja_favicon_url')
  AND loja_id = '00000000-0000-0000-0000-000000000001';
