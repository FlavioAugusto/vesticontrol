-- ════════════════════════════════════════════════════════════════
-- CORRIGIR token Melhor Envio (estava com valor invalido)
-- Token JWT valido ate 09/11/2027
-- ════════════════════════════════════════════════════════════════

UPDATE configuracoes
SET valor = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiYjcwZTdlNGZjYjllZjdjZjVkNzFiY2MyNDkyNDM3ZWNmNjQwYmE0NmYwNzYwOWMyY2Q4YTEyN2NkMjVmM2JhYWMxODZmZDkwNTU4ODlhNzQiLCJpYXQiOjE3NzgxODgwODUuNDYzMywibmJmIjoxNzc4MTg4MDg1LjQ2MzMwMiwiZXhwIjoxODA5NzI0MDg1LjQ1MjQ5Mywic3ViIjoiOWY4MjQxNzUtMThmMC00N2Q3LWI2OTktNTUzZGIwOTgxM2FkIiwic2NvcGVzIjpbImNhcnQtcmVhZCIsImNhcnQtd3JpdGUiLCJjb21wYW5pZXMtcmVhZCIsImNvbXBhbmllcy13cml0ZSIsImNvdXBvbnMtcmVhZCIsImNvdXBvbnMtd3JpdGUiLCJub3RpZmljYXRpb25zLXJlYWQiLCJvcmRlcnMtcmVhZCIsInByb2R1Y3RzLXJlYWQiLCJwcm9kdWN0cy1kZXN0cm95IiwicHJvZHVjdHMtd3JpdGUiLCJwdXJjaGFzZXMtcmVhZCIsInNoaXBwaW5nLWNhbGN1bGF0ZSIsInNoaXBwaW5nLWNhbmNlbCIsInNoaXBwaW5nLWNoZWNrb3V0Iiwic2hpcHBpbmctY29tcGFuaWVzIiwic2hpcHBpbmctZ2VuZXJhdGUiLCJzaGlwcGluZy1wcmV2aWV3Iiwic2hpcHBpbmctcHJpbnQiLCJzaGlwcGluZy1zaGFyZSIsInNoaXBwaW5nLXRyYWNraW5nIiwiZWNvbW1lcmNlLXNoaXBwaW5nIiwidHJhbnNhY3Rpb25zLXJlYWQiLCJ1c2Vycy1yZWFkIiwidXNlcnMtd3JpdGUiLCJ3ZWJob29rcy1yZWFkIiwid2ViaG9va3Mtd3JpdGUiLCJ3ZWJob29rcy1kZWxldGUiLCJ0ZGVhbGVyLXdlYmhvb2siXX0.CTW886svooab8CN8U_7gneswP2IFvUS5nVeXHYbAdInNQ7GNxCh7LEOWgyHSetfFxtw4fsYvBdaCgMNJDRtMp08I4rjObiJ4PTvqS3zrHil2rhvmF2qXR6ES8BllqecPLmu_zzxS7NrNvon0XQG09MTpitRf29JrXM2NzYjBRG0Ma87FDVoQZo9j3hq7WqQZ19uYXq_r4ek-Il-JYLWZ2GOybRhs4cRn-TuWmeMqA3ofUf_wJKfAJhjkem1wtyaSqOUZJwU-N8HioDjxFcB-xqBtywWLKRd-1d4vjoGY3fGOtKdlVC0E8lCOMLQI2Xlz-ywPQoJTBDwA6uPyLY_oDe70GK2uf0fpOQVkkTV9DZYujoC-fpupkYewIC_GYfrvUz1O7GJEQMcZ5nvNSeVqfbJs7YaaGwIdLTrD_mdHTccNSzPq25FAuGE3Ei5gaAeQL1vJLugK-6py-4DlvgSQa1fdCNCxRZ6sbJT02s1ZUXA5gWuaJxcopuQdmeJqTYqQrc4NaGW9RjUyfe43_sROMB7PhmaqL7QJeyVhdrUUx3oyRGXUD3IueijjZzl-8aSM1u7IXn3bqkbAlcnjGtyem34L1CMrWsm_jEBnQZvcJhAZlZPx1k1Dp0kpdP3lTLfXIKL4ZO2UPB0_1jLmNgtRRY_RZ9yiFERwIsQCQbUm1EU',
    updated_at = now()
WHERE chave = 'melhorenvio_token'
  AND loja_id = '00000000-0000-0000-0000-000000000001';

-- Verificação
SELECT chave, length(valor) AS tamanho_chars, substring(valor, 1, 50) AS preview
FROM configuracoes
WHERE chave = 'melhorenvio_token'
  AND loja_id = '00000000-0000-0000-0000-000000000001';
