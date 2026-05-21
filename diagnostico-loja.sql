-- ════════════════════════════════════════════════════════════════
-- DIAGNÓSTICO: Por que as configurações somem?
-- Rode esse SQL no Supabase e me mande o resultado
-- ════════════════════════════════════════════════════════════════

-- 1. Marcelo está em super_admins?
SELECT 'super_admins' AS tabela, id, created_at FROM super_admins;

-- 2. Marcelo está em admins? Qual é o loja_id dele?
SELECT 'admins' AS tabela, id, loja_id, nome, nivel FROM admins;

-- 3. Quais lojas existem na tabela lojas?
SELECT 'lojas' AS tabela, id, nome, slug, dominio FROM lojas;

-- 4. Configurações salvas (todos os loja_ids existentes)
SELECT loja_id, COUNT(*) AS total_chaves
FROM configuracoes
GROUP BY loja_id
ORDER BY total_chaves DESC;

-- 5. Lista o loja_nome de cada loja_id em configuracoes
SELECT loja_id, valor AS loja_nome_salvo
FROM configuracoes
WHERE chave = 'loja_nome';
