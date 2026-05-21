-- ═══════════════════════════════════════════════════════════════
-- MIGRAÇÃO MULTI-TENANT (SaaS White-Label)
-- Data: 2026-05-08
-- ═══════════════════════════════════════════════════════════════
-- Esta migração transforma o sistema em SaaS multi-tenant.
-- Cada loja (cliente) terá seus próprios dados isolados por loja_id.
-- A loja "By Marcelo Medeiros" (já existente) vira a primeira loja.
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. TABELA MESTRE DE LOJAS (TENANTS) ───
CREATE TABLE IF NOT EXISTS lojas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,    -- 'bymarcelomedeiros', 'fashionstore'
  dominio         TEXT UNIQUE,              -- 'bymarcelomedeiros.com' (custom domain)
  email_admin     TEXT NOT NULL,
  telefone_admin  TEXT,
  -- Plano e status
  plano           TEXT DEFAULT 'starter' CHECK (plano IN ('trial','starter','professional','premium')),
  ativo           BOOLEAN DEFAULT true,
  -- Trial e cobrança
  trial_ate       TIMESTAMPTZ,              -- fim do período de teste
  expira_em       TIMESTAMPTZ,              -- vencimento da assinatura
  -- Limites por plano
  limite_produtos INT DEFAULT 50,
  limite_pedidos  INT DEFAULT 100,
  -- Metadados
  observacoes     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lojas_slug ON lojas(slug);
CREATE INDEX IF NOT EXISTS idx_lojas_dominio ON lojas(dominio);
CREATE INDEX IF NOT EXISTS idx_lojas_ativo ON lojas(ativo);

-- ─── 2. INSERIR LOJA PADRÃO (By Marcelo Medeiros) ───
-- Cria a primeira loja (ID fixo para facilitar migração de dados existentes)
INSERT INTO lojas (id, nome, slug, dominio, email_admin, plano, ativo)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'By Marcelo Medeiros',
  'bymarcelomedeiros',
  NULL,
  'contato@bymarcelomedeiros.com.br',
  'premium',
  true
)
ON CONFLICT (id) DO NOTHING;

-- ─── 3. ADICIONAR loja_id EM TODAS AS TABELAS ───

-- Produtos
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE;
UPDATE produtos SET loja_id = '00000000-0000-0000-0000-000000000001' WHERE loja_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_produtos_loja ON produtos(loja_id);

-- Categorias
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE;
UPDATE categorias SET loja_id = '00000000-0000-0000-0000-000000000001' WHERE loja_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_categorias_loja ON categorias(loja_id);

-- Variantes
ALTER TABLE produto_variantes ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE;
UPDATE produto_variantes SET loja_id = '00000000-0000-0000-0000-000000000001' WHERE loja_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_produto_variantes_loja ON produto_variantes(loja_id);

-- Imagens
ALTER TABLE produto_imagens ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE;
UPDATE produto_imagens SET loja_id = '00000000-0000-0000-0000-000000000001' WHERE loja_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_produto_imagens_loja ON produto_imagens(loja_id);

-- Clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE;
UPDATE clientes SET loja_id = '00000000-0000-0000-0000-000000000001' WHERE loja_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_loja ON clientes(loja_id);

-- Endereços
ALTER TABLE enderecos ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE;
UPDATE enderecos SET loja_id = '00000000-0000-0000-0000-000000000001' WHERE loja_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_enderecos_loja ON enderecos(loja_id);

-- Pedidos
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE;
UPDATE pedidos SET loja_id = '00000000-0000-0000-0000-000000000001' WHERE loja_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_pedidos_loja ON pedidos(loja_id);

-- Itens de pedido
ALTER TABLE pedido_itens ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE;
UPDATE pedido_itens SET loja_id = '00000000-0000-0000-0000-000000000001' WHERE loja_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_pedido_itens_loja ON pedido_itens(loja_id);

-- Cupons
ALTER TABLE cupons ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE;
UPDATE cupons SET loja_id = '00000000-0000-0000-0000-000000000001' WHERE loja_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_cupons_loja ON cupons(loja_id);

-- Lista de desejos
ALTER TABLE lista_desejos ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE;
UPDATE lista_desejos SET loja_id = '00000000-0000-0000-0000-000000000001' WHERE loja_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_lista_desejos_loja ON lista_desejos(loja_id);

-- Avaliações
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE;
UPDATE avaliacoes SET loja_id = '00000000-0000-0000-0000-000000000001' WHERE loja_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_avaliacoes_loja ON avaliacoes(loja_id);

-- Configurações (CRÍTICO: cada loja tem suas próprias configs)
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE;
UPDATE configuracoes SET loja_id = '00000000-0000-0000-0000-000000000001' WHERE loja_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_configuracoes_loja ON configuracoes(loja_id);

-- Adminstradores também ficam vinculados a uma loja
ALTER TABLE admins ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE;
UPDATE admins SET loja_id = '00000000-0000-0000-0000-000000000001' WHERE loja_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_admins_loja ON admins(loja_id);

-- ─── 4. SUPER ADMIN (você que controla todas as lojas) ───
CREATE TABLE IF NOT EXISTS super_admins (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── 5. AJUSTAR UNIQUE CONSTRAINTS para serem POR LOJA ───
-- Slugs de produtos podem repetir entre lojas diferentes
DO $$ BEGIN
  ALTER TABLE produtos DROP CONSTRAINT IF EXISTS produtos_slug_key;
  ALTER TABLE produtos ADD CONSTRAINT produtos_slug_loja_unique UNIQUE (slug, loja_id);
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE categorias DROP CONSTRAINT IF EXISTS categorias_slug_key;
  ALTER TABLE categorias ADD CONSTRAINT categorias_slug_loja_unique UNIQUE (slug, loja_id);
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE cupons DROP CONSTRAINT IF EXISTS cupons_codigo_key;
  ALTER TABLE cupons ADD CONSTRAINT cupons_codigo_loja_unique UNIQUE (codigo, loja_id);
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE configuracoes DROP CONSTRAINT IF EXISTS configuracoes_pkey;
  ALTER TABLE configuracoes ADD CONSTRAINT configuracoes_chave_loja_pkey PRIMARY KEY (chave, loja_id);
EXCEPTION WHEN duplicate_table THEN NULL; END $$;
