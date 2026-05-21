import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';
import { createClient as createServer } from '@/lib/supabase/server';
import { headers } from 'next/headers';

// Guias são armazenados como JSON na tabela configuracoes
const CHAVE = 'guias_tamanhos';
const LOJA_DEFAULT = '00000000-0000-0000-0000-000000000001';

const GUIA_PADRAO = [
  {
    id: 'vestidos',
    nome: 'Guia de Vestidos e Conjuntos',
    medidas: [
      { label: 'Busto', P: '88-92 cm', M: '92-96 cm', G: '96-100 cm' },
      { label: 'Cintura', P: '70-74 cm', M: '74-78 cm', G: '78-82 cm' },
      { label: 'Quadril', P: '94-98 cm', M: '98-102 cm', G: '102-106 cm' },
      { label: 'Comprimento', P: '100-102 cm', M: '102-104 cm', G: '104-106 cm' },
    ],
    imagem_url: '',
    dica: 'Meça em centímetros com a fita bem ajustada ao corpo.',
  },
];

async function pegarLojaId(): Promise<string> {
  try {
    const s = createServer();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return headers().get('x-loja-id') || LOJA_DEFAULT;

    const a = createClient();
    const { data: admin } = await a.from('admins')
      .select('loja_id').eq('id', user.id).maybeSingle();

    return admin?.loja_id || headers().get('x-loja-id') || LOJA_DEFAULT;
  } catch {
    return LOJA_DEFAULT;
  }
}

export async function GET() {
  try {
    const lojaId = await pegarLojaId();
    const supabase = createClient();
    const { data } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', CHAVE)
      .eq('loja_id', lojaId)
      .maybeSingle();
    const guias = data?.valor ? JSON.parse(data.valor) : GUIA_PADRAO;
    return NextResponse.json(guias);
  } catch {
    return NextResponse.json(GUIA_PADRAO);
  }
}

export async function POST(req: NextRequest) {
  try {
    const guias = await req.json();
    const lojaId = await pegarLojaId();
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('configuracoes') as any).upsert({
      chave: CHAVE,
      loja_id: lojaId,
      valor: JSON.stringify(guias),
      tipo: 'text',
      grupo: 'tamanhos',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'chave,loja_id' });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro' }, { status: 500 });
  }
}
