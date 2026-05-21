-- ═══════════════════════════════════════════════════════════════════
-- BY MARCELO MEDEIROS — BANCO DE DADOS COMPLETO E ATUALIZADO
-- Execute no SQL Editor do Supabase: supabase.com/dashboard/project/fyydywhsrtbgzlcwpkvd
-- ATENÇÃO: Executar APENAS em banco limpo (zerar com 000_limpar.sql antes)
-- ═══════════════════════════════════════════════════════════════════

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── CATEGORIAS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categorias (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  descricao   TEXT,
  imagem_url  TEXT,
  ativo       BOOLEAN DEFAULT true,
  ordem       INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── PRODUTOS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS produtos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,          -- Número do produto (ex: "77820")
  descricao     TEXT,
  preco         DECIMAL(10,2) NOT NULL,
  preco_antigo  DECIMAL(10,2),                 -- NULL = não exibir preço antigo
  categoria_id  UUID REFERENCES categorias(id) ON DELETE SET NULL,
  badge         TEXT CHECK (badge IN ('lancamento','bestseller','maisvendidos', NULL)),
  ativo         BOOLEAN DEFAULT true,
  destaque      BOOLEAN DEFAULT false,
  peso_gramas   INT NOT NULL DEFAULT 500,      -- Obrigatório para frete
  largura_cm    INT DEFAULT 20,                -- Para cálculo de frete
  altura_cm     INT DEFAULT 5,
  comprimento_cm INT DEFAULT 30,
  video_url     TEXT,                          -- URL YouTube ou MP4
  guia_tamanhos_id TEXT,                       -- Referência ao guia de tamanhos
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ─── VARIANTES (tamanho + cor + estoque) ────────────────────────────
CREATE TABLE IF NOT EXISTS produto_variantes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id  UUID REFERENCES produtos(id) ON DELETE CASCADE,
  tamanho     TEXT NOT NULL,
  cor         TEXT,
  cor_hex     TEXT,
  foto_url    TEXT,                            -- Foto da peça nessa cor específica
  estoque     INT DEFAULT 0 CHECK (estoque >= 0),
  sku         TEXT UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── IMAGENS DOS PRODUTOS (até 6 por produto) ───────────────────────
CREATE TABLE IF NOT EXISTS produto_imagens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id  UUID REFERENCES produtos(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  alt         TEXT,
  ordem       INT DEFAULT 0,
  principal   BOOLEAN DEFAULT false
);

-- ─── CLIENTES (extends auth.users) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  sobrenome   TEXT,
  cpf         TEXT,
  telefone    TEXT,
  whatsapp    TEXT,
  nascimento  DATE,
  newsletter  BOOLEAN DEFAULT true,
  vip         BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── ENDEREÇOS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enderecos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id  UUID REFERENCES clientes(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL DEFAULT 'Principal',
  cep         TEXT NOT NULL,
  rua         TEXT NOT NULL,
  numero      TEXT NOT NULL,
  complemento TEXT,
  bairro      TEXT NOT NULL,
  cidade      TEXT NOT NULL,
  estado      CHAR(2) NOT NULL,
  principal   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── PEDIDOS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pedidos (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero              SERIAL UNIQUE,
  cliente_id          UUID REFERENCES clientes(id) ON DELETE SET NULL,
  -- Dados do cliente (guest checkout)
  cliente_nome        TEXT,
  cliente_email       TEXT,
  cliente_cpf         TEXT,
  cliente_telefone    TEXT,
  -- Valores
  status              TEXT DEFAULT 'pendente'
                      CHECK (status IN ('pendente','processando','pago','separando','enviado','entregue','cancelado','reembolsado')),
  subtotal            DECIMAL(10,2) NOT NULL,
  frete               DECIMAL(10,2) DEFAULT 0,
  desconto            DECIMAL(10,2) DEFAULT 0,
  total               DECIMAL(10,2) NOT NULL,
  -- Pagamento
  metodo_pagamento    TEXT,
  status_pagamento    TEXT DEFAULT 'aguardando',
  payment_id          TEXT,
  payment_url         TEXT,
  parcelas            INT DEFAULT 1,
  -- Frete
  cep_entrega         TEXT,
  endereco_entrega    TEXT,                    -- JSON com dados completos
  transportadora      TEXT,
  codigo_rastreio     TEXT,
  -- Cupom
  cupom_codigo        TEXT,
  cupom_desconto      DECIMAL(10,2),
  -- Datas
  pago_em             TIMESTAMPTZ,
  enviado_em          TIMESTAMPTZ,
  entregue_em         TIMESTAMPTZ,
  -- Controle
  observacoes         TEXT,
  nota_interna        TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ─── ITENS DO PEDIDO ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pedido_itens (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id       UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id      UUID REFERENCES produtos(id) ON DELETE SET NULL,
  variante_id     UUID REFERENCES produto_variantes(id) ON DELETE SET NULL,
  nome_produto    TEXT NOT NULL,
  tamanho         TEXT,
  cor             TEXT,
  quantidade      INT NOT NULL CHECK (quantidade > 0),
  preco_unitario  DECIMAL(10,2) NOT NULL,
  subtotal        DECIMAL(10,2) NOT NULL
);

-- ─── CUPONS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cupons (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo          TEXT UNIQUE NOT NULL,
  tipo            TEXT CHECK (tipo IN ('percentual','fixo','frete_gratis')),
  valor           DECIMAL(10,2),
  uso_maximo      INT,
  uso_atual       INT DEFAULT 0,
  valor_minimo    DECIMAL(10,2),
  ativo           BOOLEAN DEFAULT true,
  valido_ate      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── LISTA DE DESEJOS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lista_desejos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id  UUID REFERENCES clientes(id) ON DELETE CASCADE,
  produto_id  UUID REFERENCES produtos(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cliente_id, produto_id)
);

-- ─── AVALIAÇÕES ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS avaliacoes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id  UUID REFERENCES produtos(id) ON DELETE CASCADE,
  cliente_id  UUID REFERENCES clientes(id) ON DELETE SET NULL,
  pedido_id   UUID REFERENCES pedidos(id) ON DELETE SET NULL,
  nota        INT CHECK (nota BETWEEN 1 AND 5),
  titulo      TEXT,
  texto       TEXT,
  aprovado    BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── CONFIGURAÇÕES DA LOJA ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS configuracoes (
  chave      TEXT PRIMARY KEY,
  valor      TEXT,
  tipo       TEXT DEFAULT 'text',
  grupo      TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── ADMINS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  nivel       TEXT DEFAULT 'operador' CHECK (nivel IN ('super','admin','operador')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════
-- ÍNDICES (performance)
-- ═══════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_destaque ON produtos(destaque);
CREATE INDEX IF NOT EXISTS idx_produtos_slug ON produtos(slug);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_created ON pedidos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_variantes_produto ON produto_variantes(produto_id);
CREATE INDEX IF NOT EXISTS idx_imagens_produto ON produto_imagens(produto_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_produto ON avaliacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_aprovado ON avaliacoes(aprovado);

-- ═══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════

-- Habilitar RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enderecos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE lista_desejos ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE produto_imagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE produto_variantes ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (catálogo)
CREATE POLICY "produtos_public_read"      ON produtos FOR SELECT USING (ativo = true);
CREATE POLICY "categorias_public_read"    ON categorias FOR SELECT USING (ativo = true);
CREATE POLICY "imagens_public_read"       ON produto_imagens FOR SELECT USING (true);
CREATE POLICY "variantes_public_read"     ON produto_variantes FOR SELECT USING (true);
CREATE POLICY "avaliacoes_public_read"    ON avaliacoes FOR SELECT USING (aprovado = true);

-- Políticas do cliente (dados próprios)
CREATE POLICY "cliente_read_own"          ON clientes FOR SELECT USING (auth.uid() = id);
CREATE POLICY "cliente_insert_own"        ON clientes FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "cliente_update_own"        ON clientes FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "endereco_all_own"          ON enderecos FOR ALL USING (auth.uid() = cliente_id);
CREATE POLICY "pedido_read_own"           ON pedidos FOR SELECT USING (auth.uid() = cliente_id);
CREATE POLICY "pedido_insert_own"         ON pedidos FOR INSERT WITH CHECK (true); -- guest checkout
CREATE POLICY "pedido_itens_read_own"     ON pedido_itens FOR SELECT
  USING (pedido_id IN (SELECT id FROM pedidos WHERE cliente_id = auth.uid()));
CREATE POLICY "lista_desejos_all_own"     ON lista_desejos FOR ALL USING (auth.uid() = cliente_id);
CREATE POLICY "avaliacao_insert_own"      ON avaliacoes FOR INSERT WITH CHECK (auth.uid() = cliente_id);

-- ═══════════════════════════════════════════════════════════════════
-- STORAGE BUCKETS
-- ═══════════════════════════════════════════════════════════════════

-- Criar buckets públicos para upload de imagens
INSERT INTO storage.buckets (id, name, public) VALUES ('imagens', 'imagens', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas do storage
CREATE POLICY "storage_public_read"
  ON storage.objects FOR SELECT USING (bucket_id = 'imagens');

CREATE POLICY "storage_auth_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'imagens' AND auth.role() = 'authenticated');

CREATE POLICY "storage_auth_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'imagens' AND auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════════════════════
-- DADOS INICIAIS
-- ═══════════════════════════════════════════════════════════════════

-- Categorias
INSERT INTO categorias (nome, slug, descricao, ordem) VALUES
  ('Vestidos Conjuntos', 'conjuntos', 'Conjuntos coordenados de alta costura em tricoline 100% algodão', 1),
  ('Vestidos Midi',      'midi',      'Vestidos midi elegantes e versáteis para todas as ocasiões',      2),
  ('Vestidos Longos',    'longos',    'Vestidos longos para ocasiões especiais e eventos',               3)
ON CONFLICT (slug) DO NOTHING;

-- Configurações da loja
INSERT INTO configuracoes (chave, valor, grupo) VALUES
  -- Identidade
  ('loja_nome',                'By Marcelo Medeiros',                          'loja'),
  ('loja_logo_url',            '/images/logo.svg',                             'loja'),
  ('loja_email',               'contato@bymarcelomedeiros.com.br',             'loja'),
  -- Contato (InfoBar)
  ('loja_telefone',            '(81) 99422-8240',                              'contato'),
  ('loja_whatsapp',            '81994228240',                                  'contato'),
  ('loja_instagram',           '@by.marcelomedeiros',                          'contato'),
  ('loja_horario_atendimento', 'Seg–Sex: 08:00–18:00 | Sáb e Dom: sem atendimento', 'contato'),
  -- TopBar
  ('topbar_texto',             'FRETE GRÁTIS NA PRIMEIRA COMPRA',             'topbar'),
  ('topbar_ativo',             'true',                                         'topbar'),
  -- Frete
  ('loja_cep_origem',          '55002-000',                                    'frete'),
  ('frete_gratis_minimo',      '499.90',                                       'frete'),
  ('melhorenvio_ativo',        'false',                                        'frete'),
  -- Pagamento
  ('parcelas_sem_juros',       '6',                                            'pagamento'),
  ('pagamento_pix_desconto',   '15',                                           'pagamento'),
  ('pagamento_finalizar_no_site', 'false',                                     'pagamento'),
  ('mercadopago_ativo',        'false',                                        'pagamento'),
  ('infinitepay_ativo',        'false',                                        'pagamento'),
  -- Rodapé
  ('rodape_texto',             'Com 12 anos de tradição no Polo de Confecções de Caruaru, levamos moda feminina autoral direto da nossa fábrica para o seu guarda-roupa.', 'rodape'),
  ('rodape_endereco',          'Caruaru, Pernambuco — Brasil',                 'rodape'),
  ('rodape_rua',               'Rua Dário da Silva, 84, Salgado - Caruaru/PE','rodape'),
  ('rodape_cnpj',              '48.065.930/0001-50',                           'rodape'),
  ('rodape_horario',           'Seg–Sex: 08:00–18:00 | Sáb e Dom: sem atendimento', 'rodape'),
  ('rodape_credito',           'Loja Virtual criada com By Marcelo Medeiros',  'rodape'),
  -- SEO
  ('seo_titulo',               'By Marcelo Medeiros — Moda Feminina Premium em Caruaru', 'seo'),
  ('seo_descricao',            'Vestidos e conjuntos de alta costura em tricoline 100% algodão, direto do Polo de Confecções de Caruaru para o Brasil.', 'seo')
ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = now();

-- Cupons iniciais
INSERT INTO cupons (codigo, tipo, valor, uso_maximo, valor_minimo, ativo, valido_ate) VALUES
  ('BEMVINDO10',  'percentual',  10,   500, 199.00, true, now() + interval '6 months'),
  ('FRETEGRATIS', 'frete_gratis', null, 200, 299.00, true, now() + interval '3 months'),
  ('PRIMEIRA50',  'fixo',        50,   100, 399.00, true, now() + interval '1 month')
ON CONFLICT (codigo) DO NOTHING;
