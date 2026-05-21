-- ═══════════════════════════════════════
-- ARQUIVO: supabase/migrations/003_badge_update.sql
-- Atualiza os valores do campo badge para o novo sistema de classificação
-- ═══════════════════════════════════════

-- Remove o CHECK constraint antigo
ALTER TABLE produtos DROP CONSTRAINT IF EXISTS produtos_badge_check;

-- Atualiza valores existentes (caso existam)
UPDATE produtos SET badge = 'lancamento'   WHERE badge = 'new';
UPDATE produtos SET badge = 'bestseller'   WHERE badge = 'exclusive';
UPDATE produtos SET badge = 'maisvendidos' WHERE badge = 'sale';

-- Adiciona novo CHECK constraint
ALTER TABLE produtos
  ADD CONSTRAINT produtos_badge_check
  CHECK (badge IN ('lancamento', 'bestseller', 'maisvendidos', NULL));
