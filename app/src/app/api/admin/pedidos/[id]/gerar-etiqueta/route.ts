import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServer } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@/lib/supabase/admin';
import { gerarEtiquetaCompleta, type DadosEtiqueta } from '@/lib/melhorenvio';

const LOJA_DEFAULT = '00000000-0000-0000-0000-000000000001';

/**
 * Gera etiqueta de envio via Melhor Envio pra um pedido.
 * Faz o fluxo completo: cart → checkout → generate → print → tracking.
 *
 * Body: { servico_id: number, peso_kg?: number }
 * Resposta: { ok, trackingCode, printUrl, melhorenvioOrderId }
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const server = createServer();
    const { data: { user } } = await server.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const admin = createAdmin();
    const { data: adminRow } = await admin.from('admins').select('loja_id').eq('id', user.id).maybeSingle();
    const { data: superRow } = await admin.from('super_admins').select('id').eq('id', user.id).maybeSingle();
    if (!adminRow && !superRow) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const lojaId = adminRow?.loja_id || LOJA_DEFAULT;
    const pedidoId = params.id;
    const body = await req.json().catch(() => ({}));
    const servicoIdRaw = body?.servico_id;
    const servicoId = typeof servicoIdRaw === 'number' ? servicoIdRaw : parseInt(servicoIdRaw ?? '1');
    const pesoTotal = typeof body?.peso_kg === 'number' ? body.peso_kg : 0.5;

    // 1. Busca configs da loja (CEP origem + token Melhor Envio + dados de identidade)
    const { data: configsData } = await admin
      .from('configuracoes')
      .select('chave, valor')
      .eq('loja_id', lojaId)
      .in('chave', [
        'loja_cep_origem', 'melhorenvio_token', 'loja_nome', 'loja_email',
        'loja_whatsapp', 'loja_cnpj', 'loja_cpf', 'loja_endereco', 'loja_cidade',
        'loja_estado', 'loja_bairro', 'loja_numero', 'rodape_rua',
      ]);
    const cfg: Record<string, string> = {};
    (configsData ?? []).forEach((c: { chave: string; valor: string | null }) => {
      cfg[c.chave] = c.valor ?? '';
    });

    const token = cfg.melhorenvio_token;
    if (!token) {
      return NextResponse.json({ error: 'Token Melhor Envio não configurado' }, { status: 400 });
    }
    const cepOrigem = cfg.loja_cep_origem || '55002000';
    const nomeLoja = cfg.loja_nome || 'Loja';
    const emailLoja = cfg.loja_email || 'contato@loja.com.br';
    const whatsappLoja = cfg.loja_whatsapp || '81994228240';

    // Documento da loja (remetente): aceita CPF (11 dígitos) OU CNPJ (14 dígitos)
    const cpfLoja = (cfg.loja_cpf || '').replace(/\D/g, '');
    const cnpjLoja = (cfg.loja_cnpj || '').replace(/\D/g, '');
    let docLoja = '';
    if (cpfLoja.length === 11) docLoja = cpfLoja;
    else if (cnpjLoja.length === 14) docLoja = cnpjLoja;

    if (!docLoja) {
      return NextResponse.json({
        error: 'CPF ou CNPJ da loja não configurado (ou inválido). O Melhor Envio exige um documento válido do REMETENTE para gerar a etiqueta.',
        hint: 'Vá em /admin/configuracoes e preencha o campo "CPF da Loja" (11 dígitos) ou "CNPJ da Loja" (14 dígitos).',
        debug: { cpf_configurado: cpfLoja.length, cnpj_configurado: cnpjLoja.length },
      }, { status: 400 });
    }

    // 2. Busca pedido + itens + cliente + endereço
    const { data: pedido } = await admin
      .from('pedidos')
      .select('*, clientes(nome, sobrenome, cpf, telefone, whatsapp)')
      .eq('id', pedidoId)
      .eq('loja_id', lojaId)
      .maybeSingle();

    if (!pedido) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });

    // Se já tem código de rastreio gerado, retorna ele
    const pedidoAny = pedido as any;
    if (pedidoAny.codigo_rastreio && pedidoAny.melhorenvio_order_id) {
      return NextResponse.json({
        ok: true,
        trackingCode: pedidoAny.codigo_rastreio,
        printUrl: pedidoAny.melhorenvio_print_url || null,
        melhorenvioOrderId: pedidoAny.melhorenvio_order_id,
        ja_gerada: true,
      });
    }

    // Endereço de entrega — tenta 3 fontes em ordem
    let endereco: any = null;

    // 1. ID do endereço salvo no pedido
    if (pedidoAny.endereco_entrega_id) {
      const { data: end } = await admin
        .from('enderecos')
        .select('*')
        .eq('id', pedidoAny.endereco_entrega_id)
        .maybeSingle();
      endereco = end;
    }

    // 2. Fallback: endereço principal do cliente
    if (!endereco && pedidoAny.cliente_id) {
      const { data: enderecos } = await admin
        .from('enderecos')
        .select('*')
        .eq('cliente_id', pedidoAny.cliente_id)
        .order('principal', { ascending: false })
        .limit(1);
      if (enderecos && enderecos.length > 0) {
        endereco = enderecos[0];
        // Atualiza o pedido pra apontar pra esse endereço (próximas chamadas)
        await admin.from('pedidos')
          .update({ endereco_entrega_id: (endereco as { id: string }).id })
          .eq('id', pedidoId);
      }
    }

    if (!endereco) {
      return NextResponse.json({
        error: 'Pedido sem endereço de entrega. Cliente não tem nenhum endereço cadastrado.',
        hint: 'Cliente precisa cadastrar endereço em /minha-conta antes de gerar etiqueta.',
      }, { status: 400 });
    }

    // Itens
    const { data: itens } = await admin
      .from('pedido_itens')
      .select('nome_produto, quantidade, preco_unitario')
      .eq('pedido_id', pedidoId);

    if (!itens || itens.length === 0) {
      return NextResponse.json({ error: 'Pedido sem itens' }, { status: 400 });
    }

    const cliente = pedidoAny.clientes;
    const cpfCliente = (cliente?.cpf || '').replace(/\D/g, '');
    if (cpfCliente.length !== 11 && cpfCliente.length !== 14) {
      return NextResponse.json({
        error: 'Cliente sem CPF/CNPJ válido cadastrado. Melhor Envio exige documento do destinatário.',
        hint: 'Peça pro cliente preencher o CPF em /minha-conta/perfil, ou adicione manualmente no banco.',
        debug: { cpf_cliente: cliente?.cpf, cpf_limpo: cpfCliente },
      }, { status: 400 });
    }

    const dados: DadosEtiqueta = {
      servico_id: servicoId,
      from: {
        name: nomeLoja, phone: whatsappLoja, email: emailLoja,
        document: docLoja,
        company_document: cnpjLoja.length === 14 ? cnpjLoja : undefined,
        address: cfg.loja_endereco || cfg.rodape_rua || 'Caruaru/PE',
        number: cfg.loja_numero || '0',
        district: cfg.loja_bairro || 'Centro',
        city: cfg.loja_cidade || 'Caruaru',
        country_id: 'BR',
        postal_code: cepOrigem.replace(/\D/g, ''),
        state_abbr: cfg.loja_estado || 'PE',
      },
      to: {
        name: `${cliente?.nome ?? ''} ${cliente?.sobrenome ?? ''}`.trim() || 'Cliente',
        phone: cliente?.telefone || cliente?.whatsapp || whatsappLoja,
        email: emailLoja,
        document: cpfCliente,
        address: endereco.rua, number: endereco.numero,
        complement: endereco.complemento || undefined,
        district: endereco.bairro, city: endereco.cidade,
        country_id: 'BR',
        postal_code: (endereco.cep || '').replace(/\D/g, ''),
        state_abbr: endereco.estado,
      },
      produtos: (itens as any[]).map(i => ({
        name: i.nome_produto, quantity: i.quantidade, unitary_value: Number(i.preco_unitario),
      })),
      volumes: [{ height: 10, width: 30, length: 20, weight: pesoTotal }],
      options: {
        insurance_value: Number(pedidoAny.subtotal) || 50,
        receipt: false, own_hand: false, non_commercial: true,
      },
    };

    // 3. Gera a etiqueta via Melhor Envio
    const { orderId, trackingCode, printUrl } = await gerarEtiquetaCompleta({
      token,
      userAgent: `${nomeLoja}/1.0 (${emailLoja})`,
      dados,
    });

    // 4. Salva no pedido
    await admin
      .from('pedidos')
      .update({
        codigo_rastreio: trackingCode,
        transportadora: 'Melhor Envio',
        melhorenvio_order_id: orderId,
        melhorenvio_print_url: printUrl,
        status: pedidoAny.status === 'pago' ? 'separando' : pedidoAny.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pedidoId);

    return NextResponse.json({
      ok: true,
      trackingCode,
      printUrl,
      melhorenvioOrderId: orderId,
    });
  } catch (error: any) {
    console.error('[gerar-etiqueta]', error);
    return NextResponse.json({
      error: error?.message || 'Erro ao gerar etiqueta',
      detalhes: error?.response || null,
    }, { status: 500 });
  }
}
