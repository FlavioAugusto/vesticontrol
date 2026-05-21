import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as adminClient } from '@/lib/supabase/admin';
import { headers } from 'next/headers';

const LOJA_DEFAULT = '00000000-0000-0000-0000-000000000001';

interface ItemPedido {
  produto_id: string;
  variante_id: string;
  nome: string;
  tamanho: string;
  cor?: string;
  quantidade: number;
  preco: number;
}

// Verifica se o ID parece UUID válido
function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, subtotal, frete, desconto, total, metodo_pagamento, cliente, endereco, cupom_codigo, parcelas } = body;

    // Detecta loja_id via header (injetado pelo middleware com base no domínio)
    const lojaId = headers().get('x-loja-id') || LOJA_DEFAULT;

    const supabase = adminClient();
    const serverSupa = createClient();

    const { data: { user } } = await serverSupa.auth.getUser().catch(() => ({ data: { user: null } }));
    let clienteId = user?.id ?? null;
    if (!clienteId) clienteId = null;

    // Verifica se a loja permite compra sem estoque (filtrado por loja_id)
    const { data: configEstoque } = await supabase
      .from('configuracoes').select('valor')
      .eq('chave', 'permitir_compra_sem_estoque')
      .eq('loja_id', lojaId).maybeSingle();
    const permitirSemEstoque = configEstoque?.valor === 'true';

    // Resolve variante real (busca por id se UUID, senão por produto+tamanho+cor)
    const itensResolvidos: (ItemPedido & { variante_real_id: string | null; estoque_real: number })[] = [];

    for (const item of items as ItemPedido[]) {
      let varianteReal: { id: string; estoque: number } | null = null;

      // 1. Tenta pelo variante_id se for UUID válido
      if (isUuid(item.variante_id)) {
        const { data } = await supabase
          .from('produto_variantes')
          .select('id, estoque')
          .eq('id', item.variante_id)
          .maybeSingle();
        if (data) varianteReal = data as { id: string; estoque: number };
      }

      // 2. Senão, busca por produto_id + tamanho + cor
      if (!varianteReal && isUuid(item.produto_id)) {
        const query = supabase
          .from('produto_variantes')
          .select('id, estoque')
          .eq('produto_id', item.produto_id)
          .eq('tamanho', item.tamanho);

        if (item.cor) query.eq('cor', item.cor);

        const { data } = await query.maybeSingle();
        if (data) varianteReal = data as { id: string; estoque: number };
      }

      // 3. Se ainda não achou, último recurso: produto+tamanho (sem cor)
      if (!varianteReal && isUuid(item.produto_id)) {
        const { data } = await supabase
          .from('produto_variantes')
          .select('id, estoque')
          .eq('produto_id', item.produto_id)
          .eq('tamanho', item.tamanho)
          .limit(1)
          .maybeSingle();
        if (data) varianteReal = data as { id: string; estoque: number };
      }

      itensResolvidos.push({
        ...item,
        variante_real_id: varianteReal?.id ?? null,
        estoque_real: varianteReal?.estoque ?? 0,
      });
    }

    // Validação de estoque (pode ser bypassada via config)
    if (!permitirSemEstoque) {
      for (const item of itensResolvidos) {
        if (item.variante_real_id && item.estoque_real < item.quantidade) {
          return NextResponse.json({
            error: `Estoque insuficiente para ${item.nome} (${item.tamanho}${item.cor ? '/' + item.cor : ''}). Disponível: ${item.estoque_real}`
          }, { status: 400 });
        }
      }
    }

    // Salva endereço de entrega — se for novo (id='temp'), insere agora; senão usa o ID existente
    let enderecoEntregaId: string | null = null;
    if (endereco && clienteId) {
      if (endereco.id && endereco.id !== 'temp' && isUuid(endereco.id)) {
        // Endereço já existe na tabela (cliente selecionou um salvo)
        enderecoEntregaId = endereco.id;
      } else {
        // Endereço novo digitado no checkout — salva agora
        const { data: novoEnd } = await supabase
          .from('enderecos')
          .insert({
            cliente_id: clienteId,
            loja_id: lojaId,
            nome: endereco.nome || 'Entrega',
            cep: (endereco.cep || '').replace(/\D/g, ''),
            rua: endereco.rua || '',
            numero: endereco.numero || '',
            complemento: endereco.complemento || null,
            bairro: endereco.bairro || '',
            cidade: endereco.cidade || '',
            estado: endereco.estado || '',
            principal: false,
          })
          .select('id')
          .single();
        if (novoEnd) enderecoEntregaId = (novoEnd as { id: string }).id;
      }
    }

    // Cria pedido (com loja_id pra multi-tenant)
    const { data: pedido, error: pedidoErr } = await supabase
      .from('pedidos')
      .insert({
        loja_id: lojaId,
        cliente_id: clienteId,
        endereco_entrega_id: enderecoEntregaId,
        subtotal, frete, desconto, total,
        metodo_pagamento,
        status: 'pendente',
        status_pagamento: 'aguardando',
        cupom_codigo: cupom_codigo ?? null,
        observacoes: `Parcelas: ${parcelas ?? 1}`,
      })
      .select()
      .single();

    if (pedidoErr || !pedido) {
      return NextResponse.json({ error: pedidoErr?.message ?? 'Erro ao criar pedido' }, { status: 500 });
    }

    const pedidoId = (pedido as { id: string; numero: number }).id;
    const numero = (pedido as { id: string; numero: number }).numero;

    // Insere itens (NÃO debita estoque na criação — só quando o pagamento for confirmado)
    for (const item of itensResolvidos) {
      await supabase.from('pedido_itens').insert({
        pedido_id: pedidoId,
        loja_id: lojaId,
        produto_id: isUuid(item.produto_id) ? item.produto_id : null,
        variante_id: item.variante_real_id,
        nome_produto: item.nome,
        tamanho: item.tamanho,
        cor: item.cor ?? null,
        quantidade: item.quantidade,
        preco_unitario: item.preco,
        subtotal: item.preco * item.quantidade,
      });
    }

    if (!clienteId && cliente?.telefone) {
      await supabase.from('configuracoes').upsert({
        chave: `guest_${pedidoId}`,
        valor: JSON.stringify({ ...cliente, ...endereco }),
        grupo: 'guests',
      });
    }

    return NextResponse.json({ pedidoId, numero, ok: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro interno' }, { status: 500 });
  }
}
