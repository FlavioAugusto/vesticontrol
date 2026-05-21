-- ════════════════════════════════════════════════════════════════
-- Cria variantes P / M / G com 10 unidades para todos os produtos
-- que ainda NÃO têm variantes cadastradas
-- ════════════════════════════════════════════════════════════════

DO $$
DECLARE
  prod RECORD;
  tam TEXT;
  total_criadas INT := 0;
BEGIN
  FOR prod IN
    SELECT p.id, p.slug
    FROM produtos p
    LEFT JOIN produto_variantes v ON v.produto_id = p.id
    WHERE p.loja_id = '00000000-0000-0000-0000-000000000001'
    GROUP BY p.id, p.slug
    HAVING COUNT(v.id) = 0
  LOOP
    FOREACH tam IN ARRAY ARRAY['P','M','G']
    LOOP
      INSERT INTO produto_variantes (produto_id, tamanho, estoque, sku, loja_id)
      VALUES (
        prod.id,
        tam,
        10,
        COALESCE(prod.slug, prod.id::text) || '-' || tam,
        '00000000-0000-0000-0000-000000000001'
      )
      ON CONFLICT DO NOTHING;
      total_criadas := total_criadas + 1;
    END LOOP;
  END LOOP;
  RAISE NOTICE 'Total de variantes criadas: %', total_criadas;
END $$;

-- Verificação
SELECT
  p.nome AS produto,
  COUNT(v.id) AS qtd_variantes,
  SUM(v.estoque) AS estoque_total
FROM produtos p
LEFT JOIN produto_variantes v ON v.produto_id = p.id
WHERE p.loja_id = '00000000-0000-0000-0000-000000000001'
GROUP BY p.id, p.nome
ORDER BY p.created_at DESC;
