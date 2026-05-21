'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import { CreditCard, QrCode, FileText, Truck, ChevronRight, Copy, CheckCircle, ShoppingBag, Check } from 'lucide-react';
import PagamentoTimer from '@/components/checkout/PagamentoTimer';
import LoginCadastroModal from '@/components/auth/LoginCadastroModal';
import CartaoForm, { CartaoData } from '@/components/checkout/CartaoForm';
import AguardandoPagamento from '@/components/checkout/AguardandoPagamento';

interface Cliente { id: string; nome: string; sobrenome: string | null; cpf: string | null; telefone: string | null }
interface Endereco { id: string; nome: string; cep: string; rua: string; numero: string; complemento: string | null; bairro: string; cidade: string; estado: string; principal: boolean }
interface FreteOp { id: number; nome: string; empresa?: string; preco: number; preco_original?: number; prazo: string; prazo_min?: number; prazo_max?: number; gratis?: boolean }
interface PedidoPendente { pedidoId: string; total: number; metodo: 'cartao'|'pix'|'boleto'; pixQrCode?: string; pixCopiaCola?: string; boletoUrl?: string; boletoLinhaDigitavel?: string; redirecionarUrl?: string; numero?: number; statusCartao?: 'aprovado'|'recusado'|'analise'; mensagemCartao?: string; checkoutUrlInfinitePay?: string }

