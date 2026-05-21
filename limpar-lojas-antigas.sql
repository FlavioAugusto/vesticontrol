-- ════════════════════════════════════════════════════════════════
-- LIMPAR DADOS DE LOJAS ANTIGAS (Lorvi, Maria, etc)
-- CUIDADO: irreversível! Faça backup antes.
-- ════════════════════════════════════════════════════════════════

-- 1. PRIMEIRO: ver o que vai ser apagado
SELECT '=== ADMINS QUE NÃO SÃO DA BY MARCELO ===' AS info;
SELECT id, loja_id, nome FROM admins
WHERE loja_id != '00000000-0000-0000-0000-000000000001';

SELECT '=== LOJAS QUE NÃO SÃO BY MARCELO ===' AS info;
SELECT id, nome, slug, dominio FROM lojas
WHERE id != '00000000-0000-0000-0000-000000000001';

SELECT '=== CONFIGS DE LOJAS ANTIGAS ===' AS info;
SELECT loja_id, COUNT(*) AS configs FROM configuracoes
WHERE loja_id != '00000000-0000-0000-0000-000000000001'
GROUP BY loja_id;

-- 2. SE estiver tudo certo, DESCOMENTE as linhas abaixo pra apagar:

/*
-- Apaga configs de outras lojas
DELETE FROM configuracoes WHERE loja_id != '00000000-0000-0000-0000-000000000001';

-- Apaga admins de outras lojas
DELETE FROM admins WHERE loja_id != '00000000-0000-0000-0000-000000000001';

-- Apaga outras lojas (mantém apenas By Marcelo)
DELETE FROM lojas WHERE id != '00000000-0000-0000-0000-000000000001';
*/

-- 3. CONFIRMAÇÃO depois da limpeza
SELECT '=== APÓS LIMPEZA ===' AS info;
SELECT COUNT(*) AS lojas_restantes FROM lojas;
SELECT COUNT(*) AS admins_restantes FROM admins;
