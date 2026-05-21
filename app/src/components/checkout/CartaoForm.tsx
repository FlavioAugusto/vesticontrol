'use client';

import { useEffect, useState, useRef } from 'react';
import { CreditCard, Lock } from 'lucide-react';

// Tipos mínimos do SDK do MercadoPago.js v2
interface MercadoPagoInstance {
  getPaymentMethods: (args: { bin: string }) => Promise<{ results?: Array<{ id: string }> }>;
  createCardToken: (data: {
    cardNumber: string; cardholderName: string;
    cardExpirationMonth: string; cardExpirationYear: string;
    securityCode: string; identificationType: string; identificationNumber: string;
  }) => Promise<{ id: string }>;
}
type MercadoPagoConstructor = new (publicKey: string, options?: { locale?: string }) => MercadoPagoInstance;

declare global {
  interface Window { MercadoPago?: MercadoPagoConstructor }
}

export interface CartaoData {
  token: string;
  payment_method_id: string;
  installments: number;
  card_last_four: string;
  cardholder_name: string;
}

interface Props {
  total: number;
  parcelasMax?: number;
  onTokenize: (data: CartaoData) => Promise<void>;
  loading?: boolean;
}

const PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;

export default function CartaoForm({ total, parcelasMax = 6, onTokenize, loading }: Props) {
  const [mpReady, setMpReady] = useState(false);
  const [erroCarregar, setErroCarregar] = useState('');
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [exp, setExp] = useState('');
  const [cvv, setCvv] = useState('');
  const [cpf, setCpf] = useState('');
  const [parcelas, setParcelas] = useState(1);
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [erro, setErro] = useState('');
  const [processando, setProcessando] = useState(false);
  const mpRef = useRef<MercadoPagoInstance | null>(null);

  // Carrega o SDK do MercadoPago dinamicamente
  useEffect(() => {
    if (!PUBLIC_KEY) {
      setErroCarregar('Chave pública do MercadoPago não configurada');
      return;
    }
    if (window.MercadoPago) {
      mpRef.current = new window.MercadoPago(PUBLIC_KEY, { locale: 'pt-BR' });
      setMpReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    script.onload = () => {
      if (window.MercadoPago) {
        mpRef.current = new window.MercadoPago(PUBLIC_KEY, { locale: 'pt-BR' });
        setMpReady(true);
      }
    };
    script.onerror = () => setErroCarregar('Erro ao carregar SDK de pagamento');
    document.body.appendChild(script);
  }, []);

  // Detecta a bandeira do cartão (BIN)
  useEffect(() => {
    const bin = number.replace(/\D/g, '').slice(0, 8);
    if (bin.length < 6 || !mpRef.current) { setPaymentMethodId(''); return; }
    mpRef.current.getPaymentMethods({ bin })
      .then((r) => {
        if (r?.results && r.results.length > 0) setPaymentMethodId(r.results[0].id);
      }).catch(() => {});
  }, [number]);

  function formatCardNumber(v: string) {
    return v.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
  }
  function formatExp(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 4);
    if (d.length < 3) return d;
    return d.slice(0, 2) + '/' + d.slice(2);
  }
  function formatCpf(v: string) {
    return v.replace(/\D/g, '').slice(0, 11)
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
  }

  async function handleSubmit() {
    setErro('');
    if (!mpReady || !mpRef.current) { setErro('SDK não está pronto'); return; }
    if (!paymentMethodId) { setErro('Bandeira do cartão não reconhecida'); return; }

    const [mes, ano] = exp.split('/');
    if (!mes || !ano || mes.length !== 2 || ano.length !== 2) { setErro('Validade inválida (MM/AA)'); return; }
    if (cvv.length < 3) { setErro('CVV inválido'); return; }
    if (name.trim().length < 3) { setErro('Nome do titular inválido'); return; }
    const cpfDigits = cpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) { setErro('CPF inválido'); return; }

    setProcessando(true);
    try {
      const tokenResult = await mpRef.current.createCardToken({
        cardNumber: number.replace(/\s/g, ''),
        cardholderName: name.trim(),
        cardExpirationMonth: mes,
        cardExpirationYear: ano,
        securityCode: cvv,
        identificationType: 'CPF',
        identificationNumber: cpfDigits,
      });

      if (!tokenResult?.id) {
        setErro('Não foi possível tokenizar o cartão. Verifique os dados.');
        return;
      }

      await onTokenize({
        token: tokenResult.id,
        payment_method_id: paymentMethodId,
        installments: parcelas,
        card_last_four: number.replace(/\D/g, '').slice(-4),
        cardholder_name: name.trim(),
      });
    } catch (e: unknown) {
      const errObj = e as { cause?: Array<{ description?: string }>; message?: string };
      const msg = errObj?.cause?.[0]?.description || errObj?.message || 'Erro ao processar cartão';
      setErro(msg);
    } finally {
      setProcessando(false);
    }
  }

  if (erroCarregar) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-sm text-sm">
        {erroCarregar}
      </div>
    );
  }

  const parcelaValor = total / parcelas;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[11px] text-charcoal-muted bg-cream/50 px-3 py-2 rounded-sm border border-cream-darker">
        <Lock size={12} className="text-green-600" />
        <span>Pagamento 100% seguro · Dados criptografados via MercadoPago</span>
      </div>

      <div>
        <label className="text-[11px] text-charcoal-muted uppercase tracking-wider block mb-1.5 font-semibold">Número do cartão</label>
        <div className="relative">
          <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-muted" />
          <input
            value={number}
            onChange={e => setNumber(formatCardNumber(e.target.value))}
            placeholder="0000 0000 0000 0000"
            inputMode="numeric"
            autoComplete="cc-number"
            className="input-field text-sm w-full pl-10"
          />
        </div>
      </div>

      <div>
        <label className="text-[11px] text-charcoal-muted uppercase tracking-wider block mb-1.5 font-semibold">Nome do titular (como no cartão)</label>
        <input
          value={name}
          onChange={e => setName(e.target.value.toUpperCase())}
          placeholder="MARIA DA SILVA"
          autoComplete="cc-name"
          className="input-field text-sm w-full"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[11px] text-charcoal-muted uppercase tracking-wider block mb-1.5 font-semibold">Validade</label>
          <input
            value={exp}
            onChange={e => setExp(formatExp(e.target.value))}
            placeholder="MM/AA"
            inputMode="numeric"
            autoComplete="cc-exp"
            className="input-field text-sm w-full"
          />
        </div>
        <div>
          <label className="text-[11px] text-charcoal-muted uppercase tracking-wider block mb-1.5 font-semibold">CVV</label>
          <input
            value={cvv}
            onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="123"
            inputMode="numeric"
            autoComplete="cc-csc"
            className="input-field text-sm w-full"
          />
        </div>
        <div>
          <label className="text-[11px] text-charcoal-muted uppercase tracking-wider block mb-1.5 font-semibold">CPF do titular</label>
          <input
            value={cpf}
            onChange={e => setCpf(formatCpf(e.target.value))}
            placeholder="000.000.000-00"
            inputMode="numeric"
            className="input-field text-sm w-full"
          />
        </div>
      </div>

      <div>
        <label className="text-[11px] text-charcoal-muted uppercase tracking-wider block mb-1.5 font-semibold">Parcelamento</label>
        <select
          value={parcelas}
          onChange={e => setParcelas(Number(e.target.value))}
          className="input-field text-sm w-full"
        >
          {Array.from({ length: parcelasMax }, (_, i) => i + 1).map(n => (
            <option key={n} value={n}>
              {n}x de R$ {(total / n).toFixed(2).replace('.', ',')} sem juros
            </option>
          ))}
        </select>
      </div>

      {erro && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-sm text-xs">{erro}</div>}

      <button
        onClick={handleSubmit}
        disabled={!mpReady || processando || loading}
        className="w-full bg-charcoal text-white py-4 font-bold text-sm tracking-wider uppercase hover:bg-charcoal-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {processando || loading ? (
          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processando...</>
        ) : (
          <><Lock size={14} /> Pagar R$ {total.toFixed(2).replace('.', ',')}</>
        )}
      </button>

      <p className="text-[10px] text-charcoal-muted text-center">
        Ao clicar em pagar, você concorda com nossos Termos de Compra
      </p>
    </div>
  );
}
