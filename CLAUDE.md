# 🛍️ BY MARCELO MEDEIROS — E-commerce Completo
## Instruções Completas para Claude Code

> **Leia este arquivo inteiro antes de escrever qualquer linha de código.**
> Este é o mapa completo do projeto. Siga à risca.

---

## 🎯 OBJETIVO DO PROJETO

Construir um e-commerce completo de moda feminina para a marca **By Marcelo Medeiros**
com vitrine premium, painel admin completo, integrações reais de pagamento e frete,
autenticação segura e deploy no EasyPanel (VPS Hostinger).

**Stack:** Next.js 14 + Supabase + Tailwind CSS + Mercado Pago + InfinitePay + Melhor Envio

---

## 📁 ESTRUTURA DO PROJETO

```
by-marcelo-medeiros/
├── CLAUDE.md                    ← Este arquivo (leia SEMPRE ao iniciar)
├── .claude-progress.md          ← Memória de progresso (atualizar a cada sessão)
├── .env.local                   ← Variáveis de ambiente (NÃO commitar)
├── .env.example                 ← Template das variáveis (commitar)
├── .gitignore
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── middleware.ts                 ← Proteção de rotas
│
├── supabase/
│   ├── migrations/              ← SQL de criação do banco
│   │   ├── 001_schema.sql
│   │   └── 002_seed.sql
│   └── seed.ts
│
├── src/
│   ├── app/                     ← Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx             ← Home da loja
│   │   ├── (shop)/
│   │   │   ├── produtos/
│   │   │   │   ├── page.tsx     ← Listagem de produtos
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx ← Página do produto
│   │   │   ├── categorias/
│   │   │   │   └── [categoria]/
│   │   │   │       └── page.tsx
│   │   │   ├── carrinho/
│   │   │   │   └── page.tsx
│   │   │   └── checkout/
│   │   │       ├── page.tsx
│   │   │       └── sucesso/
│   │   │           └── page.tsx
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── cadastro/
│   │   │       └── page.tsx
│   │   │
│   │   ├── admin/               ← PAINEL ADMIN (protegido)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx         ← Dashboard
│   │   │   ├── produtos/
│   │   │   │   ├── page.tsx
│   │   │   │   └── novo/
│   │   │   │       └── page.tsx
│   │   │   ├── pedidos/
│   │   │   │   └── page.tsx
│   │   │   ├── clientes/
│   │   │   │   └── page.tsx
│   │   │   ├── relatorios/
│   │   │   │   └── page.tsx
│   │   │   └── configuracoes/
│   │   │       └── page.tsx
│   │   │
│   │   └── api/                 ← API Routes
│   │       ├── mercadopago/
│   │       │   ├── checkout/
│   │       │   │   └── route.ts
│   │       │   └── webhook/
│   │       │       └── route.ts
│   │       ├── infinitepay/
│   │       │   └── checkout/
│   │       │       └── route.ts
│   │       ├── frete/
│   │       │   └── calcular/
│   │       │       └── route.ts
│   │       └── produtos/
│   │           └── route.ts
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── MobileMenu.tsx
│   │   ├── shop/
│   │   │   ├── Hero.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── ProductModal.tsx
│   │   │   ├── CategoryCard.tsx
│   │   │   ├── CartSidebar.tsx
│   │   │   ├── FilterBar.tsx
│   │   │   ├── TrustBar.tsx
│   │   │   ├── Reviews.tsx
│   │   │   └── Newsletter.tsx
│   │   ├── checkout/
│   │   │   ├── CheckoutForm.tsx
│   │   │   ├── PaymentSelector.tsx
│   │   │   ├── ShippingCalculator.tsx
│   │   │   └── OrderSummary.tsx
│   │   ├── admin/
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   ├── OrderDetail.tsx
│   │   │   └── Charts.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       ├── Toast.tsx
│   │       ├── Badge.tsx
│   │       └── Toggle.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        ← Supabase client-side
│   │   │   ├── server.ts        ← Supabase server-side
│   │   │   └── admin.ts         ← Supabase admin (service role)
│   │   ├── mercadopago.ts       ← MercadoPago SDK
│   │   ├── infinitepay.ts       ← InfinitePay API
│   │   ├── melhorenvio.ts       ← Melhor Envio API
│   │   └── utils.ts
│   │
│   ├── hooks/
│   │   ├── useCart.ts           ← Carrinho (Zustand)
│   │   ├── useAuth.ts           ← Autenticação
│   │   ├── useProducts.ts       ← Produtos
│   │   └── useToast.ts
│   │
│   ├── store/
│   │   ├── cartStore.ts         ← Zustand store do carrinho
│   │   └── uiStore.ts
│   │
│   └── types/
│       ├── database.ts          ← Tipos gerados pelo Supabase
│       └── index.ts
│
└── public/
    ├── favicon.ico
    └── images/
```

