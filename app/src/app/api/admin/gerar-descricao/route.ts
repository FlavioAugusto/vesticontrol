import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/admin';

const LOJA_DEFAULT = '00000000-0000-0000-0000-000000000001';

/**
 * Gera descrição de produto com foco em CONVERSÃO.
 * Detecta o TIPO do produto pelo nome (vestido, blusa, conjunto, calça, etc)
 * e adapta a linguagem. Não menciona composição/tecido a menos que seja passado.
 */

// Detecta tipo de produto a partir do nome
function detectarTipo(nome: string): string {
  const n = nome.toLowerCase();
  if (n.includes('vestido')) return 'vestido';
  if (n.includes('conjunto')) return 'conjunto';
  if (n.includes('blusa') || n.includes('camisa') || n.includes('top') || n.includes('cropped')) return 'blusa';
  if (n.includes('calça') || n.includes('calca') || n.includes('pantalona')) return 'calca';
  if (n.includes('saia')) return 'saia';
  if (n.includes('short')) return 'short';
  if (n.includes('macacão') || n.includes('macacao')) return 'macacao';
  if (n.includes('jaqueta') || n.includes('blazer') || n.includes('casaco')) return 'casaco';
  if (n.includes('sapato') || n.includes('tênis') || n.includes('tenis') || n.includes('sandália') || n.includes('sandalia') || n.includes('bota')) return 'calcado';
  if (n.includes('bolsa') || n.includes('mochila') || n.includes('clutch')) return 'bolsa';
  if (n.includes('colar') || n.includes('brinco') || n.includes('pulseira') || n.includes('anel')) return 'acessorio';
  return 'peca';
}

