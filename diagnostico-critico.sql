-- ════════════════════════════════════════════════════════════════
-- DIAGNÓSTICO CRÍTICO — esta é a causa do erro
-- Roda e ME manda o RESULTADO COMPLETO
-- ════════════════════════════════════════════════════════════════

-- 1. Marcelo ainda está em admins?
SELECT '=== ADMINS (deve ter Marcelo) ===' AS info;
SELECT id, loja_id, nome FROM admins;

-- 2. Marcelo ainda está em super_admins?
SELECT '=== SUPER_ADMINS ===' AS info;
SELECT * FROM super_admins;

-- 3. Quantas configurações By Marcelo tem?
SELECT '=== TOTAL DE CONFIGS BY MARCELO ===' AS info;
SELECT COUNT(*) AS total_configs
FROM configuracoes
WHERE loja_id = '00000000-0000-0000-0000-000000000001';

-- 4. Listar TODAS as configs da By Marcelo
SELECT '=== TODAS AS CONFIGS BY MARCELO ===' AS info;
SELECT chave, substring(coalesce(valor, ''), 1, 60) AS valor_preview
FROM configuracoes
WHERE loja_id = '00000000-0000-0000-0000-000000000001'
ORDER BY grupo, chave;

-- 5. Loja By Marcelo existe?
SELECT '=== LOJAS ===' AS info;
SELECT id, nome, slug, dominio, ativo FROM lojas;
