-- ════════════════════════════════════════════════════════════════
-- DIAGNÓSTICO DE ESTOQUE
-- Por que /admin/estoque não mostra produtos?
-- ════════════════════════════════════════════════════════════════

-- 1. Quantos produtos existem?
SELECT '=== TOTAL PRODUTOS ===' AS info;
SELECT loja_id, COUNT(*) AS total_produtos
FROM produtos
GROUP BY loja_id;

-- 2. Quantas variantes (P/M/G de cada cor) existem?
SELECT '=== TOTAL VARIANTES ===' AS info;
SELECT loja_id, COUNT(*) AS total_variantes
FROM produto_variantes
GROUP BY loja_id;

-- 3. Lista os primeiros 10 produtos com SUA quantidade de variantes
SELECT '=== PRODUTOS x VARIANTES ===' AS info;
SELECT
  p.id,
  p.nome,
  p.loja_id,
  p.ativo,
  COUNT(v.id) AS total_variantes
FROM produtos p
LEFT JOIN produto_variantes v ON v.produto_id = p.id
WHERE p.loja_id = '00000000-0000-0000-0000-000000000001'
GROUP BY p.id, p.nome, p.loja_id, p.ativo
ORDER BY p.created_at DESC
LIMIT 10;

-- 4. Lista as variantes existentes
SELECT '=== VARIANTES BY MARCELO ===' AS info;
SELECT
  v.id, v.produto_id, p.nome AS produto, v.tamanho, v.cor, v.estoque, v.sku
FROM produto_variantes v
LEFT JOIN produtos p ON p.id = v.produto_id
WHERE v.loja_id = '00000000-0000-0000-0000-000000000001'
ORDER BY v.created_at DESC
LIMIT 20;
