#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  BY MARCELO MEDEIROS — Script de Setup Automático
#  Execute: chmod +x setup.sh && ./setup.sh
# ═══════════════════════════════════════════════════════════

set -e  # Parar se qualquer comando falhar

echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║   BY MARCELO MEDEIROS — Setup Automático     ║"
echo "║   E-commerce Completo com Next.js 14          ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""

# ─── 1. Verificar Node.js ───
echo "▶ Verificando Node.js..."
NODE_VERSION=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18+ é necessário. Instale em: https://nodejs.org"
  exit 1
fi
echo "✅ Node.js $(node -v) encontrado"

# ─── 2. Criar projeto Next.js ───
echo ""
echo "▶ Criando projeto Next.js 14..."
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-git \
  2>/dev/null || echo "⚠ Projeto já existe, continuando..."

# ─── 3. Instalar dependências ───
echo ""
echo "▶ Instalando dependências..."
npm install \
  @supabase/supabase-js \
  @supabase/ssr \
  mercadopago \
  zustand \
  react-hot-toast \
  next-themes \
  @radix-ui/react-dialog \
  @radix-ui/react-select \
  @radix-ui/react-switch \
  @radix-ui/react-tabs \
  @radix-ui/react-tooltip \
  recharts \
  swiper \
  react-hook-form \
  zod \
  @hookform/resolvers \
  date-fns \
  clsx \
  tailwind-merge \
  lucide-react \
  --save

echo "✅ Dependências instaladas"

# ─── 4. Criar estrutura de pastas ───
echo ""
echo "▶ Criando estrutura de pastas..."

# App Router
mkdir -p src/app/\(shop\)/produtos/\[slug\]
mkdir -p src/app/\(shop\)/categorias/\[categoria\]
mkdir -p src/app/\(shop\)/carrinho
mkdir -p src/app/\(shop\)/checkout/sucesso
mkdir -p src/app/\(auth\)/login
mkdir -p src/app/\(auth\)/cadastro
mkdir -p src/app/admin/produtos/novo
mkdir -p src/app/admin/pedidos
mkdir -p src/app/admin/clientes
mkdir -p src/app/admin/relatorios
mkdir -p src/app/admin/configuracoes
mkdir -p src/app/api/mercadopago/checkout
mkdir -p src/app/api/mercadopago/webhook
mkdir -p src/app/api/infinitepay/checkout
mkdir -p src/app/api/frete/calcular
mkdir -p src/app/api/produtos

# Components
mkdir -p src/components/layout
mkdir -p src/components/shop
mkdir -p src/components/checkout
mkdir -p src/components/admin
mkdir -p src/components/ui

# Lib
mkdir -p src/lib/supabase

# Hooks, Store, Types
mkdir -p src/hooks
mkdir -p src/store
mkdir -p src/types

# Supabase migrations
mkdir -p supabase/migrations

# Public
mkdir -p public/images/produtos
mkdir -p public/images/banners

echo "✅ Estrutura de pastas criada"

# ─── 5. Criar .env.local ───
echo ""
echo "▶ Criando .env.local template..."

if [ ! -f .env.local ]; then
cat > .env.local << 'EOF'
# ══════════════════════════════════════════
# SUPABASE — https://supabase.com
# ══════════════════════════════════════════
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=eyJ...SERVICE_ROLE_KEY

# ══════════════════════════════════════════
# MERCADO PAGO — https://mercadopago.com.br/developers
# ══════════════════════════════════════════
MERCADOPAGO_ACCESS_TOKEN=APP_USR-SEU_TOKEN
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-SEU_PUBLIC_KEY

# ══════════════════════════════════════════
# INFINITEPAY — https://infinitepay.io/developers
# ══════════════════════════════════════════
INFINITEPAY_CLIENT_ID=seu_client_id
INFINITEPAY_CLIENT_SECRET=seu_client_secret
INFINITEPAY_API_URL=https://api.infinitepay.io

