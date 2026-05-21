const CHECKOUT_API = 'https://api.checkout.infinitepay.io';

export interface InfinitePayItem {
  quantity: number;
  price: number; // centavos (R$ 10.00 = 1000)
  description: string;
}

export interface InfinitePayCustomer {
  name: string;
  email: string;
  phone_number: string;
}

export interface InfinitePayAddress {
  cep: string;
  street: string;
  neighborhood: string;
  number: string;
  city?: string;
  state?: string;
  complement?: string;
}

export interface CreateCheckoutLinkInput {
  handle: string;
  redirect_url: string;
  webhook_url: string;
  order_nsu: string;
  items: InfinitePayItem[];
  customer: InfinitePayCustomer;
  address?: InfinitePayAddress;
  payment_methods?: string[]; // ['pix'], ['credit_card'], ['boleto'] — filtra métodos
}

export interface CheckoutLinkResponse {
  url: string;
}

// Normaliza o handle: remove $ e espaços, deixa minúsculo
function normalizeHandle(handle: string): string {
  return (handle || '').trim().replace(/^\$+/, '').toLowerCase();
}

export async function createCheckoutLink(input: CreateCheckoutLinkInput): Promise<CheckoutLinkResponse> {
  const payload = { ...input, handle: normalizeHandle(input.handle) };
  const res = await fetch(`${CHECKOUT_API}/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    let mensagem = `InfinitePay erro ${res.status}: ${errorBody}`;
    if (errorBody.includes('Merchant not found')) {
      mensagem = `InfiniteTag inválida. Verifique em /admin/configuracoes → Pagamento se sua InfiniteTag está correta. Se o erro persistir, ative ela em: App InfinitePay → Perfil → InfiniteTag.`;
    }
    throw new Error(mensagem);
  }

  return res.json();
}

export interface PaymentCheckInput {
  handle: string;
  order_nsu: string;
  transaction_nsu?: string;
  slug?: string;
}

export async function checkPayment(input: PaymentCheckInput) {
  const payload = { ...input, handle: normalizeHandle(input.handle) };
  const res = await fetch(`${CHECKOUT_API}/payment_check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`InfinitePay payment_check erro ${res.status}: ${errorBody}`);
  }

  return res.json();
}

export interface InfinitePayWebhookPayload {
  invoice_slug: string;
  amount: number;
  paid_amount: number;
  installments: number;
  capture_method: string;
  transaction_nsu: string;
  order_nsu: string;
  receipt_url: string;
  items: InfinitePayItem[];
}