---

## 🗄️ BANCO DE DADOS — SUPABASE (PostgreSQL)

### Criar as tabelas nesta ordem exata:

```sql
-- ═══════════════════════════════════════
-- ARQUIVO: supabase/migrations/001_schema.sql
-- ═══════════════════════════════════════

-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- para busca de texto

-- ─── CATEGORIAS ───
CREATE TABLE categorias (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  descricao   TEXT,
  imagem_url  TEXT,
  ativo       BOOLEAN DEFAULT true,
  ordem       INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── PRODUTOS ───
CREATE TABLE produtos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  descricao     TEXT,
  preco         DECIMAL(10,2) NOT NULL,
  preco_antigo  DECIMAL(10,2),
  categoria_id  UUID REFERENCES categorias(id),
  badge         TEXT CHECK (badge IN ('new','sale','exclusive', NULL)),
  ativo         BOOLEAN DEFAULT true,
  destaque      BOOLEAN DEFAULT false,
  peso_gramas   INT DEFAULT 500,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ─── VARIANTES (tamanho + cor + estoque) ───
CREATE TABLE produto_variantes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id  UUID REFERENCES produtos(id) ON DELETE CASCADE,
  tamanho     TEXT NOT NULL,
  cor         TEXT,
  cor_hex     TEXT,
  estoque     INT DEFAULT 0,
  sku         TEXT UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── IMAGENS DOS PRODUTOS ───
CREATE TABLE produto_imagens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id  UUID REFERENCES produtos(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  alt         TEXT,
  ordem       INT DEFAULT 0,
  principal   BOOLEAN DEFAULT false
);

-- ─── CLIENTES (extends auth.users do Supabase) ───
CREATE TABLE clientes (
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

-- ─── ENDEREÇOS ───
CREATE TABLE enderecos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id  UUID REFERENCES clientes(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,           -- "Casa", "Trabalho"
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

-- ─── PEDIDOS ───
CREATE TABLE pedidos (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero              SERIAL UNIQUE,
  cliente_id          UUID REFERENCES clientes(id),
  status              TEXT DEFAULT 'pendente'
                      CHECK (status IN ('pendente','processando','pago','separando','enviado','entregue','cancelado','reembolsado')),
  subtotal            DECIMAL(10,2) NOT NULL,
  frete               DECIMAL(10,2) DEFAULT 0,
  desconto            DECIMAL(10,2) DEFAULT 0,
  total               DECIMAL(10,2) NOT NULL,
  -- Pagamento
  metodo_pagamento    TEXT,
  status_pagamento    TEXT DEFAULT 'aguardando',
  payment_id          TEXT,            -- ID do MercadoPago/InfinitePay
  payment_url         TEXT,            -- URL de checkout externo
  -- Frete
  endereco_entrega_id UUID REFERENCES enderecos(id),
  transportadora      TEXT,
  codigo_rastreio     TEXT,
  -- Cupom
  cupom_codigo        TEXT,
  cupom_desconto      DECIMAL(10,2),
  -- Datas
  pago_em             TIMESTAMPTZ,
  enviado_em          TIMESTAMPTZ,
  entregue_em         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  -- Observações
  observacoes         TEXT,
  nota_interna        TEXT            -- visível só no admin
);

-- ─── ITENS DO PEDIDO ───
CREATE TABLE pedido_itens (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id       UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id      UUID REFERENCES produtos(id),
  variante_id     UUID REFERENCES produto_variantes(id),
  nome_produto    TEXT NOT NULL,       -- snapshot no momento da compra
  tamanho         TEXT,
  cor             TEXT,
  quantidade      INT NOT NULL,
  preco_unitario  DECIMAL(10,2) NOT NULL,
  subtotal        DECIMAL(10,2) NOT NULL
);

-- ─── CUPONS ───
CREATE TABLE cupons (
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

-- ─── LISTA DE DESEJOS ───
CREATE TABLE lista_desejos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id  UUID REFERENCES clientes(id) ON DELETE CASCADE,
  produto_id  UUID REFERENCES produtos(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cliente_id, produto_id)
);

-- ─── AVALIAÇÕES ───
CREATE TABLE avaliacoes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id  UUID REFERENCES produtos(id) ON DELETE CASCADE,
  cliente_id  UUID REFERENCES clientes(id),
  pedido_id   UUID REFERENCES pedidos(id),
  nota        INT CHECK (nota BETWEEN 1 AND 5),
  titulo      TEXT,
  texto       TEXT,
  aprovado    BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── CONFIGURAÇÕES DA LOJA ───
CREATE TABLE configuracoes (
  chave    TEXT PRIMARY KEY,
  valor    TEXT,
  tipo     TEXT DEFAULT 'text',
  grupo    TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── ADMINS ───
CREATE TABLE admins (
  id          UUID PRIMARY KEY REFERENCES auth.users(id),
  nome        TEXT NOT NULL,
  nivel       TEXT DEFAULT 'operador' CHECK (nivel IN ('super','admin','operador')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── ÍNDICES ───
CREATE INDEX idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX idx_produtos_ativo ON produtos(ativo);
CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_pedido_itens_pedido ON pedido_itens(pedido_id);
CREATE INDEX idx_variantes_produto ON produto_variantes(produto_id);

-- ─── RLS (Row Level Security) ───
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enderecos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE lista_desejos ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;

-- Clientes só veem seus próprios dados
CREATE POLICY "cliente_select" ON clientes FOR SELECT USING (auth.uid() = id);
CREATE POLICY "cliente_update" ON clientes FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "endereco_all" ON enderecos FOR ALL USING (auth.uid() = cliente_id);
CREATE POLICY "pedido_select" ON pedidos FOR SELECT USING (auth.uid() = cliente_id);
CREATE POLICY "lista_desejos_all" ON lista_desejos FOR ALL USING (auth.uid() = cliente_id);

-- Produtos são públicos para leitura
CREATE POLICY "produtos_public" ON produtos FOR SELECT USING (ativo = true);
CREATE POLICY "categorias_public" ON categorias FOR SELECT USING (ativo = true);
CREATE POLICY "imagens_public" ON produto_imagens FOR SELECT USING (true);
CREATE POLICY "variantes_public" ON produto_variantes FOR SELECT USING (true);
CREATE POLICY "avaliacoes_public" ON avaliacoes FOR SELECT USING (aprovado = true);
```

