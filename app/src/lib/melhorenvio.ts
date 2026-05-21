/**
 * Cliente Melhor Envio — Multi-tenant
 *
 * Recebe token como parâmetro (de configurações da loja).
 * Fallback pra variável de ambiente apenas se a loja não configurou.
 */

const ME_API_PROD = 'https://melhorenvio.com.br/api/v2';
const ME_API_SANDBOX = 'https://sandbox.melhorenvio.com.br/api/v2';

function getApiUrl(): string {
  return process.env.NODE_ENV === 'production'
    ? (process.env.MELHORENVIO_API_URL || ME_API_PROD)
    : (process.env.MELHORENVIO_SANDBOX_URL || ME_API_SANDBOX);
}

export interface FreteOption {
  id: number;
  name: string;
  company: { name: string; picture: string };
  price: string;
  custom_price: string;
  delivery_time: number;
  custom_delivery_range: { min: number; max: number };
  error: string | null;
}

export interface ProdutoFrete {
  id: string;
  weight: number;
  width: number;
  height: number;
  length: number;
  quantity: number;
  insurance_value: number;
}

export interface CalcularFreteParams {
  cep_origem: string;
  cep_destino: string;
  produtos: ProdutoFrete[];
  token?: string;        // 🆕 Token específico da loja (vem do banco)
  userAgent?: string;    // 🆕 User-Agent personalizado (opcional)
}

export async function calcularFrete(params: CalcularFreteParams): Promise<FreteOption[]> {
  // Prioridade: 1) token do parâmetro (da loja) → 2) token global do env (fallback)
  const token = params.token || process.env.MELHORENVIO_TOKEN;
  if (!token) {
    console.warn('[melhorenvio] Token não configurado');
    return [];
  }

  const userAgent = params.userAgent || 'Multi-loja/1.0 (admin@sualoja.com.br)';

  const res = await fetch(`${getApiUrl()}/me/shipment/calculate`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': userAgent,
    },
    body: JSON.stringify({
      from: { postal_code: params.cep_origem.replace(/\D/g, '') },
      to:   { postal_code: params.cep_destino.replace(/\D/g, '') },
      products: params.produtos,
      services: '1,2,3,4,17',
      options: {
        insurance_value: params.produtos.reduce((s, p) => s + p.insurance_value, 0),
        receipt: false,
        own_hand: false,
      },
    }),
  });

  if (!res.ok) {
    console.error('[melhorenvio] Erro HTTP:', res.status, await res.text());
    return [];
  }

  const data = await res.json();
  return Array.isArray(data) ? data.filter((opt: FreteOption) => !opt.error) : [];
}

// ════════════════════════════════════════════════════════════════
// ETIQUETAS — fluxo completo: cart → checkout → generate → print
// ════════════════════════════════════════════════════════════════

export interface DadosEtiqueta {
  servico_id: number;       // ID do serviço (PAC=1, SEDEX=2, etc) escolhido no checkout
  from: {
    name: string; phone: string; email: string;
    document: string;
    company_document?: string;
    address: string; number: string;
    complement?: string; district: string; city: string;
    country_id: string; postal_code: string; state_abbr: string;
  };
  to: {
    name: string; phone: string; email: string;
    document: string; address: string; number: string;
    complement?: string; district: string; city: string;
    country_id: string; postal_code: string; state_abbr: string;
  };
  produtos: Array<{
    name: string; quantity: number; unitary_value: number;
  }>;
  volumes: Array<{ height: number; width: number; length: number; weight: number }>;
  options: {
    insurance_value: number;
    receipt?: boolean;
    own_hand?: boolean;
    reverse?: boolean;
    non_commercial?: boolean;
    invoice?: { key: string };
    platform?: string;
    tags?: Array<{ tag: string; url?: string }>;
  };
}

async function meFetch(path: string, token: string, userAgent: string, body?: unknown, method = 'POST') {
  const res = await fetch(`${getApiUrl()}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': userAgent,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) {
    const err = new Error(json?.message || json?.error || `HTTP ${res.status}`);
    (err as any).response = json;
    (err as any).status = res.status;
    throw err;
  }
  return json;
}

/**
 * Fluxo COMPLETO: adiciona ao carrinho ME → checkout → gera etiqueta → URL pra imprimir.
 * Retorna { orderId, trackingCode, printUrl }.
 */
export async function gerarEtiquetaCompleta(params: {
  token: string;
  userAgent: string;
  dados: DadosEtiqueta;
}): Promise<{ orderId: string; trackingCode: string | null; printUrl: string | null }> {
  const { token, userAgent, dados } = params;

  // 1. INSERT no carrinho ME
  const cart = await meFetch('/me/cart', token, userAgent, {
    service: dados.servico_id,
    from: dados.from,
    to: dados.to,
    products: dados.produtos,
    volumes: dados.volumes,
    options: dados.options,
  });
  const orderId = cart.id || cart.data?.id;
  if (!orderId) throw new Error('Falha ao adicionar ao carrinho Melhor Envio');

  // 2. CHECKOUT — debita o saldo da conta
  await meFetch('/me/shipment/checkout', token, userAgent, { orders: [orderId] });

  // 3. GENERATE — gera a etiqueta
  await meFetch('/me/shipment/generate', token, userAgent, { orders: [orderId] });

  // 4. PRINT — URL pra imprimir (PDF)
  const printResp = await meFetch('/me/shipment/print', token, userAgent, {
    mode: 'private', // privado pra admin
    orders: [orderId],
  });
  const printUrl = printResp.url || null;

  // 5. TRACKING — código de rastreio
  let trackingCode: string | null = null;
  try {
    const tracking = await meFetch('/me/shipment/tracking', token, userAgent, { orders: [orderId] });
    // Resposta vem como { [orderId]: { tracking: 'XX123' } } ou similar
    trackingCode = tracking?.[orderId]?.tracking
      ?? tracking?.[orderId]?.melhorenvio_tracking
      ?? tracking?.data?.[orderId]?.tracking
      ?? null;
  } catch {
    // Tracking pode demorar a aparecer — não é erro fatal
  }

  return { orderId, trackingCode, printUrl };
}

/**
 * Apenas busca o tracking de uma etiqueta já gerada
 */
export async function buscarTrackingEtiqueta(params: {
  token: string;
  userAgent: string;
  orderId: string;
}): Promise<string | null> {
  try {
    const t = await meFetch('/me/shipment/tracking', params.token, params.userAgent, {
      orders: [params.orderId],
    });
    return t?.[params.orderId]?.tracking ?? t?.[params.orderId]?.melhorenvio_tracking ?? null;
  } catch {
    return null;
  }
}

