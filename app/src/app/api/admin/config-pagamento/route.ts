import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    const { data } = await supabase.from('configuracoes')
      .select('chave, valor')
      .in('chave', ['pagamento_finalizar_no_site', 'pagamento_sem_juros', 'pagamento_pix_desconto', 'mercadopago_ativo', 'infinitepay_ativo']);

    const configs: Record<string, string> = {};
    (data ?? []).forEach((r: { chave: string; valor: string | null }) => {
      configs[r.chave] = r.valor ?? '';
    });

    return NextResponse.json({
      finalizarNoSite: configs.pagamento_finalizar_no_site === 'true',
      semJuros: configs.pagamento_sem_juros !== 'false',
      pixDesconto: parseInt(configs.pagamento_pix_desconto ?? '10'),
      mercadopagoAtivo: configs.mercadopago_ativo === 'true',
      infinitepayAtivo: configs.infinitepay_ativo === 'true',
    });
  } catch {
    return NextResponse.json({ finalizarNoSite: false, semJuros: true, pixDesconto: 10 });
  }
}