```sql
-- ═══════════════════════════════════════
-- ARQUIVO: supabase/migrations/002_seed.sql
-- Dados iniciais de demonstração
-- ═══════════════════════════════════════

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
```

---

## 🔐 VARIÁVEIS DE AMBIENTE

```env
# ─── .env.example (commitar este) ───

# SUPABASE
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...    # NÃO expor no frontend

# MERCADO PAGO
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_PUBLIC_KEY=APP_USR-...
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-...

# INFINITEPAY
INFINITEPAY_CLIENT_ID=
INFINITEPAY_CLIENT_SECRET=
INFINITEPAY_API_URL=https://api.infinitepay.io

# MELHOR ENVIO
MELHORENVIO_TOKEN=eyJ...
MELHORENVIO_API_URL=https://melhorenvio.com.br/api/v2
MELHORENVIO_SANDBOX_URL=https://sandbox.melhorenvio.com.br/api/v2

# APP
NEXT_PUBLIC_APP_URL=https://bymarcelomedeiros.com.br
NEXTAUTH_SECRET=gere-uma-string-aleatoria-segura
WEBHOOK_SECRET=gere-outra-string-para-webhooks

# EMAIL (opcional — Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@bymarcelomedeiros.com.br
```

---

## 📦 DEPENDÊNCIAS (package.json)

