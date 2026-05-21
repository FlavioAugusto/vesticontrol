-- ════════════════════════════════════════════════════════════════
-- Adicionar colunas para etiqueta Melhor Envio
-- Roda no Supabase SQL Editor (idempotente)
-- ════════════════════════════════════════════════════════════════

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS melhorenvio_order_id TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS melhorenvio_print_url TEXT;

-- codigo_rastreio e transportadora já existem (do schema original)

-- Verificação
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'pedidos'
  AND column_name IN ('codigo_rastreio', 'transportadora', 'melhorenvio_order_id', 'melhorenvio_print_url');
