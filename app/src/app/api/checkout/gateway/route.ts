import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';
import { headers } from 'next/headers';

const LOJA_DEFAULT = '00000000-0000-0000-0000-000000000001';

export async function GET() {
  try {
    // 🛡️ Filtra por loja_id do middleware
    const lojaId = headers().get('x-loja-id') || LOJA_DEFAULT;

    const supabase = createClient();
    const { data: configs } = await supabase
      .from('configuracoes')
      .select('chave, valor')
      .eq('loja_id', lojaId)
      .in('chave', [
        'gateway_pagamento', 'infinitepay_ativo', 'mercadopago_ativo', 'infinitepay_handle',
        'pagamento_pix_ativo', 'pagamento_boleto_ativo', 'pagamento_pix_desconto', 'parcelas_max',
        'pix_ativo', 'boleto_ativo', 'parcelas_sem_juros',
      ]);

    const map: Record<string, string> = {};
    (configs ?? []).forEach((c: { chave: string; valor: string }) => { map[c.chave] = c.valor; });

    const gateway = map.gateway_pagamento || (map.infinitepay_ativo === 'true' ? 'infinitepay' : 'mercadopago');
    const mpPublicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || '';
    // Fallback robusto: handle do banco -> env -> 'bymarcelomedeiros' (loja padrão)
    const infinitepayHandle = map.infinitepay_handle || process.env.INFINITEPAY_HANDLE || 'bymarcelomedeiros';
    const infinitepayAtivo = map.infinitepay_ativo !== 'false'; // default true

    return NextResponse.json({
      gateway,
      mp_public_key: mpPublicKey,
      mp_disponivel: !!mpPublicKey && !mpPublicKey.includes('...'),
      infinitepay_disponivel: infinitepayAtivo && !!infinitepayHandle,
      infinitepay_handle: infinitepayHandle,
      pix_ativo: (map.pix_ativo ?? map.pagamento_pix_ativo) !== 'false',  // default true
      boleto_ativo: (map.boleto_ativo ?? map.pagamento_boleto_ativo) !== 'false',  // default true
      pix_desconto: parseInt(map.pagamento_pix_desconto ?? '10') || 10,
      parcelas_max: parseInt(map.parcelas_sem_juros ?? map.parcelas_max ?? '6') || 6,
    });
  } catch {
    // Fallback: deixa InfinitePay disponivel com handle padrão
    return NextResponse.json({
      gateway: 'infinitepay',
      mp_disponivel: false,
      infinitepay_disponivel: true,
      infinitepay_handle: process.env.INFINITEPAY_HANDLE || 'bymarcelomedeiros',
      pix_ativo: true,
      boleto_ativo: true,
      pix_desconto: 10,
      parcelas_max: 6,
    });
  }
}
