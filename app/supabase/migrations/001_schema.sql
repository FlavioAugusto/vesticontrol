-- By Marcelo Medeiros — Schema Principal
-- Cole no SQL Editor do Supabase: seu-projeto → SQL Editor → New Query

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL, slug TEXT UNIQUE NOT NULL,
  descricao TEXT, imagem_url TEXT, ativo BOOLEAN DEFAULT true, ordem INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, descricao TEXT,
  preco DECIMAL(10,2) NOT NULL, preco_antigo DECIMAL(10,2),
  categoria_id UUID REFERENCES categorias(id),
  badge TEXT CHECK (badge IN ('new','sale','exclusive',NULL)),
  ativo BOOLEAN DEFAULT true, destaque BOOLEAN DEFAULT false,
  peso_gramas INT DEFAULT 500,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE produto_variantes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE,
  tamanho TEXT NOT NULL, cor TEXT, cor_hex TEXT,
  estoque INT DEFAULT 0, sku TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE produto_imagens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE,
  url TEXT NOT NULL, alt TEXT, ordem INT DEFAULT 0, principal BOOLEAN DEFAULT false
);

CREATE TABLE clientes (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL, sobrenome TEXT, cpf TEXT, telefone TEXT, whatsapp TEXT,
  nascimento DATE, newsletter BOOLEAN DEFAULT true, vip BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE enderecos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL, cep TEXT NOT NULL, rua TEXT NOT NULL, numero TEXT NOT NULL,
  complemento TEXT, bairro TEXT NOT NULL, cidade TEXT NOT NULL, estado CHAR(2) NOT NULL,
  principal BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero SERIAL UNIQUE, cliente_id UUID REFERENCES clientes(id),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','processando','pago','separando','enviado','entregue','cancelado','reembolsado')),
  subtotal DECIMAL(10,2) NOT NULL, frete DECIMAL(10,2) DEFAULT 0, desconto DECIMAL(10,2) DEFAULT 0, total DECIMAL(10,2) NOT NULL,
  metodo_pagamento TEXT, status_pagamento TEXT DEFAULT 'aguardando', payment_id TEXT, payment_url TEXT,
  endereco_entrega_id UUID REFERENCES enderecos(id),
  transportadora TEXT, codigo_rastreio TEXT, cupom_codigo TEXT, cupom_desconto DECIMAL(10,2),
  observacoes TEXT, nota_interna TEXT,
  pago_em TIMESTAMPTZ, enviado_em TIMESTAMPTZ, entregue_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pedido_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos(id), variante_id UUID REFERENCES produto_variantes(id),
  nome_produto TEXT NOT NULL, tamanho TEXT, cor TEXT,
  quantidade INT NOT NULL, preco_unitario DECIMAL(10,2) NOT NULL, subtotal DECIMAL(10,2) NOT NULL
);

CREATE TABLE cupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT UNIQUE NOT NULL, tipo TEXT CHECK (tipo IN ('percentual','fixo','frete_gratis')),
  valor DECIMAL(10,2), uso_maximo INT, uso_atual INT DEFAULT 0, valor_minimo DECIMAL(10,2),
  ativo BOOLEAN DEFAULT true, valido_ate TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE lista_desejos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(), UNIQUE(cliente_id, produto_id)
);

CREATE TABLE avaliacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id), pedido_id UUID REFERENCES pedidos(id),
  nota INT CHECK (nota BETWEEN 1 AND 5), titulo TEXT, texto TEXT,
  aprovado BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE configuracoes (
  chave TEXT PRIMARY KEY, valor TEXT, tipo TEXT DEFAULT 'text', grupo TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  nome TEXT NOT NULL, nivel TEXT DEFAULT 'operador' CHECK (nivel IN ('super','admin','operador')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_variantes_produto ON produto_variantes(produto_id);

-- RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enderecos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lista_desejos ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE produto_imagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE produto_variantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cliente_select" ON clientes FOR SELECT USING (auth.uid() = id);
CREATE POLICY "cliente_update" ON clientes FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "cliente_insert" ON clientes FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "endereco_all" ON enderecos FOR ALL USING (auth.uid() = cliente_id);
CREATE POLICY "pedido_select" ON pedidos FOR SELECT USING (auth.uid() = cliente_id);
CREATE POLICY "pedido_insert" ON pedidos FOR INSERT WITH CHECK (auth.uid() = cliente_id);
CREATE POLICY "lista_desejos_all" ON lista_desejos FOR ALL USING (auth.uid() = cliente_id);
CREATE POLICY "produtos_public" ON produtos FOR SELECT USING (ativo = true);
CREATE POLICY "categorias_public" ON categorias FOR SELECT USING (ativo = true);
CREATE POLICY "imagens_public" ON produto_imagens FOR SELECT USING (true);
CREATE POLICY "variantes_public" ON produto_variantes FOR SELECT USING (true);