// Pegadas de cada tipo (chamadas + diferenciais)
const ESTILOS: Record<string, { chamadas: string[]; diferenciais: string[]; ocasioes: string[] }> = {
  vestido: {
    chamadas: ['feita pra te valorizar', 'a peça curinga do seu armário', 'pra você brilhar onde quiser', 'a sua nova peça favorita'],
    diferenciais: ['Caimento que abraça a silhueta', 'Modelagem pensada na mulher real', 'Versátil pra inúmeras ocasiões', 'Tecido confortável que não amassa fácil', 'Acabamento impecável nas costuras'],
    ocasioes: ['um jantar romântico', 'um almoço em família', 'um evento de trabalho', 'um passeio com as amigas', 'uma festa especial'],
  },
  conjunto: {
    chamadas: ['coordenado dos sonhos', 'praticidade e elegância em uma única escolha', 'a combinação perfeita já pronta', 'sai pronta sem precisar pensar'],
    diferenciais: ['Peças coordenadas — combina sem esforço', 'Pode usar junto OU separado, multiplica seu guarda-roupa', 'Modelagem ajustável e confortável', 'Visual sofisticado em segundos', 'Tendência atual'],
    ocasioes: ['o trabalho', 'um happy hour', 'um almoço de domingo', 'eventos casuais', 'viagens'],
  },
  blusa: {
    chamadas: ['o coringa que combina com tudo', 'pra elevar qualquer look', 'aquela peça que você usa toda semana', 'simples e poderosa'],
    diferenciais: ['Modelagem moderna', 'Combina com calça, saia, short — vai com tudo', 'Conforto em qualquer ocasião', 'Acabamento de qualidade', 'Versatilidade que rende dezenas de looks'],
    ocasioes: ['o dia a dia', 'reuniões', 'encontros casuais', 'passeios', 'eventos descontraídos'],
  },
  calca: {
    chamadas: ['a calça que VAI bem com tudo', 'modelagem que veste perfeitamente', 'conforto sem abrir mão do estilo', 'sua nova queridinha'],
    diferenciais: ['Caimento perfeito que valoriza as pernas', 'Cintura confortável', 'Tecido com leve elasticidade', 'Combina com vários estilos', 'Pode usar do trabalho ao happy hour'],
    ocasioes: ['o escritório', 'happy hour', 'rolês casuais', 'jantares', 'viagens'],
  },
  saia: {
    chamadas: ['pra dar aquele up no look', 'feminilidade em uma única peça', 'a saia que toda mulher precisa ter', 'elegância prática'],
    diferenciais: ['Cinto ajustável para conforto', 'Caimento elegante', 'Tecido leve e estruturado', 'Combina com blusas, tops, cropped', 'Versátil pra muitas ocasiões'],
    ocasioes: ['o trabalho', 'um jantar', 'eventos diurnos', 'happy hour', 'um passeio especial'],
  },
  short: {
    chamadas: ['conforto pro seu verão', 'estilo despojado pra qualquer hora', 'o short que veste bem em todo mundo', 'praticidade com personalidade'],
    diferenciais: ['Modelagem soltinha e confortável', 'Cintura alta que valoriza', 'Tecido fresco', 'Combina com cropped, tops e blusas', 'Versátil pra dia e noite'],
    ocasioes: ['o verão', 'praia', 'rolê casual', 'final de semana', 'viagens'],
  },
  macacao: {
    chamadas: ['praticidade que arrasa', 'um único movimento e está pronta', 'o jeito mais fácil de ficar linda', 'estilo descomplicado'],
    diferenciais: ['Peça única — economiza tempo', 'Modelagem que valoriza', 'Versátil pra dia e noite', 'Acabamento elegante', 'Combinação fácil com acessórios'],
    ocasioes: ['um evento especial', 'happy hour', 'jantares', 'viagens', 'eventos casuais'],
  },
  casaco: {
    chamadas: ['o toque final no seu look', 'aquece com estilo', 'a peça que finaliza qualquer produção', 'sofisticação no inverno'],
    diferenciais: ['Caimento estruturado', 'Forro de qualidade', 'Versátil pra combinar com vários estilos', 'Acabamento impecável', 'Aquece sem perder a elegância'],
    ocasioes: ['o inverno', 'noites mais frias', 'viagens', 'eventos noturnos', 'meio-tempo'],
  },
  calcado: {
    chamadas: ['pra arrasar com conforto', 'o sapato que vai com tudo', 'estilo e conforto na medida certa', 'sua nova obsessão'],
    diferenciais: ['Solado confortável o dia todo', 'Material de qualidade', 'Design que combina com vários looks', 'Acabamento premium', 'Durabilidade comprovada'],
    ocasioes: ['o dia a dia', 'trabalho', 'eventos', 'rolês', 'qualquer ocasião'],
  },
  bolsa: {
    chamadas: ['acessório que faz a diferença', 'a bolsa que completa o look', 'praticidade e estilo juntos', 'sua nova companheira'],
    diferenciais: ['Espaço inteligente — cabe o essencial', 'Material durável', 'Alças confortáveis', 'Design versátil', 'Acabamento de marca'],
    ocasioes: ['o dia a dia', 'happy hour', 'trabalho', 'eventos', 'viagens curtas'],
  },
  acessorio: {
    chamadas: ['o detalhe que muda tudo', 'feminilidade em forma de joia', 'pra dar aquele toque especial', 'sofisticação na medida certa'],
    diferenciais: ['Acabamento delicado', 'Material anti-alérgico', 'Combina com qualquer look', 'Durabilidade da cor e do brilho', 'Embalagem para presente'],
    ocasioes: ['o dia a dia', 'eventos especiais', 'presentes', 'looks de festa', 'looks de trabalho'],
  },
  peca: {
    chamadas: ['feita pra você se destacar', 'a sua nova peça favorita', 'estilo na medida certa', 'pra elevar qualquer look'],
    diferenciais: ['Modelagem que valoriza', 'Acabamento profissional', 'Versátil pra várias ocasiões', 'Qualidade premium', 'Atemporal — sempre na moda'],
    ocasioes: ['o dia a dia', 'eventos', 'encontros', 'trabalho', 'momentos especiais'],
  },
};

