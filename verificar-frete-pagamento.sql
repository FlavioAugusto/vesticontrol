-- ════════════════════════════════════════════════════════════════
-- Verificar status do Melhor Envio e InfinitePay
-- ════════════════════════════════════════════════════════════════

SELECT chave, valor FROM configuracoes
WHERE loja_id = '00000000-0000-0000-0000-000000000001'
  AND chave IN (
    -- Melhor Envio
    'melhorenvio_ativo',
    'melhorenvio_token',
    'correios_ativo',
    'loja_cep_origem',
    'frete_gratis_minimo',
    -- Pagamento
    'pix_ativo',
    'boleto_ativo',
    'desconto_pix_pct',
    'parcelas_sem_juros',
    'infinitepay_ativo',
    'infinitepay_handle',
    'mercadopago_ativo',
    'mercadopago_access_token'
  )
ORDER BY chave;