```json
{
  "name": "by-marcelo-medeiros",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "db:generate": "supabase gen types typescript --local > src/types/database.ts",
    "db:migrate": "supabase db push"
  },
  "dependencies": {
    "next": "14.2.x",
    "react": "^18",
    "react-dom": "^18",
    "typescript": "^5",

    "@supabase/supabase-js": "^2",
    "@supabase/ssr": "^0.4",

    "mercadopago": "^2",

    "zustand": "^4",
    "react-hot-toast": "^2",

    "next-themes": "^0.3",

    "@radix-ui/react-dialog": "^1",
    "@radix-ui/react-select": "^2",
    "@radix-ui/react-switch": "^1",
    "@radix-ui/react-tabs": "^1",
    "@radix-ui/react-tooltip": "^1",

    "recharts": "^2",

    "react-image-gallery": "^1",
    "swiper": "^11",

    "react-hook-form": "^7",
    "zod": "^3",
    "@hookform/resolvers": "^3",

    "date-fns": "^3",
    "clsx": "^2",
    "tailwind-merge": "^2",
    "lucide-react": "^0.383"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "tailwindcss": "^3",
    "autoprefixer": "^10",
    "postcss": "^8",
    "eslint": "^8",
    "eslint-config-next": "14.2.x"
  }
}
```

---

## 🎨 IDENTIDADE VISUAL (Tailwind)

```js
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
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
        rose: '#c4848c',
        sage: '#7a8c72',
      },
      fontFamily: {
        display: ['Italiana', 'serif'],
        serif:   ['Playfair Display', 'serif'],
        sans:    ['Nunito Sans', 'sans-serif'],
      },
      animation: {
        'fade-up':    'fadeUp 0.5s cubic-bezier(0.23, 1, 0.32, 1) both',
        'slide-in':   'slideIn 0.4s cubic-bezier(0.23, 1, 0.32, 1) both',
        'zoom-in':    'zoomIn 0.3s ease both',
      },
      keyframes: {
        fadeUp:  { from: { opacity:'0', transform:'translateY(24px)' }, to: { opacity:'1', transform:'translateY(0)' } },
        slideIn: { from: { opacity:'0', transform:'translateX(100%)' }, to: { opacity:'1', transform:'translateX(0)' } },
        zoomIn:  { from: { opacity:'0', transform:'scale(0.97)' },      to: { opacity:'1', transform:'scale(1)' } },
      },
    },
  },
  plugins: [],
}
```

---

## 💳 INTEGRAÇÕES — IMPLEMENTAÇÃO DETALHADA

### 1. MERCADO PAGO

```typescript
// src/lib/mercadopago.ts
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const mp = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export interface CreatePreferenceInput {
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
  }>;
  payer: {
    name: string;
    email: string;
    identification: { type: 'CPF'; number: string };
  };
  shipments?: {
    cost: number;
    mode: 'not_specified';
  };
  external_reference: string; // ID do pedido
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
}

export async function createMercadoPagoPreference(input: CreatePreferenceInput) {
  const preference = new Preference(mp);
  const response = await preference.create({
    body: {
      items: input.items,
      payer: input.payer,
      payment_methods: {
        installments: 12,
        default_installments: 1,
      },
      shipments: input.shipments,
      external_reference: input.external_reference,
      back_urls: input.back_urls,
      auto_return: 'approved',
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercadopago/webhook`,
    },
  });
  return response;
}

