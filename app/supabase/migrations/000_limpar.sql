-- ═══════════════════════════════════════════════════════════════════
-- ZERAR BANCO — Execute ANTES do 005_banco_completo_final.sql
-- CUIDADO: Remove todos os dados!
-- ═══════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS avaliacoes CASCADE;
DROP TABLE IF EXISTS lista_desejos CASCADE;
DROP TABLE IF EXISTS pedido_itens CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS enderecos CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS cupons CASCADE;
DROP TABLE IF EXISTS produto_imagens CASCADE;
DROP TABLE IF EXISTS produto_variantes CASCADE;
DROP TABLE IF EXISTS produtos CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS configuracoes CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- Limpar storage policies
DROP POLICY IF EXISTS "storage_public_read" ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_delete" ON storage.objects;
