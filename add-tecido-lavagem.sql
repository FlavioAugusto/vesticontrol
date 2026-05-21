-- ═══════════════════════════════════════════════════════════════════
-- Adiciona colunas tecido e lavagem ao produto
-- Rodar no Supabase SQL Editor (idempotente)
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE produtos ADD COLUMN IF NOT EXISTS tecido  TEXT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS lavagem TEXT;

-- Verificação
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'produtos'
  AND column_name IN ('composicao', 'tecido', 'lavagem');
