/**
 * Módulo de automação WhatsApp — By Marcelo Medeiros
 *
 * PREPARADO para integração futura com:
 * - Twilio WhatsApp API
 * - Zapi (https://zapi.io)
 * - WPPConnect
 *
 * Para ativar: configure WHATSAPP_API_URL e WHATSAPP_TOKEN no .env.local
 * e implemente sendWhatsApp() com a API escolhida.
 */

export interface WhatsAppMessage {
  telefone: string;  // formato: 5581999999999 (55 + DDD + número)
  mensagem: string;
}

export interface PedidoInfo {
  numero: number;
  total: number;
  status: string;
  codigo_rastreio?: string;
  transportadora?: string;
  cliente_nome: string;
  cliente_telefone: string;
  itens: Array<{ nome: string; tamanho: string; cor?: string; quantidade: number }>;
}

// Templates de mensagens
export const TEMPLATES = {
  pedido_confirmado: (p: PedidoInfo) => `
✅ *Pedido Confirmado!*
Olá, ${p.cliente_nome}!

Seu pedido #${p.numero} foi *confirmado com sucesso*! 🎉

*Itens:*
${p.itens.map(i => `• ${i.nome} — ${i.tamanho}${i.cor ? `/${i.cor}` : ''} (x${i.quantidade})`).join('\n')}

*Total:* R$ ${p.total.toFixed(2).replace('.', ',')}

Em breve você receberá o código de rastreio.
Obrigada por escolher a *By Marcelo Medeiros* 💛
  `.trim(),

  pedido_enviado: (p: PedidoInfo) => `
📦 *Seu Pedido Foi Enviado!*
Olá, ${p.cliente_nome}!

Seu pedido #${p.numero} saiu para entrega! 🚚

*Transportadora:* ${p.transportadora ?? 'Correios'}
*Código de Rastreio:* \`${p.codigo_rastreio ?? 'Em processamento'}\`

Acompanhe em: https://www.correios.com.br/rastreamento

Qualquer dúvida, fale com a gente! 💛
*By Marcelo Medeiros*
  `.trim(),

  pedido_entregue: (p: PedidoInfo) => `
🎉 *Pedido Entregue!*
Olá, ${p.cliente_nome}!

Seu pedido #${p.numero} foi entregue!

Esperamos que você *ame* sua nova peça! 😍

Se precisar de troca ou tiver alguma dúvida, é só chamar.

Que tal nos contar sua experiência? Sua opinião é muito importante pra gente! ⭐
*By Marcelo Medeiros*
  `.trim(),

  pix_pendente: (numero: number, total: number, nome: string) => `
⏰ *PIX Aguardando Pagamento*
Olá, ${nome}!

Seu pedido #${numero} está aguardando o pagamento PIX.
*Valor:* R$ ${total.toFixed(2).replace('.', ',')}

Você tem *15 minutos* para finalizar. Após esse prazo o pedido será cancelado automaticamente.

Precisa de ajuda? Responda esta mensagem! 💛
  `.trim(),
};

/**
 * Função principal de envio (implementar com a API escolhida)
 *
 * @param msg - Dados da mensagem
 * @returns Promise<boolean> - true se enviou com sucesso
 */
export async function sendWhatsApp(msg: WhatsAppMessage): Promise<boolean> {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const apiToken = process.env.WHATSAPP_TOKEN;

  // Se API não configurada, apenas logar (modo desenvolvimento)
  if (!apiUrl || !apiToken) {
    console.log('[WhatsApp] Mensagem não enviada (API não configurada):', {
      para: msg.telefone,
      preview: msg.mensagem.slice(0, 100) + '...',
    });
    return false;
  }

  try {
    // Exemplo com Zapi:
    // const res = await fetch(`${apiUrl}/send-text`, {
    //   method: 'POST',
    //   headers: { 'Client-Token': apiToken, 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ phone: msg.telefone, message: msg.mensagem }),
    // });
    // return res.ok;

    // Exemplo com Twilio:
    // const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_SID}/Messages.json`, {
    //   method: 'POST',
    //   headers: { Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}` },
    //   body: new URLSearchParams({ From: `whatsapp:+${process.env.TWILIO_WHATSAPP_NUMBER}`, To: `whatsapp:+${msg.telefone}`, Body: msg.mensagem }),
    // });
    // return res.ok;

    console.log('[WhatsApp] API configurada mas implementação pendente:', apiUrl);
    return false;
  } catch (err) {
    console.error('[WhatsApp] Erro ao enviar:', err);
    return false;
  }
}

/**
 * Notificações automáticas por evento do pedido
 * Chamadas pelos webhooks de pagamento
 */
export async function notificarCliente(tipo: keyof typeof TEMPLATES, pedido: PedidoInfo): Promise<void> {
  if (!pedido.cliente_telefone) return;

  const telefone = pedido.cliente_telefone.replace(/\D/g, '');
  const telefoneFull = telefone.startsWith('55') ? telefone : `55${telefone}`;

  const mensagem = TEMPLATES[tipo](pedido as never);
  await sendWhatsApp({ telefone: telefoneFull, mensagem });
}