export async function getMercadoPagoPayment(paymentId: string) {
  const payment = new Payment(mp);
  return await payment.get({ id: parseInt(paymentId) });
}
```

```typescript
// src/app/api/mercadopago/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createMercadoPagoPreference } from '@/lib/mercadopago';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const body = await req.json();
    const { pedidoId, items, payer, frete } = body;

    const preference = await createMercadoPagoPreference({
      items: items.map((item: any) => ({
        id: item.produto_id,
        title: item.nome_produto,
        quantity: item.quantidade,
        unit_price: Number(item.preco_unitario),
      })),
      payer: {
        name: payer.nome,
        email: payer.email,
        identification: { type: 'CPF', number: payer.cpf.replace(/\D/g, '') },
      },
      shipments: frete ? { cost: frete, mode: 'not_specified' } : undefined,
      external_reference: pedidoId,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/sucesso`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?erro=pagamento`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/sucesso?pendente=true`,
      },
    });

    // Salvar payment_url no pedido
    await supabase.from('pedidos').update({
      payment_id: preference.id,
      payment_url: preference.init_point,
      metodo_pagamento: 'mercadopago',
    }).eq('id', pedidoId);

    return NextResponse.json({
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

```typescript
// src/app/api/mercadopago/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMercadoPagoPayment } from '@/lib/mercadopago';
import { createClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = createClient(); // service role

  if (body.type === 'payment') {
    const paymentId = body.data.id;
    const payment = await getMercadoPagoPayment(paymentId);

    const statusMap: Record<string, string> = {
      approved: 'pago',
      rejected: 'cancelado',
      pending: 'processando',
      in_process: 'processando',
    };

    const newStatus = statusMap[payment.status!] || 'processando';

    await supabase
      .from('pedidos')
      .update({
        status_pagamento: payment.status,
        status: newStatus,
        pago_em: payment.status === 'approved' ? new Date().toISOString() : null,
      })
      .eq('payment_id', payment.external_reference);
  }

  return NextResponse.json({ received: true });
}
```

---

### 2. INFINITEPAY

```typescript
// src/lib/infinitepay.ts
const INFINITEPAY_API = process.env.INFINITEPAY_API_URL!;

interface InfinitePayToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

async function getInfinitePayToken(): Promise<string> {
  const res = await fetch(`${INFINITEPAY_API}/v1/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.INFINITEPAY_CLIENT_ID!,
      client_secret: process.env.INFINITEPAY_CLIENT_SECRET!,
    }),
  });
  const data: InfinitePayToken = await res.json();
  return data.access_token;
}

export async function createInfinitePayCharge(params: {
  amount: number;         // em centavos
  installments: number;
  description: string;
  customer: {
    name: string;
    email: string;
    document: string;   // CPF sem formatação
  };
  callback_url: string;
}) {
  const token = await getInfinitePayToken();
  
  const res = await fetch(`${INFINITEPAY_API}/v1/charges`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: params.amount,
      capture_method: 'later',    // ou 'immediately' para débito
      installment_plan: {
        mode: 'issuer_plan',
        number_installments: params.installments,
      },
      description: params.description,
      customer: params.customer,
      payment_types: ['credit', 'debit', 'pix'],
      callback_url: params.callback_url,
    }),
  });
  
  return res.json();
}
```

---

### 3. MELHOR ENVIO

```typescript
// src/lib/melhorenvio.ts
const ME_API = process.env.NODE_ENV === 'production'
  ? process.env.MELHORENVIO_API_URL!
  : process.env.MELHORENVIO_SANDBOX_URL!;

const ME_TOKEN = process.env.MELHORENVIO_TOKEN!;

export interface FreteOption {
  id: number;
  name: string;         // "PAC", "SEDEX", etc.
  company: {
    name: string;       // "Correios", "JadLog", etc.
    picture: string;
  };
  price: string;
  custom_price: string;
  discount: string;
  currency: string;
  delivery_time: number;
  delivery_range: { min: number; max: number };
  custom_delivery_time: number;
  custom_delivery_range: { min: number; max: number };
  packages: any[];
  additional_services: any;
  error: string | null;
}

export async function calcularFrete(params: {
  cep_origem: string;
  cep_destino: string;
  produtos: Array<{
    id: string;
    weight: number;      // kg
    width: number;       // cm
    height: number;      // cm
    length: number;      // cm
    quantity: number;
    insurance_value: number;
  }>;
}): Promise<FreteOption[]> {
  const res = await fetch(`${ME_API}/me/shipment/calculate`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ME_TOKEN}`,
      'User-Agent': 'ByMarceloMedeiros/1.0 (contato@bymarcelomedeiros.com.br)',
    },
    body: JSON.stringify({
      from: { postal_code: params.cep_origem.replace(/\D/g, '') },
      to:   { postal_code: params.cep_destino.replace(/\D/g, '') },
      products: params.produtos,
      services: '1,2,3,4,17',   // Correios + JadLog + Azul
      options: {
        insurance_value: params.produtos.reduce((s, p) => s + p.insurance_value, 0),
        receipt: false,
        own_hand: false,
      },
    }),
  });

  const data = await res.json();
  return data.filter((opt: FreteOption) => !opt.error);
}
```

```typescript
// src/app/api/frete/calcular/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { calcularFrete } from '@/lib/melhorenvio';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { cep, produtos } = await req.json();
    const supabase = createClient();
    
    // Buscar CEP de origem nas configurações
    const { data: config } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'loja_cep_origem')
      .single();

    const opcoes = await calcularFrete({
      cep_origem: config?.valor || '55000-000',
      cep_destino: cep,
      produtos: produtos.map((p: any) => ({
        id: p.id,
        weight: (p.peso_gramas || 500) / 1000,
        width: 30,
        height: 10,
        length: 20,
        quantity: p.quantidade,
        insurance_value: p.preco_unitario,
      })),
    });

    return NextResponse.json(opcoes.map(o => ({
      id: o.id,
      nome: `${o.name} — ${o.company.name}`,
      preco: parseFloat(o.custom_price || o.price),
      prazo: `${o.custom_delivery_range.min}–${o.custom_delivery_range.max} dias úteis`,
    })));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

