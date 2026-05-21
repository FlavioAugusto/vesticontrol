import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { loja_nome, loja_instagram, categorias } = await req.json();

    const supabase = createClient();

    // Busca dados reais da loja para contextualizar o SEO
    const { data: configs } = await supabase
      .from('configuracoes')
      .select('chave, valor')
      .in('chave', ['loja_nome', 'loja_email', 'loja_whatsapp', 'rodape_endereco']);

    const configMap: Record<string, string> = {};
    (configs ?? []).forEach((c: { chave: string; valor: string }) => { configMap[c.chave] = c.valor; });

    const nomeLoja = loja_nome || configMap.loja_nome || 'By Marcelo Medeiros';
    const cidade = configMap.rodape_endereco?.split(',')[0]?.trim() || 'Caruaru';
    const instagram = loja_instagram || '';

    // Gera opções de SEO estratégico para moda feminina
    const opcoes = {
      titulo_principal: `${nomeLoja} | Moda Feminina Premium — Vestidos e Conjuntos`,
      titulo_local: `${nomeLoja} — Alta Costura Feminina em ${cidade} | Vestidos e Conjuntos`,
      titulo_descritivo: `Vestidos Femininos e Conjuntos de Alta Costura | ${nomeLoja}`,

      descricao_completa: `Descubra a coleção exclusiva de vestidos e conjuntos femininos da ${nomeLoja}. Alta costura com elegância, exclusividade e muito estilo. Vestidos midi, longos e conjuntos premium para mulheres que exigem o melhor. Compre online com entrega para todo o Brasil.`,
      descricao_local: `${nomeLoja} — Loja de moda feminina com vestidos e conjuntos de alta costura. Coleções exclusivas de vestidos midi, longos e conjuntos premium. Parcele em até 6x sem juros. Entrega para todo o Brasil.`,
      descricao_conversao: `Vestidos e conjuntos femininos de alta costura com até 6x sem juros. ${nomeLoja} oferece peças exclusivas que celebram a elegância feminina. Coleções midi, longos e conjuntos coordenados. Frete grátis acima de R$ 497.`,

      // Palavras-chave estratégicas
      keywords: [
        'vestidos femininos',
        'conjuntos femininos',
        'moda feminina premium',
        'vestidos midi femininos',
        'vestidos longos elegantes',
        'conjuntos de alta costura',
        'moda feminina exclusiva',
        `${nomeLoja}`,
        'roupas femininas online',
        'vestidos para festas',
        'moda feminina',
        'alta costura feminina',
      ].join(', '),

      // Título e descrição recomendados (melhor equilíbrio)
      titulo_recomendado: `${nomeLoja} | Vestidos e Conjuntos Femininos Premium`,
      descricao_recomendada: `Coleção exclusiva de vestidos midi, longos e conjuntos femininos de alta costura. Elegância e exclusividade em cada peça. Parcele em até 6x sem juros • Frete grátis acima de R$ 497 • Entrega para todo o Brasil.`,

      dicas: [
        'Título ideal: 50-60 caracteres (aparece completo no Google)',
        'Descrição ideal: 150-160 caracteres (aparece no resultado de busca)',
        'Inclua palavras-chave naturalmente no título e descrição',
        'Mencione benefícios: parcelamento, frete grátis, entrega rápida',
        'A descrição deve chamar a atenção e incentivar o clique',
      ],
    };

    return NextResponse.json({ ok: true, opcoes, nomeLoja, cidade });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
