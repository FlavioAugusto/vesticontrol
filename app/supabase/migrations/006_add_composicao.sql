-- Adicionar coluna composicao na tabela produtos
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS composicao TEXT DEFAULT 'Tricoline 100% Algodão';
