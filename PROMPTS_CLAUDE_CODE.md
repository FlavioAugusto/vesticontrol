# 🚀 PROMPT DE INÍCIO — CLAUDE CODE
# Cole este texto no Claude Code para começar o projeto

---

## PROMPT INICIAL (copie e cole no Claude Code):

```
Você está construindo o e-commerce completo da marca BY MARCELO MEDEIROS.

1. PRIMEIRO: leia o arquivo CLAUDE.md inteiro — ele contém toda a arquitetura, 
   banco de dados, integrações e regras do projeto.

2. SEGUNDO: leia o .claude-progress.md para ver o status atual.

3. TERCEIRO: confirme o que encontrou e pergunte se deve iniciar pela Fase 1.

Aguardo sua confirmação antes de começar.
```

---

## PROMPTS POR FASE (use um de cada vez):

### Fase 1 — Setup & Banco
```
Vamos iniciar a Fase 1 do CLAUDE.md.
Execute os seguintes passos na ordem:
1. Crie o src/lib/supabase/client.ts
2. Crie o src/lib/supabase/server.ts  
3. Crie o src/lib/supabase/admin.ts
4. Crie o src/types/database.ts com os tipos das tabelas
5. Crie o middleware.ts para proteger /admin
6. Configure o tailwind.config.js com as cores da marca
7. Crie o src/app/layout.tsx com as fontes Google e providers
Ao terminar cada arquivo, faça um commit.
```

### Fase 2 — Layout Base
```
Vamos para a Fase 2: Layout Base.
Crie os componentes na ordem:
1. src/components/ui/ — Button, Input, Badge, Modal, Toast, Toggle
2. src/components/layout/TopBar.tsx
3. src/components/layout/Header.tsx (com busca, carrinho, usuário)
4. src/components/layout/Footer.tsx completo
5. src/components/layout/MobileMenu.tsx
Use as cores do tailwind.config.js e as fontes Italiana/Playfair Display/Nunito Sans.
Cada componente deve ser totalmente tipado com TypeScript.
```

### Fase 3 — Loja
```
Vamos para a Fase 3: Loja.
Crie na ordem:
1. src/store/cartStore.ts com Zustand (persistido no localStorage)
2. src/components/shop/Hero.tsx (slider com 3 banners, auto-play 5s)
3. src/components/shop/TrustBar.tsx
4. src/components/shop/CategoryCard.tsx
5. src/components/shop/ProductCard.tsx (com hover animations)
6. src/components/shop/ProductGrid.tsx (com filtros e ordenação)
7. src/components/shop/ProductModal.tsx (tamanhos, cores, qty, frete)
8. src/components/shop/CartSidebar.tsx (sidebar deslizante)
9. src/components/shop/ShippingCalculator.tsx (Melhor Envio)
10. src/components/shop/Reviews.tsx
11. src/components/shop/Newsletter.tsx
12. src/app/page.tsx (home completa)
13. src/app/(shop)/produtos/[slug]/page.tsx
Busque os dados do Supabase com Server Components quando possível.
```

### Fase 4 — Checkout
```
Vamos para a Fase 4: Checkout e Pagamentos.
Crie na ordem:
1. src/lib/mercadopago.ts
2. src/lib/infinitepay.ts
3. src/lib/melhorenvio.ts
4. src/app/api/frete/calcular/route.ts
5. src/app/api/mercadopago/checkout/route.ts
6. src/app/api/mercadopago/webhook/route.ts
7. src/app/api/infinitepay/checkout/route.ts
8. src/components/checkout/ (todos os componentes)
9. src/app/(shop)/checkout/page.tsx
10. src/app/(shop)/checkout/sucesso/page.tsx
Use exatamente o código das integrações do CLAUDE.md.
```

### Fase 5 — Auth
```
Vamos para a Fase 5: Autenticação.
Crie na ordem:
1. src/hooks/useAuth.ts
2. src/app/(auth)/login/page.tsx (email+senha + Google OAuth)
3. src/app/(auth)/cadastro/page.tsx
4. src/app/minha-conta/page.tsx (pedidos, endereços, dados, desejos)
Use Supabase Auth com SSR (@supabase/ssr).
```

### Fase 6 — Admin Panel
```
Vamos para a Fase 6: Painel Admin.
Crie na ordem:
1. src/app/admin/layout.tsx (sidebar + header admin)
2. src/components/admin/Sidebar.tsx
3. src/components/admin/StatCard.tsx
4. src/components/admin/Charts.tsx (Recharts: barras mensais + pizza categorias)
5. src/components/admin/DataTable.tsx (reutilizável)
6. src/app/admin/page.tsx (dashboard completo)
7. src/components/admin/ProductForm.tsx
8. src/app/admin/produtos/page.tsx (listagem + filtros)
9. src/app/admin/produtos/novo/page.tsx (form de cadastro)
10. src/app/admin/pedidos/page.tsx
11. src/app/admin/clientes/page.tsx
12. src/app/admin/relatorios/page.tsx
13. src/app/admin/configuracoes/page.tsx (loja, pagamentos, frete, integrações)
Proteger todas as rotas /admin via middleware.ts.
```

### Fase 7 — Deploy
```
Vamos para a Fase 7: Polish e Deploy.
1. Adicione metadata/SEO no layout.tsx e nas páginas principais
2. Adicione loading.tsx e error.tsx em cada route group
3. Adicione skeleton screens nos componentes de produto
4. Verifique se next.config.js tem output: 'standalone'
5. Verifique se Dockerfile está correto
6. Rode: npm run build && npm run type-check
7. Corrija qualquer erro de TypeScript
8. Atualize .claude-progress.md como 100% concluído
9. Faça o commit final: git add -A && git commit -m "deploy: v1.0.0 By Marcelo Medeiros"
10. Me diga os passos exatos para configurar no EasyPanel
```

---

## PROMPTS DE RECUPERAÇÃO (se o Claude Code perder contexto):

### Se parar no meio:
```
Leia o CLAUDE.md e o .claude-progress.md.
Me diga exatamente onde paramos e o que foi feito.
Depois continue de onde parou.
```

### Se der erro:
```
Temos um erro. Leia o CLAUDE.md seção de regras.
O erro é: [cole o erro aqui]
Corrija seguindo a arquitetura do CLAUDE.md.
```

### Para ver progresso:
```
Mostre o .claude-progress.md atual e liste o que foi
concluído vs o que ainda falta fazer.
```

---

## ✅ CHECKLIST ANTES DE COMEÇAR

- [ ] Executei `./setup.sh` (ou manualmente `npx create-next-app`)
- [ ] Criei projeto no Supabase e rodei as migrations SQL
- [ ] Preenchi o `.env.local` com as chaves reais
- [ ] Tenho conta de desenvolvedor no Mercado Pago
- [ ] Tenho conta na InfinitePay (ou deixo para depois)
- [ ] Tenho conta no Melhor Envio
- [ ] Criei repositório no GitHub
- [ ] Instalei o Claude Code: `npm install -g @anthropic-ai/claude-code`
- [ ] Tenho ANTHROPIC_API_KEY configurada

## 🔑 ONDE PEGAR AS KEYS:

| Serviço | URL |
|---------|-----|
| Supabase | https://supabase.com → Settings → API |
| Mercado Pago | https://mercadopago.com.br/developers/pt/docs/credentials |
| InfinitePay | https://infinitepay.io → Dashboard → API |
| Melhor Envio | https://melhorenvio.com.br → Integrações → Tokens |
| EasyPanel | Seu VPS Hostinger → porta 3000 |
