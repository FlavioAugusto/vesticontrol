import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';
import { createClient as userClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { codigo, total } = await req.json();
    if (!codigo) return NextResponse.json({ valido: false, mensagem: 'Código inválido' });

    const supabase = createClient(); // service role

    // 1. Buscar cupom
    const { data: cupom } = await supabase
      .from('cupons')
      .select('*')
      .eq('codigo', codigo.toUpperCase().trim())
      .eq('ativo', true)
      .single();

    if (!cupom) return NextResponse.json({ valido: false, mensagem: 'Cupom não encontrado ou inativo' });

    const c = cupom as {
      id: string; tipo: 'percentual' | 'fixo' | 'frete_gratis';
      valor: number | null; uso_maximo: number | null; uso_atual: number;
      valor_minimo: number | null; valido_ate: string | null;
    };

    // 2. Verificar uso máximo global
    if (c.uso_maximo && c.uso_atual >= c.uso_maximo) {
      return NextResponse.json({ valido: false, mensagem: 'Cupom esgotado — limite de usos atingido' });
    }

    // 3. Verificar validade
    if (c.valido_ate && new Date(c.valido_ate) < new Date()) {
      return NextResponse.json({ valido: false, mensagem: 'Cupom expirado' });
    }

    // 4. Verificar valor mínimo
    if (c.valor_minimo && total < c.valor_minimo) {
      return NextResponse.json({
        valido: false,
        mensagem: `Valor mínimo para este cupom: R$ ${c.valor_minimo.toFixed(2).replace('.', ',')}`,
      });
    }

    // 5. Verificar uso único por cliente (se estiver logado)
    try {
      const serverSupa = userClient();
      const { data: { user } } = await serverSupa.auth.getUser();

      if (user) {
        // Verificar se o cliente já usou este cupom em pedidos anteriores (não cancelados)
        const { count } = await supabase
          .from('pedidos')
          .select('*', { count: 'exact', head: true })
          .eq('cliente_id', user.id)
          .eq('cupom_codigo', codigo.toUpperCase().trim())
          .not('status', 'in', '("cancelado","reembolsado")');

        if ((count ?? 0) > 0) {
          return NextResponse.json({
            valido: false,
            mensagem: 'Você já utilizou este cupom em um pedido anterior. Cada cupom é de uso único por cliente.',
          });
        }
      }
    } catch { /* usuário não logado — permite sem verificação de uso único */ }

    // 6. Calcular desconto
    let desconto = 0;
    if (c.tipo === 'percentual' && c.valor) desconto = Math.round((total * c.valor) / 100 * 100) / 100;
    else if (c.tipo === 'fixo' && c.valor) desconto = Math.min(c.valor, total);

    return NextResponse.json({
      valido: true,
      desconto,
      tipo: c.tipo,
      mensagem: `Cupom ${codigo.toUpperCase()} aplicado!`,
    });
  } catch (error: unknown) {
    return NextResponse.json({ valido: false, mensagem: error instanceof Error ? error.message : 'Erro' });
  }
}

// Incrementar uso após pedido confirmado
export async function PATCH(req: NextRequest) {
  try {
    const { codigo } = await req.json();
    if (!codigo) return NextResponse.json({ ok: false });
    const supabase = createClient();
    const { data } = await supabase.from('cupons').select('uso_atual').eq('codigo', codigo.toUpperCase()).single();
    if (data) {
      await supabase.from('cupons').update({ uso_atual: (data as { uso_atual: number }).uso_atual + 1 }).eq('codigo', codigo.toUpperCase());
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
