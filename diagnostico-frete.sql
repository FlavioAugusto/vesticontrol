-- ════════════════════════════════════════════════════════════════
-- DIAGNÓSTICO RÁPIDO do frete
-- Rode no Supabase e me mande o resultado
-- ════════════════════════════════════════════════════════════════

SELECT chave, valor
FROM configuracoes
WHERE loja_id = '00000000-0000-0000-0000-000000000001'
  AND chave IN (
    'loja_cep_origem',
    'frete_gratis_minimo',
    'melhorenvio_ativo',
    'melhorenvio_token',
    'correios_ativo'
  )
ORDER BY chave;