export default function CheckoutPage() {
  const router = useRouter();
  // Guarda contra hidratação SSR vs client do Zustand persist
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const cartStore = useCartStore();
  const items = mounted ? (cartStore.items ?? []) : [];
  const total = cartStore.total ?? (() => 0);
  const clearCart = cartStore.clearCart ?? (() => {});

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [email, setEmail] = useState('');
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState<Endereco | null>(null);
  const [logado, setLogado] = useState(false);
  const [mostrarLogin, setMostrarLogin] = useState(false);

  const [novoCep, setNovoCep] = useState('');
  const [novoEnd, setNovoEnd] = useState({ rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' });
  const [cepBuscando, setCepBuscando] = useState(false);
  const [mostrarFormEnd, setMostrarFormEnd] = useState(false);

  const [freteOpcoes, setFreteOpcoes] = useState<FreteOp[]>([]);
  const [freteSelecionado, setFreteSelecionado] = useState<FreteOp | null>(null);
  const [freteGratis, setFreteGratis] = useState(false);
  const [calculandoFrete, setCalculandoFrete] = useState(false);

  const [metodo, setMetodo] = useState<'cartao'|'pix'|'boleto'>('cartao');
  const [parcelas, setParcelas] = useState(1);
  const [gatewayInfo, setGatewayInfo] = useState<{ gateway: string; mp_disponivel: boolean; infinitepay_disponivel: boolean; pix_ativo?: boolean; boleto_ativo?: boolean; parcelas_max?: number } | null>(null);

  useEffect(() => {
    fetch('/api/checkout/gateway').then(r => r.json()).then((d) => {
      setGatewayInfo(d);
      // Se método atual estiver desativado, troca pra um disponível
      if (d.boleto_ativo === false && metodo === 'boleto') setMetodo('cartao');
      if (d.pix_ativo === false && metodo === 'pix') setMetodo('cartao');
    }).catch(() => {});
  }, []);
  const [cupom, setCupom] = useState('');
  const [desconto, setDesconto] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pedidoPendente, setPedidoPendente] = useState<PedidoPendente | null>(null);
  const [pixCopiado, setPixCopiado] = useState(false);
  const [etapaAtiva, setEtapaAtiva] = useState<'conta'|'endereco'|'frete'|'pagamento'>('conta');

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const s = createClient();
      const { data: { user } } = await s.auth.getUser();
      if (!user) return;

      setLogado(true);
      setEmail(user.email ?? '');

      const [{ data: c }, { data: e }] = await Promise.all([
        s.from('clientes').select('*').eq('id', user.id).single(),
        s.from('enderecos').select('*').eq('cliente_id', user.id).order('principal', { ascending: false }),
      ]);

      if (c) setCliente(c as Cliente);
      if (e && e.length > 0) {
        setEnderecos(e as Endereco[]);
        const principal = (e as Endereco[]).find(x => x.principal) ?? (e as Endereco[])[0];
        setEnderecoSelecionado(principal);
        setEtapaAtiva('frete');
        calcularFrete(principal.cep);
      } else {
        setEtapaAtiva('endereco');
      }

    } catch { /* não logado */ }
  }

  async function calcularFrete(cep: string) {
    setCalculandoFrete(true);
    try {
      const subtotalAtual = items.reduce((s, i) => s + i.preco * i.quantidade, 0);
      const res = await fetch('/api/frete/calcular', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cep: cep.replace(/\D/g,''),
          subtotal: subtotalAtual,
          produtos: items.map(i => ({ id: i.produto_id, quantidade: i.quantidade, preco_unitario: i.preco })),
        }),
      });
      const d = await res.json();
      if (Array.isArray(d) && d.length > 0) {
        setFreteOpcoes(d);
        // Detecta frete grátis pelas opções (todas vêm com gratis: true se elegível)
        const algumGratis = d.some((o: { gratis?: boolean }) => o.gratis);
        setFreteGratis(algumGratis);
      } else if (d?.error) {
        // Mostra erro pro usuario saber o que esta acontecendo
        console.error('[frete] Erro:', d);
        toast.error(`${d.error}${d.hint ? '\n' + d.hint : ''}`, { duration: 8000 });
      } else {
        // API retornou array vazio (sem opcoes de frete para esse CEP)
        toast.error('Nao encontramos opcoes de frete para esse CEP. Verifique se esta correto.', { duration: 6000 });
      }
    } finally { setCalculandoFrete(false); }
  }

  async function buscarCEP() {
    const digits = novoCep.replace(/\D/g, '');
    if (digits.length !== 8) { toast.error('CEP inválido'); return; }
    setCepBuscando(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const d = await res.json();
      if (!d.erro) setNovoEnd({ rua: d.logradouro, bairro: d.bairro, cidade: d.localidade, estado: d.uf, numero: '', complemento: '' });
      else toast.error('CEP não encontrado');
    } finally { setCepBuscando(false); }
  }

  async function confirmarEndereco() {
    if (!novoEnd.rua || !novoEnd.numero || !novoCep) { toast.error('Preencha rua e número'); return; }
    const e: Endereco = { id: 'temp', nome: 'Entrega', cep: novoCep, ...novoEnd, principal: false };
    setEnderecoSelecionado(e);
    setMostrarFormEnd(false);
    setEtapaAtiva('frete');
    await calcularFrete(novoCep);
  }

  async function aplicarCupom() {
    if (!cupom.trim()) return;
    try {
      const res = await fetch('/api/cupons/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: cupom, total: total() }),
      });
      const d = await res.json();
      if (d.valido) {
        if (desconto > 0) {
          // Tinha cupom anterior — substitui
          toast.success(`Cupom substituído! Apenas 1 cupom por pedido. -${formatPrice(d.desconto)}`, { duration: 4000 });
        } else {
          toast.success(d.mensagem ?? `Cupom aplicado! -${formatPrice(d.desconto)}`);
        }
        setDesconto(d.desconto);
        // Aviso quando cupom zera o pedido
        if (d.desconto >= total()) {
          toast('💚 Cupom de 100%! Pedido grátis — basta confirmar.', { duration: 6000 });
        }
      } else {
        toast.error(d.mensagem ?? 'Cupom inválido');
      }
    } catch { toast.error('Erro ao validar cupom'); }
  }

  function removerCupom() { setDesconto(0); setCupom(''); toast.success('Cupom removido'); }

  async function criarPedido(): Promise<{ pedidoId: string; numero: number; total: number } | null> {
    if (!logado) { setMostrarLogin(true); return null; }
    if (!enderecoSelecionado) { toast.error('Selecione um endereço'); return null; }
    if (!freteSelecionado && !freteGratis) { toast.error('Selecione uma forma de entrega'); return null; }

    const frete = freteGratis ? 0 : (freteSelecionado?.preco ?? 0);
    const totalFinal = metodo === 'pix' ? (total() + frete - desconto) * 0.90 : (total() + frete - desconto);

    const pedidoRes = await fetch('/api/pedidos/criar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, subtotal: total(), frete, desconto, total: totalFinal, metodo_pagamento: metodo,
        cliente: { nome: cliente?.nome, sobrenome: cliente?.sobrenome, email, cpf: cliente?.cpf, telefone: cliente?.telefone },
        endereco: enderecoSelecionado, cupom_codigo: desconto > 0 ? cupom : null, parcelas }),
    });
    const pedido = await pedidoRes.json();
    if (!pedido.pedidoId) { toast.error(pedido.error ?? 'Erro'); return null; }
    return { pedidoId: pedido.pedidoId, numero: pedido.numero, total: totalFinal };
  }

  async function confirmarPixOuBoleto() {
    setLoading(true);
    try {
      const pedido = await criarPedido();
      if (!pedido) return;

      // 🆓 Pedido grátis (total = 0): pula gateway e finaliza direto
      if (pedido.total <= 0) {
        toast.success('Pedido gratuito confirmado! 🎉', { duration: 4000 });
        setPedidoPendente({
          pedidoId: pedido.pedidoId,
          total: 0,
          metodo: metodo,
          numero: pedido.numero,
          statusCartao: 'aprovado',
          mensagemCartao: 'Pedido grátis (cupom 100%)',
        });
        clearCart();
        return;
      }

      const dadosPayer = { nome: cliente?.nome, email, cpf: cliente?.cpf, telefone: cliente?.telefone };

      if (metodo === 'pix') {
        const px = await (await fetch('/api/pagamento/pix', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pedidoId: pedido.pedidoId, total: pedido.total, email,
            payer: dadosPayer,
            items: items.map(i => ({ nome: i.nome, quantidade: i.quantidade, preco: i.preco })),
            endereco: enderecoSelecionado,
          }),
        })).json();
        // Se vier checkout_url (InfinitePay), abre em nova aba e mostra tela de espera
        if (px.checkout_url) {
          clearCart();
          window.open(px.checkout_url, '_blank', 'noopener,noreferrer');
          setPedidoPendente({ pedidoId: pedido.pedidoId, total: pedido.total, metodo: 'pix', numero: pedido.numero, checkoutUrlInfinitePay: px.checkout_url });
          return;
        }
        if (px.error) { toast.error(px.error); return; }
        setPedidoPendente({ pedidoId: pedido.pedidoId, total: pedido.total, metodo: 'pix', pixQrCode: px.qr_code_base64, pixCopiaCola: px.qr_code, numero: pedido.numero });
        clearCart();
      } else if (metodo === 'boleto') {
        const bl = await (await fetch('/api/pagamento/boleto', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pedidoId: pedido.pedidoId, total: pedido.total, cliente,
            payer: dadosPayer,
            items: items.map(i => ({ nome: i.nome, quantidade: i.quantidade, preco: i.preco })),
            endereco: enderecoSelecionado,
          }),
        })).json();
        if (bl.checkout_url) {
          clearCart();
          window.open(bl.checkout_url, '_blank', 'noopener,noreferrer');
          setPedidoPendente({ pedidoId: pedido.pedidoId, total: pedido.total, metodo: 'boleto', numero: pedido.numero, checkoutUrlInfinitePay: bl.checkout_url });
          return;
        }
        if (bl.error) { toast.error(bl.error); return; }
        setPedidoPendente({ pedidoId: pedido.pedidoId, total: pedido.total, metodo: 'boleto', boletoUrl: bl.boleto_url, boletoLinhaDigitavel: bl.linha_digitavel, numero: pedido.numero });
        clearCart();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao processar pedido');
    } finally { setLoading(false); }
  }

  async function confirmarCartaoInfinitePay() {
    setLoading(true);
    try {
      const pedido = await criarPedido();
      if (!pedido) return;

      // 🆓 Pedido grátis (total = 0): pula gateway e finaliza direto
      if (pedido.total <= 0) {
        toast.success('Pedido gratuito confirmado! 🎉', { duration: 4000 });
        setPedidoPendente({
          pedidoId: pedido.pedidoId,
          total: 0,
          metodo: 'cartao',
          numero: pedido.numero,
          statusCartao: 'aprovado',
          mensagemCartao: 'Pedido grátis (cupom 100%)',
        });
        clearCart();
        return;
      }

      const ct = await (await fetch('/api/pagamento/cartao', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedidoId: pedido.pedidoId,
          total: pedido.total,
          parcelas,
          payer: { nome: cliente?.nome, email, cpf: cliente?.cpf, telefone: cliente?.telefone },
          items: items.map(i => ({ nome: i.nome, quantidade: i.quantidade, preco: i.preco })),
          endereco: enderecoSelecionado,
        }),
      })).json();
      if (ct.checkout_url) {
        clearCart();
        window.open(ct.checkout_url, '_blank', 'noopener,noreferrer');
        setPedidoPendente({ pedidoId: pedido.pedidoId, total: pedido.total, metodo: 'cartao', numero: pedido.numero, checkoutUrlInfinitePay: ct.checkout_url });
      } else {
        toast.error(ct.error || 'Erro ao criar checkout');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao processar cartão');
    } finally { setLoading(false); }
  }

  async function processarCartao(dados: CartaoData) {
    setLoading(true);
    try {
      const pedido = await criarPedido();
      if (!pedido) return;

      const ct = await (await fetch('/api/pagamento/cartao', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedidoId: pedido.pedidoId,
          total: pedido.total,
          parcelas: dados.installments,
          token: dados.token,
          payment_method_id: dados.payment_method_id,
          payer: { nome: cliente?.nome ?? dados.cardholder_name, email, cpf: cliente?.cpf ?? '', telefone: cliente?.telefone ?? '' },
        }),
      })).json();

      if (ct.error) { toast.error(ct.error); return; }

      const statusCartao = ct.status === 'approved' ? 'aprovado' : ct.status === 'rejected' ? 'recusado' : 'analise';
      setPedidoPendente({
        pedidoId: pedido.pedidoId,
        total: pedido.total,
        metodo: 'cartao',
        numero: pedido.numero,
        statusCartao,
        mensagemCartao: ct.message,
      });
      if (statusCartao === 'aprovado' || statusCartao === 'analise') clearCart();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao processar cartão');
    } finally { setLoading(false); }
  }

  const subtotal = total();
  const frete = freteGratis ? 0 : (freteSelecionado?.preco ?? 0);
  const totalBase = subtotal + frete - desconto;
  const totalFinal = metodo === 'pix' ? totalBase * 0.90 : totalBase;

  // Tela de pedido pendente
  if (pedidoPendente) {
    // Se foi redirecionado para InfinitePay → tela de espera com polling
    if (pedidoPendente.checkoutUrlInfinitePay) {
      return (
        <AguardandoPagamento
          pedidoId={pedidoPendente.pedidoId}
          numero={pedidoPendente.numero}
          total={pedidoPendente.total}
          metodo={pedidoPendente.metodo}
          checkoutUrl={pedidoPendente.checkoutUrlInfinitePay}
          onCancelar={() => { router.push('/'); }}
        />
      );
    }
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-3"><ShoppingBag size={28} className="text-gold" /></div>
          <h1 className="font-serif text-2xl text-charcoal">Pedido #{pedidoPendente.numero}</h1>
          <p className="text-charcoal-muted text-sm">Total: <strong>{formatPrice(pedidoPendente.total)}</strong></p>
        </div>
        <div className="mb-5">
          <PagamentoTimer pedidoId={pedidoPendente.pedidoId} tipo={pedidoPendente.metodo} onExpirar={() => { toast.error('Pedido cancelado.'); router.push('/'); }} />
        </div>
        {pedidoPendente.metodo === 'pix' && (
          <div className="bg-white border border-gray-200 rounded-sm p-6 text-center space-y-4">
            <p className="text-xs font-semibold text-charcoal uppercase tracking-wider">Escaneie o QR Code</p>
            {pedidoPendente.pixQrCode ? <img src={`data:image/png;base64,${pedidoPendente.pixQrCode}`} alt="QR Code PIX" className="w-48 h-48 mx-auto border" /> : <div className="w-48 h-48 mx-auto bg-cream-dark flex items-center justify-center"><QrCode size={64} className="text-charcoal-muted" /></div>}
            {pedidoPendente.pixCopiaCola && <div className="flex gap-2"><input readOnly value={pedidoPendente.pixCopiaCola} className="flex-1 border border-gray-200 px-3 py-2 text-xs font-mono" /><button onClick={() => { navigator.clipboard.writeText(pedidoPendente.pixCopiaCola!); setPixCopiado(true); setTimeout(() => setPixCopiado(false), 2000); }} className="border border-charcoal px-3 text-xs hover:bg-charcoal hover:text-white transition-colors flex items-center gap-1">{pixCopiado ? <CheckCircle size={12} /> : <Copy size={12} />}{pixCopiado ? 'Copiado!' : 'Copiar'}</button></div>}
          </div>
        )}
        {pedidoPendente.metodo === 'boleto' && (
          <div className="bg-white border border-gray-200 rounded-sm p-6 space-y-3">
            {pedidoPendente.boletoLinhaDigitavel && <div className="flex gap-2"><input readOnly value={pedidoPendente.boletoLinhaDigitavel} className="flex-1 border border-gray-200 px-3 py-2 text-xs font-mono" /><button onClick={() => navigator.clipboard.writeText(pedidoPendente.boletoLinhaDigitavel!)} className="border border-charcoal px-2 hover:bg-charcoal hover:text-white"><Copy size={12} /></button></div>}
            {pedidoPendente.boletoUrl && <a href={pedidoPendente.boletoUrl} target="_blank" rel="noopener" className="btn-gold w-full justify-center inline-flex">Visualizar Boleto</a>}
          </div>
        )}
        {pedidoPendente.metodo === 'cartao' && (
          <div className={`bg-white border rounded-sm p-6 text-center ${pedidoPendente.statusCartao === 'aprovado' ? 'border-green-300' : pedidoPendente.statusCartao === 'recusado' ? 'border-red-300' : 'border-yellow-300'}`}>
            {pedidoPendente.statusCartao === 'aprovado' ? (
              <><CheckCircle size={48} className="text-green-500 mx-auto mb-3" /><p className="font-semibold text-charcoal text-lg">Pagamento aprovado! 🎉</p><p className="text-sm text-charcoal-muted mt-2">Você receberá um e-mail com os detalhes do pedido.</p></>
            ) : pedidoPendente.statusCartao === 'recusado' ? (
              <><div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3"><CreditCard size={24} className="text-red-500" /></div><p className="font-semibold text-charcoal text-lg">Pagamento recusado</p><p className="text-sm text-red-600 mt-2">{pedidoPendente.mensagemCartao}</p><button onClick={() => setPedidoPendente(null)} className="mt-4 text-xs text-gold hover:underline">← Tentar com outro cartão</button></>
            ) : (
              <><CreditCard size={36} className="text-yellow-500 mx-auto mb-2" /><p className="font-semibold text-charcoal">Pagamento em análise</p><p className="text-sm text-charcoal-muted mt-1">Você será notificado quando for aprovado.</p></>
            )}
          </div>
        )}
        <button onClick={() => router.push('/')} className="w-full text-center text-xs text-charcoal-muted hover:text-charcoal mt-4 py-2">Voltar para a loja →</button>
      </div>
    );
  }

  // Aguarda hidratação do Zustand pra não mostrar "Carrinho vazio" indevidamente
  if (!mounted) return <div className="max-w-7xl mx-auto px-4 py-20 text-center"><div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" /></div>;

  if (items.length === 0) return <div className="max-w-7xl mx-auto px-4 py-20 text-center"><p className="font-serif text-2xl mb-4">Carrinho vazio</p><button onClick={() => router.push('/produtos')} className="btn-gold">Ver Produtos</button></div>;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
      <h1 className="font-serif text-xl sm:text-2xl text-charcoal mb-4 sm:mb-5">Finalizar Compra</h1>
      {freteGratis && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 flex items-center gap-2 mb-5 text-sm rounded-sm"><Truck size={16} /> Parabéns! Você ganhou frete grátis 🎉</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-5">
        <div className="lg:col-span-2 space-y-3">

          {/* 1 — CONTA */}
          <div className={`bg-white border rounded-sm ${etapaAtiva === 'conta' && !logado ? 'border-charcoal' : 'border-cream-darker'}`}>
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="flex items-center gap-2 font-serif text-base text-charcoal">
                {logado ? <span className="w-5 h-5 bg-charcoal text-white rounded-full flex items-center justify-center"><Check size={10} /></span> : <span className="w-5 h-5 border border-charcoal rounded-full flex items-center justify-center text-xs font-bold text-charcoal">1</span>}
                Conta
              </h2>
              {logado && <button onClick={async () => { const { createClient } = await import('@/lib/supabase/client'); await createClient().auth.signOut(); setLogado(false); setCliente(null); setEnderecoSelecionado(null); setEtapaAtiva('conta'); }} className="text-xs text-charcoal-muted hover:text-red-500 transition-colors">Não é você? Sair</button>}
            </div>
            {logado && cliente ? (
              <div className="px-5 pb-4 border-t border-green-100 bg-green-50/40">
                <p className="text-sm font-semibold text-charcoal mt-3">{email}</p>
                <p className="text-xs text-charcoal-muted mt-0.5">{cliente.cpf && `${cliente.cpf}`}{cliente.telefone && ` · ${cliente.telefone}`}</p>
              </div>
            ) : (
              <div className="px-5 pb-5 border-t border-cream-darker">
                <p className="text-sm text-charcoal-muted mt-3 mb-3">Faça login para continuar com seus dados salvos</p>
                <button onClick={() => setMostrarLogin(true)} className="bg-charcoal text-white text-xs font-bold px-6 py-3 hover:bg-charcoal-light transition-colors uppercase tracking-wider">
                  Fazer Login / Cadastrar
                </button>
              </div>
            )}
          </div>

          {/* 2 — ENDEREÇO */}
          <div className={`bg-white border rounded-sm ${!logado ? 'opacity-40' : etapaAtiva === 'endereco' ? 'border-charcoal' : 'border-cream-darker'}`}>
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="flex items-center gap-2 font-serif text-base text-charcoal">
                {enderecoSelecionado ? <span className="w-5 h-5 bg-charcoal text-white rounded-full flex items-center justify-center"><Check size={10} /></span> : <span className="w-5 h-5 border border-charcoal rounded-full flex items-center justify-center text-xs font-bold text-charcoal">2</span>}
                Endereço de entrega
              </h2>
              {enderecoSelecionado && logado && <button onClick={() => { setEtapaAtiva('endereco'); setMostrarFormEnd(false); }} className="text-xs text-gold hover:underline">Alterar</button>}
            </div>

            {logado && (
              <div className="px-5 pb-5 border-t border-cream-darker">
                {enderecoSelecionado && !mostrarFormEnd ? (
                  <div className="mt-3">
                    <p className="text-sm text-charcoal">{enderecoSelecionado.rua}, {enderecoSelecionado.numero}{enderecoSelecionado.complemento ? `, ${enderecoSelecionado.complemento}` : ''}</p>
                    <p className="text-xs text-charcoal-muted">{enderecoSelecionado.bairro} — {enderecoSelecionado.cidade}/{enderecoSelecionado.estado} · CEP {enderecoSelecionado.cep}</p>
                    {enderecos.length > 1 && (
                      <div className="mt-3 space-y-1.5">
                        {enderecos.filter(e => e.id !== enderecoSelecionado.id).map(e => (
                          <label key={e.id} className="flex items-center gap-2 text-xs text-charcoal-muted cursor-pointer hover:text-charcoal">
                            <input type="radio" name="end" onChange={() => { setEnderecoSelecionado(e); calcularFrete(e.cep); setEtapaAtiva('frete'); }} className="accent-gold" />
                            {e.rua}, {e.numero} — {e.cidade}/{e.estado}
                          </label>
                        ))}
                      </div>
                    )}
                    <button onClick={() => setMostrarFormEnd(true)} className="text-xs text-gold hover:underline mt-2 block">+ Usar outro endereço</button>
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    <div className="flex gap-2">
                      <input value={novoCep} onChange={e => setNovoCep(e.target.value.replace(/\D/g,'').slice(0,8))} placeholder="CEP" className="input-field text-sm flex-1" />
                      <button onClick={buscarCEP} disabled={cepBuscando} className="border border-charcoal text-xs font-semibold px-4 hover:bg-charcoal hover:text-white transition-colors disabled:opacity-50">
                        {cepBuscando ? '...' : 'BUSCAR'}
                      </button>
                    </div>
                    {novoEnd.rua && (
                      <>
                        <input value={novoEnd.rua} onChange={e => setNovoEnd(p => ({...p, rua: e.target.value}))} placeholder="Rua *" className="input-field text-sm" />
                        <div className="grid grid-cols-2 gap-2">
                          <input value={novoEnd.numero} onChange={e => setNovoEnd(p => ({...p, numero: e.target.value}))} placeholder="Número *" className="input-field text-sm" />
                          <input value={novoEnd.complemento} onChange={e => setNovoEnd(p => ({...p, complemento: e.target.value}))} placeholder="Complemento" className="input-field text-sm" />
                        </div>
                        <button onClick={confirmarEndereco} className="w-full bg-charcoal text-white py-3 text-xs font-bold uppercase tracking-wider hover:bg-charcoal-light flex items-center justify-center gap-2">
                          CONTINUAR <ChevronRight size={14} />
                        </button>
                      </>
                    )}
                    {enderecoSelecionado && <button onClick={() => setMostrarFormEnd(false)} className="text-xs text-charcoal-muted hover:text-charcoal">← Cancelar</button>}
                  </div>
                )}
                {!enderecoSelecionado && !novoEnd.rua && <p className="mt-2 text-xs text-charcoal-muted">Digite o CEP para calcular o frete</p>}
              </div>
            )}
            {!logado && <p className="px-5 pb-3 text-xs text-charcoal-muted border-t border-cream-darker pt-3">Faça login primeiro</p>}
          </div>

          {/* 3 — FRETE */}
          <div className={`bg-white border rounded-sm ${!enderecoSelecionado ? 'opacity-40' : etapaAtiva === 'frete' ? 'border-charcoal' : 'border-cream-darker'}`}>
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="flex items-center gap-2 font-serif text-base text-charcoal">
                {(freteSelecionado || freteGratis) ? <span className="w-5 h-5 bg-charcoal text-white rounded-full flex items-center justify-center"><Check size={10} /></span> : <span className="w-5 h-5 border border-charcoal rounded-full flex items-center justify-center text-xs font-bold text-charcoal">3</span>}
                Forma de entrega
              </h2>
              {(freteSelecionado || freteGratis) && <button onClick={() => setEtapaAtiva('frete')} className="text-xs text-gold hover:underline">Alterar</button>}
            </div>
            <div className="px-5 pb-4 border-t border-cream-darker">
              {freteGratis && (
                <div className="mt-3 mb-3 p-3 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 text-emerald-800 text-sm font-semibold rounded-lg flex items-center gap-2">
                  <span className="text-xl">🎉</span>
                  <span>Você ganhou frete grátis em todas as opções!</span>
                </div>
              )}
              {calculandoFrete ? (
                <div className="mt-3 py-6 text-center">
                  <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-charcoal-muted">Calculando opções de entrega...</p>
                </div>
              ) : freteOpcoes.length > 0 ? (
                <div className="mt-3 grid gap-2">
                  {freteOpcoes.map(o => {
                    const selecionado = freteSelecionado?.id === o.id;
                    const empresaLower = (o.empresa ?? '').toLowerCase();
                    const isCorreios = empresaLower.includes('correios');
                    const isJadlog = empresaLower.includes('jadlog');
                    const empresaCor = isCorreios ? 'bg-yellow-400 text-yellow-900' : isJadlog ? 'bg-red-500 text-white' : 'bg-blue-500 text-white';
                    const empresaIniciais = (o.empresa ?? 'TR').split(' ')[0].slice(0, 2).toUpperCase();
                    const precoExibido = freteGratis ? 0 : o.preco;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => { setFreteSelecionado({ ...o, preco: precoExibido }); setEtapaAtiva('pagamento'); }}
                        className={`flex items-center gap-3 p-3 border-2 rounded-lg transition-all text-left ${selecionado ? 'border-gold bg-gold/5 shadow-sm' : 'border-cream-darker hover:border-gold/50 hover:bg-cream/30'}`}>
                        {/* Logo da transportadora */}
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-[10px] tracking-wider shrink-0 ${empresaCor}`}>
                          {empresaIniciais}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-charcoal">{o.nome}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Truck size={11} className="text-charcoal-muted" />
                            <p className="text-[11px] text-charcoal-muted">{o.empresa} · {o.prazo}</p>
                          </div>
                        </div>
                        {/* Preço */}
                        <div className="text-right shrink-0">
                          {precoExibido === 0 ? (
                            <>
                              <p className="text-sm font-bold text-emerald-600">Grátis</p>
                              {!freteGratis && o.preco_original && o.preco_original > 0 && (
                                <p className="text-[10px] text-charcoal-muted line-through">{formatPrice(o.preco_original)}</p>
                              )}
                              {freteGratis && o.preco_original && o.preco_original > 0 && (
                                <p className="text-[10px] text-charcoal-muted line-through">{formatPrice(o.preco_original)}</p>
                              )}
                            </>
                          ) : (
                            <p className="text-sm font-bold text-gold">{formatPrice(precoExibido)}</p>
                          )}
                        </div>
                        {/* Indicador de seleção */}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selecionado ? 'border-gold bg-gold' : 'border-gray-300'}`}>
                          {selecionado && <Check size={12} className="text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-3 py-6 text-center bg-cream/30 rounded-lg border border-cream-darker">
                  <Truck size={20} className="text-charcoal-muted/40 mx-auto mb-1.5" />
                  <p className="text-xs text-charcoal-muted">Preencha o endereço para calcular o frete</p>
                </div>
              )}
            </div>
          </div>

          {/* 4 — PAGAMENTO */}
          <div className={`bg-white border rounded-sm ${(!freteSelecionado && !freteGratis) ? 'opacity-40' : etapaAtiva === 'pagamento' ? 'border-charcoal' : 'border-cream-darker'}`}>
            <div className="px-5 py-4">
              <h2 className="flex items-center gap-2 font-serif text-base text-charcoal">
                <span className="w-5 h-5 border border-charcoal rounded-full flex items-center justify-center text-xs font-bold text-charcoal">4</span>
                Pagamento
              </h2>
            </div>
            {(freteSelecionado || freteGratis) ? (
              <div className="px-5 pb-5 border-t border-cream-darker">
                <div className={`grid gap-2.5 mt-4 mb-4 ${
                  [true, gatewayInfo?.pix_ativo !== false, gatewayInfo?.boleto_ativo !== false].filter(Boolean).length === 1 ? 'grid-cols-1' :
                  [true, gatewayInfo?.pix_ativo !== false, gatewayInfo?.boleto_ativo !== false].filter(Boolean).length === 2 ? 'grid-cols-2' :
                  'grid-cols-3'
                }`}>
                  {[
                    {v:'cartao',icon:CreditCard,label:'Cartão',desc:`Até ${gatewayInfo?.parcelas_max ?? 6}x sem juros`,ativo:true,corBg:'bg-purple-100',corIcon:'text-purple-600',badge:null},
                    {v:'pix',icon:QrCode,label:'PIX',desc:'10% de desconto',ativo:gatewayInfo?.pix_ativo !== false,corBg:'bg-emerald-100',corIcon:'text-emerald-600',badge:'10% OFF'},
                    {v:'boleto',icon:FileText,label:'Boleto',desc:'2 dias úteis',ativo:gatewayInfo?.boleto_ativo !== false,corBg:'bg-blue-100',corIcon:'text-blue-600',badge:null},
                  ].filter(m => m.ativo).map(({v,icon:Icon,label,desc,corBg,corIcon,badge})=>{
                    const ativo = metodo === v;
                    return (
                      <label key={v} className={`relative flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all text-center ${ativo ? 'border-gold bg-gold/5 shadow-sm' : 'border-cream-darker hover:border-gold/40 hover:bg-cream/30'}`}>
                        <input type="radio" value={v} checked={ativo} onChange={()=>setMetodo(v as typeof metodo)} className="sr-only" />
                        {badge && (
                          <span className="absolute -top-2 right-2 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">{badge}</span>
                        )}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${corBg}`}>
                          <Icon size={18} className={corIcon} strokeWidth={2} />
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${ativo ? 'text-charcoal' : 'text-charcoal'}`}>{label}</p>
                          <p className="text-[10px] text-charcoal-muted mt-0.5">{desc}</p>
                        </div>
                        {ativo && (
                          <div className="absolute top-2 left-2 w-4 h-4 bg-gold rounded-full flex items-center justify-center">
                            <Check size={10} className="text-white" />
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>

                {metodo === 'pix' && (
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 p-3 text-sm text-emerald-800 mb-3 rounded-lg flex items-center gap-2">
                    <span className="text-lg">✅</span>
                    <span><strong>10% de desconto aplicado!</strong> Pagamento instantâneo via QR Code</span>
                  </div>
                )}
                {metodo === 'boleto' && (
                  <div className="bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 p-3 text-sm text-blue-800 mb-3 rounded-lg flex items-center gap-2">
                    <span className="text-lg">📄</span>
                    <span>Boleto com vencimento em <strong>2 dias úteis</strong>. Compensação em até 2 dias após o pagamento.</span>
                  </div>
                )}

                {metodo === 'cartao' && (
                  gatewayInfo === null ? (
                    <div className="text-center py-6">
                      <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" />
                    </div>
                  ) : gatewayInfo.mp_disponivel ? (
                    <CartaoForm
                      total={totalFinal}
                      parcelasMax={6}
                      onTokenize={processarCartao}
                      loading={loading}
                    />
                  ) : gatewayInfo.infinitepay_disponivel ? (
                    <div className="space-y-3">
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-sm">
                        <p className="text-sm text-blue-800 font-semibold mb-1">💳 Pagamento seguro via InfinitePay</p>
                        <p className="text-xs text-blue-700">Você será direcionado para a tela segura da InfinitePay para preencher os dados do cartão. Após o pagamento, retornará para a confirmação no nosso site.</p>
                      </div>
                      <div className="mb-3">
                        <label className="text-[11px] text-charcoal-muted uppercase tracking-wider block mb-1.5 font-semibold">Parcelamento</label>
                        <select value={parcelas} onChange={e => setParcelas(Number(e.target.value))} className="input-field text-sm">
                          {Array.from({length: 6}, (_, i) => i + 1).map(n => (
                            <option key={n} value={n}>{n}x de {formatPrice(totalFinal/n)} sem juros</option>
                          ))}
                        </select>
                      </div>
                      <button onClick={confirmarCartaoInfinitePay} disabled={loading}
                        className="w-full bg-charcoal text-white py-4 font-bold text-sm tracking-wider uppercase hover:bg-charcoal-light disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                        {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Preparando...</> : <><CreditCard size={14} /> Pagar com Cartão · {formatPrice(totalFinal)}</>}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-sm text-sm">
                      ❌ Nenhum gateway de cartão configurado. Use PIX ou Boleto.
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="px-5 pb-3 text-xs text-charcoal-muted border-t border-cream-darker pt-3">Aguardando seleção de frete</p>
            )}
          </div>

        </div>

        {/* RESUMO */}
        <aside>
          <div className="bg-white border border-cream-darker rounded-sm p-5 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg text-charcoal">Produtos ({items.length})</h2>
              <button onClick={() => router.push('/carrinho')} className="text-xs text-gold hover:underline">Editar produtos</button>
            </div>
            <div className="space-y-3 mb-4 pb-4 border-b border-cream-darker max-h-52 overflow-y-auto pr-1">
              {items.map(item => (
                <div key={item.variante_id} className="flex gap-3">
                  <div className="relative w-12 h-16 shrink-0 bg-cream-dark overflow-hidden">
                    {item.imagem?<Image src={item.imagem} alt={item.nome} fill className="object-cover" sizes="48px"/>:<div className="w-full h-full bg-cream-dark"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-charcoal line-clamp-2">{item.nome}</p>
                    {item.slug && <p className="text-[10px] text-charcoal-muted font-mono">Ref: {item.slug}</p>}
                    <p className="text-[10px] text-charcoal-muted">{item.cor&&`${item.cor} / `}{item.tamanho}</p>
                    <p className="text-xs text-charcoal-muted">{item.quantidade} unidade{item.quantidade>1?'s':''} por {formatPrice(item.preco)}</p>
                  </div>
                  <p className="text-xs font-semibold text-charcoal shrink-0">{formatPrice(item.preco*item.quantidade)}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm"><span className="text-charcoal-muted">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex gap-2">
                <input value={cupom} onChange={e=>setCupom(e.target.value.toUpperCase())} placeholder="Cupom de desconto" className="flex-1 border border-cream-darker px-3 py-2 text-xs focus:outline-none focus:border-gold" onKeyDown={e=>e.key==='Enter'&&aplicarCupom()} />
                <button onClick={aplicarCupom} className="border border-charcoal text-xs font-semibold px-3 hover:bg-charcoal hover:text-white transition-colors">OK</button>
              </div>
              {desconto>0&&(
                <div className="flex justify-between text-sm text-green-600 items-center">
                  <span className="flex items-center gap-1.5">
                    Cupom <span className="font-mono font-bold text-[10px] bg-green-100 px-1.5 py-0.5 rounded">{cupom.toUpperCase()}</span>
                    <button onClick={removerCupom} className="text-green-400 hover:text-red-500 text-[10px] underline ml-1">remover</button>
                  </span>
                  <span>-{formatPrice(desconto)}</span>
                </div>
              )}
              {metodo==='pix'&&<div className="flex justify-between text-sm text-green-600"><span>Desconto PIX (10%)</span><span>-{formatPrice(totalBase*0.10)}</span></div>}
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-muted">Frete</span>
                {freteGratis?<span className="text-green-600 font-semibold">Grátis 🎉</span>:frete>0?<span>{formatPrice(frete)}</span>:<span className="text-charcoal-muted text-xs">--</span>}
              </div>
            </div>
            <div className="flex justify-between font-semibold text-lg border-t border-cream-darker pt-3 mb-1">
              <span>Total</span><span className="text-gold">{formatPrice(totalFinal)}</span>
            </div>
            <p className="text-[11px] text-charcoal-muted mb-4 text-center">ou 6x de {formatPrice(totalFinal/6)} sem juros</p>
            {metodo !== 'cartao' && (
              <button onClick={confirmarPixOuBoleto} disabled={loading||!logado||!enderecoSelecionado||(!freteSelecionado&&!freteGratis)}
                className="w-full bg-gold hover:bg-gold-600 text-white py-4 font-bold text-sm tracking-wider uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed rounded-sm">
                {loading?'Processando...':metodo==='pix'?'GERAR PIX':'GERAR BOLETO'}
              </button>
            )}

            {/* Selos de segurança */}
            <div className="border-t border-cream-darker mt-4 pt-4">
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                  </div>
                  <div className="leading-tight">
                    <p className="text-[9px] font-bold text-charcoal">SITE 100%</p>
                    <p className="text-[9px] font-bold text-charcoal -mt-0.5">SEGURO</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="relative w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  </div>
                  <div className="leading-tight">
                    <p className="text-[9px] font-bold text-charcoal">GOOGLE</p>
                    <p className="text-[9px] font-bold text-charcoal -mt-0.5">SITE SEGURO</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center shadow-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/><path d="M9 12l2 2 4-4"/></svg>
                  </div>
                  <div className="leading-tight">
                    <p className="text-[9px] font-bold text-charcoal">LET&apos;S</p>
                    <p className="text-[9px] font-bold text-charcoal -mt-0.5">ENCRYPT SSL</p>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-charcoal-muted text-center mt-3">🔒 Conexão criptografada · Dados protegidos</p>
            </div>
          </div>
        </aside>
      </div>

      {mostrarLogin&&<LoginCadastroModal onClose={()=>setMostrarLogin(false)} onSucesso={()=>{setMostrarLogin(false);carregarDados();}} />}
    </div>
  );
}