# ══════════════════════════════════════════
# MELHOR ENVIO — https://melhorenvio.com.br
# ══════════════════════════════════════════
MELHORENVIO_TOKEN=eyJ...SEU_TOKEN
MELHORENVIO_API_URL=https://melhorenvio.com.br/api/v2
MELHORENVIO_SANDBOX_URL=https://sandbox.melhorenvio.com.br/api/v2

# ══════════════════════════════════════════
# APP
# ══════════════════════════════════════════
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=gere-com-openssl-rand-base64-32
WEBHOOK_SECRET=outro-secret-seguro

# ══════════════════════════════════════════
# EMAIL — Resend (opcional)
# https://resend.com
# ══════════════════════════════════════════
RESEND_API_KEY=re_SEU_KEY
EMAIL_FROM=noreply@bymarcelomedeiros.com.br
EOF
echo "✅ .env.local criado — PREENCHA AS VARIÁVEIS!"
else
  echo "⚠ .env.local já existe, mantendo..."
fi

# ─── 6. Criar .env.example ───
cat > .env.example << 'EOF'
# Copie este arquivo para .env.local e preencha os valores
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MERCADOPAGO_ACCESS_TOKEN=
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=
INFINITEPAY_CLIENT_ID=
INFINITEPAY_CLIENT_SECRET=
INFINITEPAY_API_URL=https://api.infinitepay.io
MELHORENVIO_TOKEN=
MELHORENVIO_API_URL=https://melhorenvio.com.br/api/v2
MELHORENVIO_SANDBOX_URL=https://sandbox.melhorenvio.com.br/api/v2
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=
WEBHOOK_SECRET=
RESEND_API_KEY=
EMAIL_FROM=
EOF

# ─── 7. Criar .gitignore ───
cat > .gitignore << 'EOF'
# Dependências
node_modules/
.pnp
.pnp.js

# Build
.next/
dist/
out/
build/

# Ambiente — NUNCA commitar!
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Sistema
.DS_Store
*.pem
Thumbs.db

# IDEs
.idea/
.vscode/
*.swp
*.swo

# Supabase local
supabase/.branches
supabase/.temp
EOF

# ─── 8. Criar next.config.js ───
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
};

module.exports = nextConfig;
EOF

