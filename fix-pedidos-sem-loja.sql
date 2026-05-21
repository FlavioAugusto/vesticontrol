-- ═══════════════════════════════════════════════════════════════════
-- FIX: Pedidos e clientes criados sem loja_id
-- Rodar UMA VEZ no Supabase SQL Editor após o deploy
-- ═══════════════════════════════════════════════════════════════════

-- 1. Define a loja By Marcelo como padrão para registros órfãos
-- (pedidos e clientes criados antes do fix do loja_id)

DO $$
DECLARE
  LOJA_BYMARCELO UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Backfill loja_id em pedidos órfãos
  UPDATE pedidos
  SET loja_id = LOJA_BYMARCELO
  WHERE loja_id IS NULL;

  RAISE NOTICE 'Pedidos atualizados: %', (SELECT COUNT(*) FROM pedidos WHERE loja_id = LOJA_BYMARCELO);

  -- Backfill loja_id em clientes órfãos
  UPDATE clientes
  SET loja_id = LOJA_BYMARCELO
  WHERE loja_id IS NULL;

  RAISE NOTICE 'Clientes atualizados: %', (SELECT COUNT(*) FROM clientes WHERE loja_id = LOJA_BYMARCELO);

  -- Backfill loja_id em pedido_itens (via pedido)
  UPDATE pedido_itens pi
  SET loja_id = p.loja_id
  FROM pedidos p
  WHERE pi.pedido_id = p.id AND pi.loja_id IS NULL;
END $$;

-- 2. Verificação
SELECT
  'pedidos' AS tabela, COUNT(*) AS total,
  COUNT(*) FILTER (WHERE loja_id IS NULL) AS sem_loja
FROM pedidos
UNION ALL
SELECT
  'clientes', COUNT(*),
  COUNT(*) FILTER (WHERE loja_id IS NULL)
FROM clientes;