### 4. SUPABASE AUTH

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
        set(name, value, options) {
          try { cookieStore.set({ name, value, ...options }); } catch {}
        },
        remove(name, options) {
          try { cookieStore.set({ name, value: '', ...options }); } catch {}
        },
      },
    }
  );
}
```

```typescript
// src/lib/supabase/admin.ts  — service role (apenas server-side)
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export function createClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
```

```typescript
// middleware.ts  — Proteger rotas admin
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: {
      get: (name) => req.cookies.get(name)?.value,
      set: (name, value, options) => { res.cookies.set({ name, value, ...options }); },
      remove: (name, options) => { res.cookies.set({ name, value: '', ...options }); },
    }}
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Proteger /admin
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login?next=/admin', req.url));
    }
    // Verificar se é admin
    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('id', session.user.id)
      .single();
    
    if (!admin) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/minha-conta/:path*'],
};
```

---

### 5. CARRINHO COM ZUSTAND

```typescript
// src/store/cartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  produto_id: string;
  variante_id: string;
  nome: string;
  preco: number;
  tamanho: string;
  cor?: string;
  cor_hex?: string;
  quantidade: number;
  imagem?: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (varianteId: string) => void;
  updateQuantity: (varianteId: string, quantidade: number) => void;
  clearCart: () => void;
  setOpen: (open: boolean) => void;
  total: () => number;
  totalItems: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      
      addItem: (item) => set((state) => {
        const existing = state.items.find(i => i.variante_id === item.variante_id);
        if (existing) {
          return { items: state.items.map(i =>
            i.variante_id === item.variante_id
              ? { ...i, quantidade: i.quantidade + item.quantidade }
              : i
          )};
        }
        return { items: [...state.items, item] };
      }),
      
      removeItem: (varianteId) => set((state) => ({
        items: state.items.filter(i => i.variante_id !== varianteId)
      })),
      
      updateQuantity: (varianteId, quantidade) => set((state) => ({
        items: quantidade <= 0
          ? state.items.filter(i => i.variante_id !== varianteId)
          : state.items.map(i => i.variante_id === varianteId ? { ...i, quantidade } : i)
      })),
      
      clearCart: () => set({ items: [] }),
      setOpen: (open) => set({ isOpen: open }),
      
      total: () => get().items.reduce((s, i) => s + i.preco * i.quantidade, 0),
      totalItems: () => get().items.reduce((s, i) => s + i.quantidade, 0),
    }),
    { name: 'by-marcelo-cart' }
  )
);
```

---

## 🚀 FASES DE DESENVOLVIMENTO

### FASE 1 — Setup & Banco (30min)
- [ ] `npx create-next-app@latest by-marcelo-medeiros --typescript --tailwind --app`
- [ ] Instalar dependências do package.json
- [ ] Criar projeto no Supabase
- [ ] Rodar migrations SQL (001 e 002)
- [ ] Configurar .env.local
- [ ] Criar src/lib/supabase/{client,server,admin}.ts
- [ ] Configurar tailwind.config.js com cores da marca
- [ ] Importar fontes Google no layout.tsx

### FASE 2 — Layout Base (45min)
- [ ] TopBar component
- [ ] Header com navegação, logo, ações
- [ ] Footer completo
- [ ] Componentes UI: Button, Input, Badge, Modal, Toast, Toggle
- [ ] middleware.ts para proteção de rotas

### FASE 3 — Loja (90min)
- [ ] Hero com slider automático (3 banners)
- [ ] TrustBar
- [ ] CategoryCard grid
- [ ] ProductCard com animações hover
- [ ] ProductGrid com filtros e ordenação
- [ ] ProductModal com imagens, tamanhos, cores
- [ ] ShippingCalculator (API Melhor Envio)
- [ ] CartSidebar (Zustand)
- [ ] Reviews section
- [ ] Newsletter section
- [ ] Página individual do produto /produtos/[slug]

### FASE 4 — Checkout (60min)
- [ ] Página /checkout com formulário completo
- [ ] Integração MercadoPago (criar preference)
- [ ] Integração InfinitePay
- [ ] Seletor de pagamento: MP, InfinitePay, PIX, Boleto
- [ ] Aplicação de cupom de desconto
- [ ] Criação do pedido no Supabase
- [ ] Página /checkout/sucesso
- [ ] Webhook MercadoPago para atualizar status

### FASE 5 — Auth (45min)
- [ ] Página /login (email + senha + Google OAuth)
- [ ] Página /cadastro
- [ ] /minha-conta (pedidos, endereços, dados, desejos)

### FASE 6 — Admin Panel (120min)
- [ ] Layout do admin com sidebar
- [ ] Dashboard: stats cards, gráfico de vendas, gráfico por categoria
- [ ] Produtos: listagem, filtros, form de cadastro/edição, upload de imagens
- [ ] Pedidos: listagem, detalhes, alterar status, imprimir etiqueta
- [ ] Clientes: listagem, histórico, VIP
- [ ] Relatórios: faturamento, produtos mais vendidos
- [ ] Configurações: loja, pagamentos (keys), frete, integrações, conta

### FASE 7 — Polish & Deploy (60min)
- [ ] SEO: metadata, Open Graph, sitemap.xml, robots.txt
- [ ] Loading states, Suspense boundaries, skeleton screens
- [ ] Error boundaries
- [ ] next.config.js com output standalone
- [ ] Dockerfile para EasyPanel
- [ ] `.claude-progress.md` atualizado
- [ ] `git push` e deploy no EasyPanel

---

## 🐳 DEPLOY — EASYPANEL (VPS HOSTINGER)

### next.config.js
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { hostname: '*.supabase.co' },
      { hostname: 'res.cloudinary.com' },
    ],
  },
};
module.exports = nextConfig;
```

