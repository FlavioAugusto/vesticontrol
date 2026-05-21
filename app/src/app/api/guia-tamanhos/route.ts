import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';
import { headers } from 'next/headers';

const LOJA_DEFAULT = '00000000-0000-0000-0000-000000000001';

const GUIA_PADRAO = [
  {
    id: 'vestidos',
    nome: 'Guia de Tamanhos',
    medidas: [
      { label: 'Busto', P: '90 cm', M: '94 cm', G: '98 cm' },
      { label: 'Cintura', P: '72 cm', M: '76 cm', G: '80 cm' },
      { label: 'Quadril', P: '96 cm', M: '100 cm', G: '104 cm' },
      { label: 'Comprimento', P: '102 cm', M: '104 cm', G: '106 cm' },
    ],
    dica: '* Medidas aproximadas. Em caso de dúvida, prefira o tamanho maior.',
  },
];

/**
 * Retorna o guia de tamanhos público (pra exibir na página de produto).
 * Lê do banco; se vazio, retorna o padrão.
 */
export async function GET() {
  try {
    const lojaId = headers().get('x-loja-id') || LOJA_DEFAULT;
    const supabase = createClient();
    const { data } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'guias_tamanhos')
      .eq('loja_id', lojaId)
      .maybeSingle();

    if (data?.valor) {
      try {
        const guias = JSON.parse(data.valor);
        if (Array.isArray(guias) && guias.length > 0) {
          return NextResponse.json(guias, {
            headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
          });
        }
      } catch { /* fall through */ }
    }
    return NextResponse.json(GUIA_PADRAO);
  } catch {
    return NextResponse.json(GUIA_PADRAO);
  }
}
