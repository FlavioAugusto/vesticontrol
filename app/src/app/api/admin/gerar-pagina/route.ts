import { NextRequest, NextResponse } from 'next/server';

const TEMPLATES: Record<string, string> = {
  modal_privacidade: `A {NOME_LOJA} respeita e protege a privacidade de seus clientes.

COLETA DE DADOS
Coletamos apenas os dados necessários para processar seus pedidos: nome, e-mail, CPF, endereço e telefone.

USO DAS INFORMAÇÕES
Suas informações são utilizadas exclusivamente para:
• Processar e entregar seus pedidos
• Enviar confirmações e atualizações de compra
• Comunicações de marketing (somente com seu consentimento)
• Melhorar a experiência de compra

SEGURANÇA
Todos os dados são protegidos por criptografia SSL. Não compartilhamos suas informações com terceiros, exceto transportadoras para entrega.

SEUS DIREITOS
Você pode solicitar a exclusão dos seus dados a qualquer momento pelo e-mail {EMAIL}.`,

  modal_termos: `Ao utilizar o site da {NOME_LOJA}, você concorda com os seguintes termos:

PRODUTOS
• Todas as peças são confeccionadas com matéria-prima selecionada
• As cores podem variar levemente conforme calibração do monitor
• Medidas informadas são aproximadas

PEDIDOS
• O pedido é confirmado após a aprovação do pagamento
• Prazo de produção e envio: até 7 dias úteis após confirmação

CANCELAMENTO
• Pedidos podem ser cancelados em até 24h após a compra

PAGAMENTOS
• Aceitamos cartão de crédito, PIX e boleto
• Todas as transações são processadas em ambiente seguro

PROPRIEDADE INTELECTUAL
• Todo o conteúdo deste site é propriedade da {NOME_LOJA}`,

  modal_pagamento: `A {NOME_LOJA} oferece diversas formas de pagamento:

CARTÃO DE CRÉDITO
• Parcelamento sem juros
• Aceitos: Visa, Mastercard, Elo, American Express
• Processamento seguro

PIX — DESCONTO ESPECIAL
• Pagamento instantâneo
• QR Code gerado no checkout
• Confirmação em até 5 minutos

BOLETO BANCÁRIO
• Vencimento em 2 dias úteis
• Confirmação após compensação

SEGURANÇA
• Ambiente 100% protegido com certificado SSL
• Seus dados financeiros nunca são armazenados em nosso servidor`,

  modal_frete: `FRETE GRÁTIS NA PRIMEIRA COMPRA
Sua primeira compra tem frete grátis em todo o Brasil!

FRETE GRÁTIS ACIMA DE R$ 499,90
Para pedidos acima desse valor.

PRAZOS DE ENTREGA
• Nordeste: 5 a 8 dias úteis
• Sul e Sudeste: 7 a 12 dias úteis
• Norte e Centro-Oeste: 10 a 15 dias úteis

Os prazos são contados após a confirmação do pagamento.

TRANSPORTADORAS
Trabalhamos com Correios (PAC e SEDEX) e transportadoras parceiras.

RASTREAMENTO
Após o envio, você recebe o código de rastreamento por e-mail.`,

  modal_tamanhos: `Nossas peças seguem o padrão brasileiro de numeração:

Tamanho P
• Busto: 88–92 cm
• Cintura: 70–74 cm
• Quadril: 94–98 cm

Tamanho M
• Busto: 92–96 cm
• Cintura: 74–78 cm
• Quadril: 98–102 cm

Tamanho G
• Busto: 96–100 cm
• Cintura: 78–82 cm
• Quadril: 102–106 cm

COMO MEDIR
1. Use uma fita métrica flexível
2. Meça sempre sobre a lingerie ou roupa fina
3. Mantenha a fita justa, sem apertar

Em caso de dúvida entre tamanhos, prefira o maior.`,

  modal_trocas: `Você tem 30 dias para trocas e devoluções a partir do recebimento.

CONDIÇÕES PARA TROCA
• Peça sem uso, com etiqueta original
• Embalagem original ou equivalente
• Comprovante de compra

COMO SOLICITAR
1. Entre em contato pelo WhatsApp ou e-mail
2. Informe número do pedido e motivo
3. Aguarde nossas instruções de devolução

PRODUTO COM DEFEITO
• Troca imediata sem custo de frete
• Devolução completa do valor pago

PRODUTO QUE NÃO AGRADOU
• Troca por outro tamanho/peça (sujeito à disponibilidade)
• Frete de retorno por conta do cliente

Prazo de reembolso: até 7 dias úteis após recebermos a peça.`,
};

export async function POST(req: NextRequest) {
  try {
    const { tipo, contexto } = await req.json();
    const template = TEMPLATES[tipo as string];
    if (!template) return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });

    const conteudo = template
      .replace(/{NOME_LOJA}/g, contexto?.nomeLoja ?? 'By Marcelo Medeiros')
      .replace(/{EMAIL}/g, contexto?.email ?? 'contato@bymarcelomedeiros.com.br');

    return NextResponse.json({ conteudo });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro' }, { status: 500 });
  }
}