### Dockerfile (para EasyPanel)
```dockerfile
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
```

### EasyPanel — Configuração
1. **Novo App** → tipo: `App` → linguagem: `Dockerfile`
2. **Source:** GitHub repo `by-marcelo-medeiros`, branch `main`
3. **Port:** `3000`
4. **Environment Variables:** colar todas as vars do .env
5. **Domain:** `bymarcelomedeiros.com.br` (com SSL automático)
6. **Deploy** → aguardar build ~3min

---

## 🧠 REGRAS PARA O CLAUDE CODE

1. **Sempre leia `.claude-progress.md` antes de começar**
2. **Use TypeScript** em todos os arquivos
3. **Não use `any`** — defina tipos adequados
4. **Sempre trate erros** nas API routes (try/catch + status code correto)
5. **Nunca commite .env** — verificar antes de cada push
6. **Componentes do cliente** devem ter `'use client'` no topo
7. **Componentes do servidor** nunca importam hooks do React
8. **Supabase server** usa `createClient` de `@/lib/supabase/server`
9. **Supabase client** usa `createClient` de `@/lib/supabase/client`
10. **Admin API** usa `createClient` de `@/lib/supabase/admin` (service role)
11. **Após cada fase concluída:** fazer commit + atualizar `.claude-progress.md`
12. **Toast de sucesso/erro** em todas as ações do usuário
13. **Loading states** em todos os botões de ação (disable durante request)
14. **Responsivo** — sempre mobile-first com Tailwind

---

## 📋 CHECKLIST FINAL PRÉ-DEPLOY

```bash
# Verificar build
npm run build && npm run type-check

# Verificar sem credenciais expostas
grep -r "process.env" src/ | grep -v "NEXT_PUBLIC" | grep -v "/api/"

# .env no gitignore
cat .gitignore | grep -E "\.env"

# Commitar tudo
git add -A && git commit -m "deploy: versão 1.0.0 By Marcelo Medeiros"
git push origin main
```

---

## 🛡️ REGRA DE OURO — NÃO QUEBRAR O QUE FUNCIONA

**LEIA E SIGA ISSO ANTES DE QUALQUER MUDANÇA NO CÓDIGO:**

### ⚠️ Princípios INVIOLÁVEIS:

1. **NUNCA modifique código que já está funcionando** a menos que seja **estritamente para melhorar**.

2. **Antes de qualquer refatoração**, faça uma cópia/backup da seção que vai mexer.

3. **Toda mudança DEVE ser aditiva** quando possível (adicionar, não substituir).

