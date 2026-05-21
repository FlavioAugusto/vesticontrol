import { NextRequest, NextResponse } from 'next/server';
import { calcularFrete } from '@/lib/melhorenvio';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

const LOJA_DEFAULT = '00000000-0000-0000-0000-000000000001';

export async function POST(req: NextRequest) {
  try {
    const { cep, produtos, subtotal } = await req.json();
    const supabase = createClient();

    // 🛡️ Multi-tenant: pega loja do header (middleware) ou default
    const lojaId = headers().get('x-loja-id') || LOJA_DEFAULT;

    // Busca TODAS as configs da loja atual de uma vez
    const { data: configs } = await supabase
      .from('configuracoes')
      .select('chave, valor')
      .eq('loja_id', lojaId)
      .in('chave', [
        'loja_cep_origem',
        'frete_gratis_minimo',
        'melhorenvio_token',
        'melhorenvio_ativo',
        'loja_nome',
        'loja_email',
      ]);

    const map: Record<string, string> = {};
    (configs ?? []).forEach((c: { chave: string; valor: string }) => { map[c.chave] = c.valor; });

    const cepOrigem = map.loja_cep_origem || '';
    const minFreteGratis = parseFloat(map.frete_gratis_minimo ?? '0');
    const melhorenvioAtivo = map.melhorenvio_ativo === 'true';
    const tokenLoja = map.melhorenvio_token || '';
    const nomeLoja = map.loja_nome || 'Loja';
    const emailLoja = map.loja_email || 'admin@loja.com.br';

    // Validações
    if (!cepOrigem) {
      return NextResponse.json({
        error: 'CEP de origem não configurado',
        hint: 'Configure no admin → Configurações → Frete',
      }, { status: 400 });
    }

    if (!melhorenvioAtivo) {
      return NextResponse.json({
        error: 'Melhor Envio desativado para esta loja',
        hint: 'Ative no admin → Configurações → Frete',
      }, { status: 400 });
    }

    if (!tokenLoja) {
      return NextResponse.json({
        error: 'Token Melhor Envio não configurado para esta loja',
        hint: 'Configure no admin → Configurações → Frete → Token do Melhor Envio',
      }, { status: 400 });
    }

    const opcoes = await calcularFrete({
      cep_origem: cepOrigem,
      cep_destino: cep,
      produtos: produtos.map((p: { id: string; peso_gramas?: number; quantidade: number; preco_unitario: number }) => ({
        id: p.id,
        weight: (p.peso_gramas ?? 500) / 1000,
        width: 30,
        height: 10,
        length: 20,
        quantity: p.quantidade,
        insurance_value: p.preco_unitario,
      })),
      token: tokenLoja, // 🆕 Token da loja específica
      userAgent: `${nomeLoja}/1.0 (${emailLoja})`, // 🆕 Identifica a loja correta
    });

    // Calcula subtotal para verificar regra de frete grátis
    const subtotalCalc = typeof subtotal === 'number'
      ? subtotal
      : produtos.reduce((s: number, p: { quantidade: number; preco_unitario: number }) => s + (p.quantidade * p.preco_unitario), 0);

    const elegivelFreteGratis = minFreteGratis > 0 && subtotalCalc >= minFreteGratis;

    function nomeAmigavel(nome: string): string {
      const n = nome.toLowerCase().trim();
      if (n.includes('sedex')) return 'SEDEX (Rápido)';
      if (n === 'pac' || n.includes('pac')) return 'PAC (Econômico)';
      if (n.includes('mini envios')) return 'Mini Envios (Cartas)';
      if (n.startsWith('.com') || n === '.com') return 'Econômico';
      if (n.startsWith('.package') || n === '.package') return 'Express';
      if (n.includes('rodoviário')) return 'Rodoviário';
      if (n.includes('aéreo') || n.includes('aereo')) return 'Aéreo Express';
      return nome.replace(/^\./, '');
    }

    return NextResponse.json(
      opcoes.map((o) => ({
        id: o.id,
        nome: nomeAmigavel(o.name),
        empresa: o.company.name,
        preco: elegivelFreteGratis ? 0 : parseFloat(o.custom_price || o.price),
        preco_original: parseFloat(o.custom_price || o.price),
        prazo: `${o.custom_delivery_range.min}–${o.custom_delivery_range.max} dias úteis`,
        prazo_min: o.custom_delivery_range.min,
        prazo_max: o.custom_delivery_range.max,
        gratis: elegivelFreteGratis,
      }))
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
