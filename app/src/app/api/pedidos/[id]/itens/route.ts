import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('pedido_itens')
      .select('produto_id, nome_produto, produto_imagens:produto_id(url)')
      .eq('pedido_id', params.id);

    const itens = (data ?? []).map((i: { produto_id: string; nome_produto: string; produto_imagens?: { url: string }[] }) => ({
      id: i.produto_id,
      nome: i.nome_produto,
      imagem: Array.isArray(i.produto_imagens) ? i.produto_imagens[0]?.url : undefined,
    }));

    return NextResponse.json({ itens });
  } catch {
    return NextResponse.json({ itens: [] });
  }
}