4. **Multi-tenant**: TODA query nas tabelas (produtos, pedidos, clientes, configuracoes, categorias, cupons, banners, depoimentos, etc) PRECISA filtrar por `loja_id`. **NÃO REMOVA esses filtros.**

5. **Páginas que funcionam não podem ser refatoradas só por "limpeza"** — se está funcionando, deixa quieto.

6. **Componentes compartilhados** (Header, Footer, Sidebar, layouts) recebem props ao invés de queries diretas — não mude isso.

7. **APIs admin** (/api/admin/*) usam `getLojaIdDoAdmin()` pra detectar a loja do admin logado e filtram queries. **Manter essa lógica.**

8. **Rotas críticas que JÁ FUNCIONAM e não podem regredir:**
   - `/login`, `/cadastro`, `/auth/reset` (autenticação)
   - `/admin/*` (painel da loja)
   - `/super-admin/*` (painel master)
   - `/api/auth/reset-password` (recuperação)
   - `/api/admin/minha-loja` (detecção de loja do admin)
   - `/api/admin/salvar-configs` (salvar configurações)
   - `/api/super-admin/*` (CRUD de lojas)

### ✅ Antes de cada mudança, pergunte:

- [ ] Isso **melhora** algo ou só **mexe**?
- [ ] Se quebrar, eu sei como **voltar atrás**?
- [ ] Já testei mentalmente os **fluxos críticos** (login, criar loja, etc)?
- [ ] Os filtros de `loja_id` foram **preservados** em queries?
- [ ] Estou alterando algo em **componente compartilhado** que pode quebrar outras telas?

### ❌ Anti-padrões PROIBIDOS:

- Usar `sed` em arquivos com sintaxe complexa (TypeScript/JSX) — usa Edit
- Mudar o nome de URLs que já estão deployadas (cria cache de 404)
- Remover validações de segurança (auth checks, RLS, etc)
- Alterar schema de banco sem migração reversível
- Trocar bibliotecas funcionais por outras "melhores" sem justificativa forte

### 🎯 Quando tiver dúvida:

**Não mexa.** Confirme com o usuário primeiro o que ele quer mudar antes de tocar em código funcional. **"Funcionando > Bonito".**


---

## 🔐 REGRAS DE OURO — PARTE 2 (Multi-tenant + Segurança)

Adicionando às regras anteriores:

### 9. Mudanças em config multi-tenant precisam ser ADITIVAS

Toda vez que tocar em `getConfiguracoes()`, `lib/melhorenvio.ts`, `lib/infinitepay.ts` ou APIs de pagamento:
- **Manter fallback pro `process.env`** (compatibilidade com lojas antigas)
- **Filtrar por `loja_id`** sempre, com header `x-loja-id` do middleware
- **NUNCA remover** parâmetros existentes — só adicionar opcionais

### 10. Tokens/secrets NUNCA expostos no frontend público

Lista de chaves PROIBIDAS em `getConfiguracoes()`:
- `melhorenvio_token`
- `mercadopago_access_token`
- `mercadopago_public_key`
- `infinitepay_client_secret`
- `webhook_secret`
- `admin_password`
- `smtp_password`
- qualquer `*_api_key`, `*_secret`, `*_token`

Pra admin recuperar essas chaves (pra editar), use **APENAS** `/api/admin/configs-completas` (autenticado server-side).

### 11. SecretInput no frontend

Tokens em UI admin SEMPRE usar componente `SecretInput`:
- Campo `password` por padrão
- Botão 👁 pra mostrar/ocultar
- `autoComplete="off"`
- Mostrar só "Token configurado (X caracteres)" quando mascarado

### 12. APIs de pagamento PRECISAM ler config por loja_id

Padrão correto:
```typescript
const lojaId = headers().get('x-loja-id') || LOJA_DEFAULT;
const { data } = await supabase.from('configuracoes')
  .select('valor').eq('chave', 'X').eq('loja_id', lojaId).maybeSingle();
const valor = data?.valor || process.env.FALLBACK;
```

NUNCA usar `process.env.X` direto sem checar config da loja primeiro.

### 13. Antes de salvar configs, validar permissão de loja

`/api/admin/salvar-configs` precisa validar:
- Super admin: pode salvar na loja do **domínio acessado**
- Admin normal: só na **própria loja** (do registro em `admins`)
- Se admin tentar salvar em outra loja → bloqueia com erro 403

