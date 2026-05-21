import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

const LOJA_DEFAULT = '00000000-0000-0000-0000-000000000001';

// Cache de 60 segundos para configs públicas
export const revalidate = 60;

export async function GET() {
  try {
    // 🛡️ Filtra por loja_id do middleware (evita pegar dados de outras lojas)
    const lojaId = headers().get('x-loja-id') || LOJA_DEFAULT;

    const supabase = createClient();
    const { data } = await supabase
      .from('configuracoes')
      .select('chave, valor')
      .eq('loja_id', lojaId)
      .in('chave', ['loja_logo_url', 'loja_nome', 'loja_telefone', 'loja_horario_atendimento', 'loja_email', 'loja_whatsapp']);

    const c: Record<string, string> = {};
    (data ?? []).forEach((r: { chave: string; valor: string | null }) => {
      c[r.chave] = r.valor ?? '';
    });

    return NextResponse.json({
      logo: c.loja_logo_url || '/images/logo.svg',
      nome: c.loja_nome || 'By Marcelo Medeiros',
      telefone: c.loja_telefone || '(81) 99422-8240',
      horario: c.loja_horario_atendimento || 'Seg–Sex: 09:00–18:00',
      email: c.loja_email || 'contato@bymarcelomedeiros.com.br',
      whatsapp: c.loja_whatsapp || '81994228240',
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' }
    });
  } catch {
    return NextResponse.json({
      logo: '/images/logo.svg',
      nome: 'By Marcelo Medeiros',
      telefone: '(81) 99422-8240',
      horario: 'Seg–Sex: 09:00–18:00',
      email: 'contato@bymarcelomedeiros.com.br',
      whatsapp: '81994228240',
    });
  }
}
