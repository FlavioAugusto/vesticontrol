-- ════════════════════════════════════════════════════════════════
-- DIAGNÓSTICO + CORREÇÃO definitiva do estoque
-- ════════════════════════════════════════════════════════════════

-- 1. DIAGNÓSTICO: como estão as variantes
SELECT '=== DIAGNÓSTICO ===' AS info;
SELECT
  COALESCE(loja_id::text, '*** NULL ***') AS loja_id,
  COUNT(*) AS total_variantes,
  SUM(estoque) AS estoque_total
FROM produto_variantes
GROUP BY loja_id;

-- 2. CORREÇÃO: atualiza variantes pra apontar pra By Marcelo
-- Pega o loja_id do produto pai (que está correto na tabela produtos)
UPDATE produto_variantes v
SET loja_id = p.loja_id
FROM produtos p
WHERE v.produto_id = p.id
  AND (v.loja_id IS NULL OR v.loja_id IS DISTINCT FROM p.loja_id);

-- 3. CORREÇÃO 2: caso ainda tenha variantes órfãs (sem produto válido), define como By Marcelo
UPDATE produto_variantes
SET loja_id = '00000000-0000-0000-0000-000000000001'
WHERE loja_id IS NULL;

-- 4. VERIFICAÇÃO: deve mostrar tudo na loja By Marcelo agora
SELECT '=== APÓS CORREÇÃO ===' AS info;
SELECT
  COALESCE(loja_id::text, '*** NULL ***') AS loja_id,
  COUNT(*) AS total_variantes,
  SUM(estoque) AS estoque_total
FROM produto_variantes
GROUP BY loja_id;

-- 5. Lista as primeiras 10 variantes pra confirmar
SELECT '=== EXEMPLOS ===' AS info;
SELECT v.id, p.nome AS produto, v.tamanho, v.cor, v.estoque, v.loja_id
FROM produto_variantes v
LEFT JOIN produtos p ON p.id = v.produto_id
WHERE v.loja_id = '00000000-0000-0000-0000-000000000001'
LIMIT 10;