function pegarAleatorio<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pegarVarios<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const { nome, categoria, composicao, tecido, textoExistente } = await req.json();
    if (!nome) {
      return NextResponse.json({ error: 'Nome do produto obrigatório' }, { status: 400 });
    }

    // Se há texto existente, IA COMPLEMENTA — gera só os blocos faltantes
    const temIntro = !!(textoExistente && textoExistente.trim().length > 10);

    // Detecta a loja
    const lojaId = headers().get('x-loja-id') || LOJA_DEFAULT;
    const supabase = createClient();
    const { data: configsLoja } = await supabase
      .from('configuracoes')
      .select('chave, valor')
      .eq('loja_id', lojaId)
      .in('chave', ['loja_nome', 'parcelas_sem_juros']);

    const cfg: Record<string, string> = {};
    (configsLoja ?? []).forEach((c: { chave: string; valor: string }) => { cfg[c.chave] = c.valor; });

    const nomeLoja = cfg.loja_nome || 'Nossa Loja';
    const parcelas = cfg.parcelas_sem_juros || '6';

    // Detecta tipo e pega estilo apropriado
    const tipo = detectarTipo(nome);
    const estilo = ESTILOS[tipo];

    const chamada = pegarAleatorio(estilo.chamadas);
    const diferenciais = pegarVarios(estilo.diferenciais, 4);
    const ocasioes = pegarVarios(estilo.ocasioes, 3).join(', ');

    // Linha de tecido/composição APENAS se foi explicitamente informado
    let linhaTecido = '';
    if (tecido) {
      linhaTecido = `\n🧵 TECIDO: ${tecido}`;
    } else if (composicao && composicao !== 'Tricoline 100% Algodão') {
      // Só menciona composição se for diferente do default
      linhaTecido = `\n🧵 COMPOSIÇÃO: ${composicao}`;
    }

    // 🆕 Modo COMPLEMENTAR — quando admin já escreveu uma intro
    if (temIntro) {
      const descricaoComplementar = `💎 POR QUE VOCÊ VAI AMAR:
${diferenciais.map(d => `• ${d}`).join('\n')}

🌟 PERFEITA PARA: ${ocasioes}${linhaTecido}

💳 CONDIÇÕES:
✓ Até ${parcelas}x sem juros no cartão
✓ Desconto especial no PIX
✓ Frete grátis acima do valor mínimo
✓ Trocas em até 7 dias

⚡ Estoque limitado por tamanho — garanta o seu!`;

      return NextResponse.json({
        descricao: descricaoComplementar,
        modo: 'complementar',
        tipo,
      });
    }

    // Templates variados (sorteia entre 4)
    const templates = [
      // 1. Emocional curto
      `✨ ${nome} — ${chamada}

${nome} foi pensada pra mulher que sabe o que quer. Quem busca uma peça que combine estilo, conforto e personalidade — sem precisar abrir mão de nenhum dos três.

💎 POR QUE VOCÊ VAI AMAR:
${diferenciais.map(d => `• ${d}`).join('\n')}

🌟 PERFEITA PARA: ${ocasioes}${linhaTecido}

💳 CONDIÇÕES:
✓ Até ${parcelas}x sem juros no cartão
✓ Desconto especial no PIX
✓ Frete grátis acima do valor mínimo
✓ Trocas em até 7 dias

⚡ Estoque limitado por tamanho — garanta o seu!`,

      // 2. Storytelling
      `${nome} 💕

Tem peças que ficam no armário esperando "uma ocasião especial". E tem peças que CRIAM ocasiões especiais. ${nome} é dessas.

Foi feita pra você se sentir bem em qualquer lugar — ${ocasioes}, ou só porque você quer.

🌟 O QUE TORNA ESPECIAL:
${diferenciais.map(d => `→ ${d}`).join('\n')}${linhaTecido}

🛒 PRA LEVAR PRA CASA:
• Parcele em até ${parcelas}x sem juros
• Pague com PIX e ganhe desconto
• Receba em casa com toda segurança

📦 Despache em até 24h úteis. ${nomeLoja} cuida do seu pedido com carinho.`,

      // 3. Direto + conversão
      `🛍️ ${nome}

${nome} é ${chamada}. Uma peça pensada nos detalhes, feita pra quem entende que qualidade faz toda a diferença.

📐 O QUE VOCÊ RECEBE:
${diferenciais.map(d => `✓ ${d}`).join('\n')}${linhaTecido}

🎯 USE EM: ${ocasioes}.

💰 FORMAS DE PAGAMENTO:
• Até ${parcelas}x sem juros no cartão
• PIX com desconto exclusivo
• Boleto à vista

🚀 GARANTIA ${nomeLoja.toUpperCase()}: Se não amar, você troca em até 7 dias úteis.

⏰ Aproveite enquanto o estoque do seu tamanho está disponível.`,

      // 4. Conversa próxima
      `${nome} chegou pra ser ${chamada} ✨

Sabe aquela peça que você bate o olho e já sabe que VAI usar muito? Pois é, ${nome} é dessas. Não é exagero — é só conferir os detalhes:

${diferenciais.map(d => `💫 ${d}`).join('\n')}${linhaTecido}

E olha que combinação versátil: serve pra ${ocasioes} e muito mais.

🛒 PRA COMPRAR:
Parcela em ${parcelas}x sem juros, ou paga com PIX e ganha desconto. Frete grátis na compra acima do valor mínimo.

⚠️ Atenção: produção limitada. Quando acaba o tamanho, acabou. Garante o seu!`,
    ];

    const idx = Math.floor(Math.random() * templates.length);
    return NextResponse.json({
      descricao: templates[idx],
      template: idx + 1,
      tipo,
    });
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : 'Erro ao gerar descrição',
    }, { status: 500 });
  }
}
