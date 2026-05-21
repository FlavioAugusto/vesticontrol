-- ════════════════════════════════════════════════════════════════
-- LIMPEZA TOTAL — deixar apenas By Marcelo Medeiros
-- - MOVE: clientes, pedidos, enderecos, avaliacoes (sem conflito)
-- - APAGA: produtos, categorias, cupons, etc das outras lojas (conflitam slug)
-- ════════════════════════════════════════════════════════════════

DO $$
DECLARE
  LOJA_BM UUID := '00000000-0000-0000-0000-000000000001';
  total_clientes_movidos INT := 0;
  total_pedidos_movidos INT := 0;
  total_produtos_apagados INT := 0;
  total_categorias_apagadas INT := 0;
  total_cupons_apagados INT := 0;
  total_configs_removidas INT := 0;
  total_admins_removidos INT := 0;
  total_lojas_removidas INT := 0;
BEGIN
  -- ─── 1. APAGAR avaliacoes, pedido_itens, pedidos, enderecos, lista_desejos ──
  -- (pra evitar foreign keys travando depois)
  DELETE FROM avaliacoes WHERE loja_id IS DISTINCT FROM LOJA_BM;
  DELETE FROM lista_desejos WHERE cliente_id IN (
    SELECT id FROM clientes WHERE loja_id IS DISTINCT FROM LOJA_BM
  );
  DELETE FROM pedido_itens WHERE pedido_id IN (
    SELECT id FROM pedidos WHERE loja_id IS DISTINCT FROM LOJA_BM
  );
  DELETE FROM pedidos WHERE loja_id IS DISTINCT FROM LOJA_BM;
  GET DIAGNOSTICS total_pedidos_movidos = ROW_COUNT;

  DELETE FROM enderecos WHERE cliente_id IN (
    SELECT id FROM clientes WHERE loja_id IS DISTINCT FROM LOJA_BM
  );
  DELETE FROM clientes WHERE loja_id IS DISTINCT FROM LOJA_BM;
  GET DIAGNOSTICS total_clientes_movidos = ROW_COUNT;

  -- ─── 2. APAGAR produtos, variantes, imagens das outras lojas ──
  -- (conflitam slug, é mais limpo apagar — eram da Lorvi antiga)
  DELETE FROM produto_imagens WHERE produto_id IN (
    SELECT id FROM produtos WHERE loja_id IS DISTINCT FROM LOJA_BM
  );
  DELETE FROM produto_variantes WHERE produto_id IN (
    SELECT id FROM produtos WHERE loja_id IS DISTINCT FROM LOJA_BM
  );
  DELETE FROM produtos WHERE loja_id IS DISTINCT FROM LOJA_BM;
  GET DIAGNOSTICS total_produtos_apagados = ROW_COUNT;

  -- ─── 3. APAGAR categorias e cupons das outras lojas ──
  DELETE FROM categorias WHERE loja_id IS DISTINCT FROM LOJA_BM;
  GET DIAGNOSTICS total_categorias_apagadas = ROW_COUNT;

  DELETE FROM cupons WHERE loja_id IS DISTINCT FROM LOJA_BM;
  GET DIAGNOSTICS total_cupons_apagados = ROW_COUNT;

  -- ─── 4. APAGAR admins de outras lojas (deixa só Marcelo) ──────
  DELETE FROM admins WHERE loja_id IS DISTINCT FROM LOJA_BM;
  GET DIAGNOSTICS total_admins_removidos = ROW_COUNT;

  -- ─── 5. APAGAR configs de outras lojas ────────────────────────
  DELETE FROM configuracoes WHERE loja_id IS DISTINCT FROM LOJA_BM;
  GET DIAGNOSTICS total_configs_removidas = ROW_COUNT;

  -- ─── 6. APAGAR outras lojas (deixa só By Marcelo) ────────────
  DELETE FROM lojas WHERE id IS DISTINCT FROM LOJA_BM;
  GET DIAGNOSTICS total_lojas_removidas = ROW_COUNT;

  -- ─── 7. LIMPAR logo/favicon da By Marcelo (volta pro fallback /images/logo.svg) ──
  UPDATE configuracoes
  SET valor = '', updated_at = now()
  WHERE chave IN ('loja_logo_url', 'loja_favicon_url')
    AND loja_id = LOJA_BM;

  -- ─── RELATÓRIO ────────────────────────────────────────────────
  RAISE NOTICE '====== LIMPEZA CONCLUIDA ======';
  RAISE NOTICE 'Pedidos apagados (outras lojas): %', total_pedidos_movidos;
  RAISE NOTICE 'Clientes apagados (outras lojas): %', total_clientes_movidos;
  RAISE NOTICE 'Produtos apagados (outras lojas): %', total_produtos_apagados;
  RAISE NOTICE 'Categorias apagadas (outras lojas): %', total_categorias_apagadas;
  RAISE NOTICE 'Cupons apagados (outras lojas): %', total_cupons_apagados;
  RAISE NOTICE 'Admins removidos: %', total_admins_removidos;
  RAISE NOTICE 'Configs removidas: %', total_configs_removidas;
  RAISE NOTICE 'Lojas removidas: %', total_lojas_removidas;
  RAISE NOTICE 'Logo/Favicon resetados pro fallback /images/logo.svg';
END $$;

-- ─── VERIFICAÇÃO FINAL ──────────────────────────────────────────
SELECT '=== ADMINS RESTANTES ===' AS info;
SELECT id, loja_id, nome FROM admins;

SELECT '=== LOJAS RESTANTES ===' AS info;
SELECT id, nome, slug, dominio FROM lojas;

SELECT '=== CONFIG LOGO ATUAL ===' AS info;
SELECT chave, valor FROM configuracoes
WHERE chave IN ('loja_logo_url', 'loja_favicon_url', 'loja_nome');

SELECT '=== TOTAIS POR TABELA ===' AS info;
SELECT 'produtos' AS tabela, COUNT(*) AS total FROM produtos
UNION ALL SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL SELECT 'pedidos', COUNT(*) FROM pedidos
UNION ALL SELECT 'categorias', COUNT(*) FROM categorias
UNION ALL SELECT 'cupons', COUNT(*) FROM cupons;