# ─── 9. Criar tailwind.config.js com cores da marca ───
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50:  '#fdf8ef',
          100: '#f9edcf',
          200: '#f3d99e',
          300: '#ecbf65',
          400: '#e5a43a',
          DEFAULT: '#b89155',
          600: '#9a7340',
          700: '#7a5a31',
          800: '#5c4224',
          900: '#3a2914',
        },
        cream: {
          DEFAULT: '#faf9f7',
          dark:    '#f4efe8',
          darker:  '#ece5da',
        },
        charcoal: {
          DEFAULT: '#1e1a16',
          light:   '#3a3530',
          muted:   '#8a857e',
        },
        rose:    '#c4848c',
        sage:    '#7a8c72',
      },
      fontFamily: {
        display: ['Italiana', 'serif'],
        serif:   ['Playfair Display', 'serif'],
        sans:    ['Nunito Sans', 'sans-serif'],
      },
      animation: {
        'fade-up':   'fadeUp 0.5s cubic-bezier(0.23, 1, 0.32, 1) both',
        'slide-in':  'slideIn 0.4s cubic-bezier(0.23, 1, 0.32, 1) both',
        'zoom-in':   'zoomIn 0.3s ease both',
        'float':     'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeUp:  { from: { opacity: '0', transform: 'translateY(24px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideIn: { from: { opacity: '0', transform: 'translateX(100%)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        zoomIn:  { from: { opacity: '0', transform: 'scale(0.97)' },      to: { opacity: '1', transform: 'scale(1)' } },
        float:   { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
      },
      boxShadow: {
        'gold':    '0 4px 24px rgba(184, 145, 85, 0.25)',
        'gold-lg': '0 8px 40px rgba(184, 145, 85, 0.35)',
      },
      screens: {
        'xs': '480px',
      },
    },
  },
  plugins: [],
};
EOF

# ─── 10. Criar SQL de migrations ───
echo ""
echo "▶ Criando arquivos SQL de migrations..."

cat > supabase/migrations/001_schema.sql << 'SQLEOF'
-- By Marcelo Medeiros — Schema Principal
-- Cole este SQL no Editor SQL do Supabase (supabase.com → seu projeto → SQL Editor)

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

CREATE POLICY "cliente_select" ON clientes FOR SELECT USING (auth.uid() = id);
CREATE POLICY "cliente_update" ON clientes FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "cliente_insert" ON clientes FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "endereco_all" ON enderecos FOR ALL USING (auth.uid() = cliente_id);
CREATE POLICY "pedido_select" ON pedidos FOR SELECT USING (auth.uid() = cliente_id);
CREATE POLICY "pedido_insert" ON pedidos FOR INSERT WITH CHECK (auth.uid() = cliente_id);
CREATE POLICY "lista_desejos_all" ON lista_desejos FOR ALL USING (auth.uid() = cliente_id);

ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE produto_imagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE produto_variantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "produtos_public" ON produtos FOR SELECT USING (ativo = true);
CREATE POLICY "categorias_public" ON categorias FOR SELECT USING (ativo = true);
CREATE POLICY "imagens_public" ON produto_imagens FOR SELECT USING (true);
CREATE POLICY "variantes_public" ON produto_variantes FOR SELECT USING (true);
SQLEOF

cat > supabase/migrations/002_seed.sql << 'SQLEOF'
-- Dados iniciais
INSERT INTO categorias (nome, slug, descricao, ordem) VALUES
  ('Vestidos Conjuntos', 'conjuntos', 'Conjuntos coordenados de alta costura', 1),
  ('Vestidos Midi', 'midi', 'Vestidos midi elegantes e versáteis', 2),
  ('Vestidos Longos', 'longos', 'Vestidos longos para ocasiões especiais', 3);

INSERT INTO configuracoes (chave, valor, grupo) VALUES
  ('loja_nome', 'By Marcelo Medeiros', 'loja'),
  ('loja_cnpj', '00.000.000/0001-00', 'loja'),
  ('loja_email', 'contato@bymarcelomedeiros.com.br', 'loja'),
  ('loja_whatsapp', '81999999999', 'loja'),
  ('loja_instagram', '@bymarcelomedeiros', 'loja'),
  ('loja_cep_origem', '55000-000', 'frete'),
  ('frete_gratis_minimo', '399.00', 'frete'),
  ('parcelas_sem_juros', '12', 'pagamento'),
  ('mercadopago_ativo', 'true', 'pagamento'),
  ('infinitepay_ativo', 'true', 'pagamento'),
  ('melhorenvio_ativo', 'true', 'frete');
SQLEOF

echo "✅ Migrations SQL criadas"

# ─── 11. Criar Dockerfile ───
cat > Dockerfile << 'EOF'
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
EOF

# ─── 12. Init git ───
echo ""
echo "▶ Inicializando Git..."
git init 2>/dev/null || true
git add .gitignore 2>/dev/null || true
git commit -m "chore: setup inicial By Marcelo Medeiros" 2>/dev/null || true
echo "✅ Git inicializado"

# ─── CONCLUÍDO ───
echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║        ✅ SETUP CONCLUÍDO COM SUCESSO!            ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "  1. Preencha o .env.local com suas chaves:"
echo "     nano .env.local"
echo ""
echo "  2. Crie o projeto no Supabase (supabase.com)"
echo "     Cole o SQL de supabase/migrations/001_schema.sql"
echo "     Cole o SQL de supabase/migrations/002_seed.sql"
echo ""
echo "  3. Abra o Claude Code nesta pasta:"
echo "     claude"
echo ""
echo "  4. No Claude Code, diga:"
echo "     'Leia o CLAUDE.md e vamos começar pela Fase 1'"
echo ""
echo "  5. Rodar em desenvolvimento:"
echo "     npm run dev → http://localhost:3000"
echo ""
echo "═══════════════════════════════════════════════════"
echo "  By Marcelo Medeiros · Desenvolvido por Flávio"
echo "═══════════════════════════════════════════════════"
echo ""
