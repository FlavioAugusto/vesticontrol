-- ════════════════════════════════════════════════════════════════
-- VERIFICAR pedidos com pagamento aguardando validação manual
-- (cliente disse que pagou mas você ainda não validou no InfinitePay)
-- ════════════════════════════════════════════════════════════════

SELECT
  p.numero,
  p.id,
  p.created_at AS pedido_em,
  c.nome || ' ' || COALESCE(c.sobrenome, '') AS cliente,
  c.telefone,
  c.cpf,
  p.total,
  p.metodo_pagamento,
  p.status,
  p.status_pagamento,
  p.observacoes
FROM pedidos p
LEFT JOIN clientes c ON c.id = p.cliente_id
WHERE p.loja_id = '00000000-0000-0000-0000-000000000001'
  AND p.status_pagamento = 'aguardando_confirmacao_manual'
ORDER BY p.created_at DESC;
