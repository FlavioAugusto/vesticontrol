import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const mp = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export interface CreatePreferenceInput {
  items: Array<{ id: string; title: string; quantity: number; unit_price: number }>;
  payer: { name: string; email: string; identification: { type: 'CPF'; number: string } };
  shipments?: { cost: number; mode: 'not_specified' };
  external_reference: string;
  back_urls: { success: string; failure: string; pending: string };
}

export async function createMercadoPagoPreference(input: CreatePreferenceInput) {
  const preference = new Preference(mp);
  return preference.create({
    body: {
      items: input.items,
      payer: input.payer,
      payment_methods: { installments: 12, default_installments: 1 },
      shipments: input.shipments,
      external_reference: input.external_reference,
      back_urls: input.back_urls,
      auto_return: 'approved',
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercadopago/webhook`,
    },
  });
}

export async function getMercadoPagoPayment(paymentId: string) {
  const payment = new Payment(mp);
  return payment.get({ id: parseInt(paymentId) });
}
