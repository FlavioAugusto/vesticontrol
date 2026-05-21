-- ════════════════════════════════════════════════════════════════
-- Restaurar Guias de Tamanhos (Vestidos, Calças, Blusas)
-- ════════════════════════════════════════════════════════════════

INSERT INTO configuracoes (chave, valor, tipo, grupo, loja_id)
VALUES (
  'guias_tamanhos',
  '[
    {
      "id": "vestidos",
      "nome": "Guia de Vestidos e Conjuntos",
      "medidas": [
        { "label": "Busto",       "P": "88-92 cm",  "M": "92-96 cm",  "G": "96-100 cm" },
        { "label": "Cintura",     "P": "70-74 cm",  "M": "74-78 cm",  "G": "78-82 cm" },
        { "label": "Quadril",     "P": "94-98 cm",  "M": "98-102 cm", "G": "102-106 cm" },
        { "label": "Comprimento", "P": "100-102 cm","M": "102-104 cm","G": "104-106 cm" }
      ],
      "imagem_url": "",
      "dica": "Meça em centímetros com a fita bem ajustada ao corpo."
    },
    {
      "id": "calcas",
      "nome": "Guia de Calças e Saias",
      "medidas": [
        { "label": "Cintura",     "P": "70-74 cm",  "M": "74-78 cm",  "G": "78-82 cm" },
        { "label": "Quadril",     "P": "94-98 cm",  "M": "98-102 cm", "G": "102-106 cm" },
        { "label": "Comprimento", "P": "98-100 cm", "M": "100-102 cm","G": "102-104 cm" }
      ],
      "imagem_url": "",
      "dica": "Para melhor caimento, prefira o tamanho que comporte mais o quadril."
    },
    {
      "id": "blusas",
      "nome": "Guia de Blusas e Tops",
      "medidas": [
        { "label": "Busto",       "P": "88-92 cm",  "M": "92-96 cm",  "G": "96-100 cm" },
        { "label": "Cintura",     "P": "70-74 cm",  "M": "74-78 cm",  "G": "78-82 cm" },
        { "label": "Comprimento", "P": "58-60 cm",  "M": "60-62 cm",  "G": "62-64 cm" }
      ],
      "imagem_url": "",
      "dica": "Mantenha a fita métrica reta e levemente ajustada."
    }
  ]',
  'text',
  'tamanhos',
  '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (chave, loja_id) DO UPDATE
  SET valor = EXCLUDED.valor, updated_at = now();

-- Verificação
SELECT
  chave,
  CASE
    WHEN length(valor) > 100 THEN substring(valor, 1, 100) || '...'
    ELSE valor
  END AS valor_preview,
  length(valor) AS tamanho_chars
FROM configuracoes
WHERE chave = 'guias_tamanhos'
  AND loja_id = '00000000-0000-0000-0000-000000000001';
