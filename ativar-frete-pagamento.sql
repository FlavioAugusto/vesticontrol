-- ════════════════════════════════════════════════════════════════
-- ATIVAR Melhor Envio + InfinitePay + PIX + Boleto
-- ════════════════════════════════════════════════════════════════

DO $$
DECLARE LOJA_BM UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  INSERT INTO configuracoes (chave, valor, tipo, grupo, loja_id) VALUES
    -- ───── FRETE ─────
    ('melhorenvio_ativo',  'true',                                 'text', 'frete',     LOJA_BM),
    ('melhorenvio_token',  'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiYjcwZTdlNGZjYjllZjdjZjVkNzFiY2MyNDkyNDM3ZWNmNjQwYmE0NmYwNzYwOWMyY2Q4YTEyN2NkMjVmM2JhYWMxODZmZDkwNTU4ODlhNzQiLCJpYXQiOjE3NzgxODgwODUuNDYzMywibmJmIjoxNzc4MTg4MDg1LjQ2MzMwMiwiZXhwIjoxODA5NzI0MDg1LjQ1MjQ5Mywic3ViIjoiOWY4MjQxNzUtMThmMC00N2Q3LWI2OTktNTUzZGIwOTgxM2FkIiwic2NvcGVzIjpbImNhcnQtcmVhZCIsImNhcnQtd3JpdGUiLCJjb21wYW5pZXMtcmVhZCIsImNvbXBhbmllcy13cml0ZSIsImNvdXBvbnMtcmVhZCIsImNvdXBvbnMtd3JpdGUiLCJub3RpZmljYXRpb25zLXJlYWQiLCJvcmRlcnMtcmVhZCIsInByb2R1Y3RzLXJlYWQiLCJwcm9kdWN0cy1kZXN0cm95IiwicHJvZHVjdHMtd3JpdGUiLCJwdXJjaGFzZXMtcmVhZCIsInNoaXBwaW5nLWNhbGN1bGF0ZSIsInNoaXBwaW5nLWNhbmNlbCIsInNoaXBwaW5nLWNoZWNrb3V0Iiwic2hpcHBpbmctY29tcGFuaWVzIiwic2hpcHBpbmctZ2VuZXJhdGUiLCJzaGlwcGluZy1wcmV2aWV3Iiwic2hpcHBpbmctcHJpbnQiLCJzaGlwcGluZy1zaGFyZSIsInNoaXBwaW5nLXRyYWNraW5nIiwiZWNvbW1lcmNlLXNoaXBwaW5nIiwidHJhbnNhY3Rpb25zLXJlYWQiLCJ1c2Vycy1yZWFkIiwidXNlcnMtd3JpdGUiLCJ3ZWJob29rcy1yZWFkIiwid2ViaG9va3Mtd3JpdGUiLCJ3ZWJob29rcy1kZWxldGUiLCJ0ZGVhbGVyLXdlYmhvb2siXX0.CTW886svooab8CN8U_7gneswP2IFvUS5nVeXHYbAdInNQ7GNxCh7LEOWgyHSetfFxtw4fsYvBdaCgMNJDRtMp08I4rjObiJ4PTvqS3zrHil2rhvmF2qXR6ES8BllqecPLmu_zzxS7NrNvon0XQG09MTpitRf29JrXM2NzYjBRG0Ma87FDVoQZo9j3hq7WqQZ19uYXq_r4ek-Il-JYLWZ2GOybRhs4cRn-TuWmeMqA3ofUf_wJKfAJhjkem1wtyaSqOUZJwU-N8HioDjxFcB-xqBtywWLKRd-1d4vjoGY3fGOtKdlVC0E8lCOMLQI2Xlz-ywPQoJTBDwA6uPyLY_oDe70GK2uf0fpOQVkkTV9DZYujoC-fpupkYewIC_GYfrvUz1O7GJEQMcZ5nvNSeVqfbJs7YaaGwIdLTrD_mdHTccNSzPq25FAuGE3Ei5gaAeQL1vJLugK-6py-4DlvgSQa1fdCNCxRZ6sbJT02s1ZUXA5gWuaJxcopuQdmeJqTYqQrc4NaGW9RjUyfe43_sROMB7PhmaqL7QJeyVhdrUUx3oyRGXUD3IueijjZzl-8aSM1u7IXn3bqkbAlcnjGtyem34L1CMrWsm_jEBnQZvcJhAZlZPx1k1Dp0kpdP3lTLfXIKL4ZO2UPB0_1jLmNgtRRY_RZ9yiFERwIsQCQbUm1EU', 'text', 'frete', LOJA_BM),
    ('correios_ativo',     'true',                                 'text', 'frete',     LOJA_BM),
    ('loja_cep_origem',    '55002-000',                            'text', 'frete',     LOJA_BM),
    ('frete_gratis_minimo','497.00',                               'text', 'frete',     LOJA_BM),

    -- ───── PAGAMENTO ─────
    ('pix_ativo',                 'true',                          'text', 'pagamento', LOJA_BM),
    ('boleto_ativo',              'true',                          'text', 'pagamento', LOJA_BM),
    ('desconto_pix_pct',          '10',                            'text', 'pagamento', LOJA_BM),
    ('pagamento_pix_desconto',    '10',                            'text', 'pagamento', LOJA_BM),
    ('parcelas_sem_juros',        '6',                             'text', 'pagamento', LOJA_BM),
    ('infinitepay_ativo',         'true',                          'text', 'pagamento', LOJA_BM),
    ('infinitepay_handle',        'bymarcelomedeiros',             'text', 'pagamento', LOJA_BM),
    ('mercadopago_ativo',         'false',                         'text', 'pagamento', LOJA_BM)
  ON CONFLICT (chave, loja_id) DO UPDATE
    SET valor = EXCLUDED.valor, updated_at = now();

  RAISE NOTICE 'Frete e pagamento ATIVADOS!';
END $$;

-- Verificação
SELECT chave, valor FROM configuracoes
WHERE loja_id = '00000000-0000-0000-0000-000000000001'
  AND chave IN ('melhorenvio_ativo', 'pix_ativo', 'boleto_ativo', 'infinitepay_ativo', 'infinitepay_handle', 'parcelas_sem_juros', 'desconto_pix_pct')
ORDER BY chave;
