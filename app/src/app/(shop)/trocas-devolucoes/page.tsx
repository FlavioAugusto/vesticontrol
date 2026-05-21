'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { CheckCircle, Package, RotateCcw, AlertCircle, ChevronDown } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const schema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  numeroPedido: z.string().min(1),
  motivo: z.enum(['tamanho', 'defeito', 'nao_gostei', 'produto_errado', 'outro']),
  descricao: z.string().min(10, 'Descreva o problema com pelo menos 10 caracteres'),
  tipo: z.enum(['troca', 'devolucao']),
});
type FormData = z.infer<typeof schema>;

const PASSOS = [
  { num: 1, titulo: 'Entre em contato', desc: 'Preencha o formulário abaixo informando o motivo da troca ou devolução.' },
  { num: 2, titulo: 'Aguarde nosso retorno', desc: 'Nossa equipe analisará seu pedido em até 2 dias úteis e enviará as instruções por e-mail.' },
  { num: 3, titulo: 'Envie o produto', desc: 'Após aprovação, embale a peça em sua embalagem original e envie no endereço indicado.' },
  { num: 4, titulo: 'Receba sua troca ou reembolso', desc: 'Após recebermos o produto, processamos a troca ou o reembolso em até 7 dias úteis.' },
];

export default function TrocasDevolucoesPage() {
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [faqAberto, setFaqAberto] = useState<number | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { motivo: 'tamanho', tipo: 'troca' },
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1000)); // Simula envio
      setEnviado(true);
      toast.success('Solicitação enviada! Você receberá um e-mail em breve.');
    } finally { setLoading(false); }
  }

  const faqs = [
    { q: 'Qual é o prazo para solicitar troca ou devolução?', a: 'Você tem até 30 dias corridos a partir da data de recebimento do produto.' },
    { q: 'O produto precisa estar na embalagem original?', a: 'Sim, o produto deve estar sem uso, com etiqueta e na embalagem original ou equivalente.' },
    { q: 'Quem paga o frete de retorno?', a: 'Em caso de defeito de fabricação, o frete é por nossa conta. Para trocas por preferência, o frete de retorno é por conta do cliente.' },
    { q: 'Em quanto tempo recebo o reembolso?', a: 'Após recebermos e aprovarmos o produto, o reembolso é processado em até 7 dias úteis.' },
    { q: 'Posso trocar por outro tamanho?', a: 'Sim! Sujeito à disponibilidade no estoque. Caso não tenhamos, oferecemos crédito na loja ou reembolso.' },
  ];

  if (enviado) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h1 className="font-serif text-2xl text-charcoal mb-3">Solicitação Enviada!</h1>
        <p className="text-charcoal-muted text-sm mb-6">Nossa equipe analisará seu pedido e responderá por e-mail em até 2 dias úteis.</p>
        <Button onClick={() => window.location.href = '/'}>Voltar à Loja</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        {/* nome dinâmico */}
        <h1 className="font-serif text-3xl md:text-4xl text-charcoal mb-3">Trocas e Devoluções</h1>
        <p className="text-charcoal-muted max-w-lg mx-auto text-sm">
          Sua satisfação é nossa prioridade. Veja como funciona nosso processo simples e sem complicações.
        </p>
      </div>

      {/* Prazo destaque */}
      <div className="bg-gold/10 border border-gold/30 rounded-sm p-4 flex items-center gap-3 mb-8">
        <RotateCcw size={20} className="text-gold shrink-0" />
        <p className="text-sm text-charcoal font-semibold">30 dias para troca ou devolução a partir do recebimento do produto.</p>
      </div>

      {/* Passo a passo */}
      <div className="grid md:grid-cols-4 gap-4 mb-10">
        {PASSOS.map((p) => (
          <div key={p.num} className="bg-white border border-cream-darker p-5 rounded-sm">
            <div className="w-8 h-8 bg-charcoal text-cream rounded-full flex items-center justify-center font-bold text-sm mb-3">
              {p.num}
            </div>
            <h3 className="font-sans font-semibold text-sm text-charcoal mb-1">{p.titulo}</h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>

      {/* Grid formulário + condições */}
      <div className="grid md:grid-cols-2 gap-8">

        {/* Formulário */}
        <div className="bg-white rounded-sm shadow-sm p-6">
          <h2 className="font-serif text-xl text-charcoal mb-5">Abrir Solicitação</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Seu Nome *" error={errors.nome?.message} {...register('nome')} />
            <Input label="E-mail *" type="email" error={errors.email?.message} {...register('email')} />
            <Input label="Número do Pedido *" placeholder="Ex: 1042" error={errors.numeroPedido?.message} {...register('numeroPedido')} />

            <div>
              <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">Tipo de Solicitação *</label>
              <select className="input-field" {...register('tipo')}>
                <option value="troca">Troca de produto/tamanho</option>
                <option value="devolucao">Devolução e reembolso</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">Motivo *</label>
              <select className="input-field" {...register('motivo')}>
                <option value="tamanho">Tamanho incorreto</option>
                <option value="defeito">Defeito de fabricação</option>
                <option value="produto_errado">Produto diferente do pedido</option>
                <option value="nao_gostei">Não gostei do produto</option>
                <option value="outro">Outro motivo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">Descreva o problema *</label>
              <textarea rows={4} className="input-field resize-none text-sm"
                placeholder="Descreva o problema com detalhes..."
                {...register('descricao')} />
              {errors.descricao && <p className="text-xs text-red-500 mt-1">{errors.descricao.message}</p>}
            </div>

            <Button type="submit" loading={loading} className="w-full">Enviar Solicitação</Button>
          </form>
        </div>

        {/* Condições + FAQ */}
        <div className="space-y-5">
          <div className="bg-white rounded-sm shadow-sm p-6">
            <h2 className="font-serif text-lg text-charcoal mb-4">Condições</h2>
            <div className="space-y-3 text-sm">
              {[
                ['✅', 'Produto sem uso e com etiqueta original'],
                ['✅', 'Embalagem original ou equivalente'],
                ['✅', 'Solicitação em até 30 dias do recebimento'],
                ['✅', 'Comprovante de compra (número do pedido)'],
                ['❌', 'Peças com sinais de uso, lavagem ou alteração'],
                ['❌', 'Produto sem etiqueta original'],
              ].map(([icon, text]) => (
                <div key={text} className="flex items-start gap-2">
                  <span className="text-base">{icon}</span>
                  <span className={icon === '❌' ? 'text-red-600' : 'text-charcoal-muted'}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-sm shadow-sm p-6">
            <h2 className="font-serif text-lg text-charcoal mb-4">Perguntas Frequentes</h2>
            <div className="space-y-2">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border border-cream-darker rounded-sm">
                  <button onClick={() => setFaqAberto(faqAberto === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-3 text-left text-sm font-semibold text-charcoal hover:text-gold transition-colors">
                    {faq.q}
                    <ChevronDown size={14} className={`shrink-0 ml-2 transition-transform ${faqAberto === idx ? 'rotate-180' : ''}`} />
                  </button>
                  {faqAberto === idx && (
                    <div className="px-3 pb-3 text-xs text-charcoal-muted leading-relaxed">{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contato direto */}
          <div className="bg-charcoal text-cream p-5 rounded-sm">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-gold" />
              <p className="font-semibold text-sm">Precisa de ajuda imediata?</p>
            </div>
            <p className="text-xs text-cream/70 mb-3">Nossa equipe está disponível para resolver rapidamente.</p>
            <a href="https://wa.me/5581994228240" target="_blank" rel="noopener"
              className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 text-xs font-semibold rounded-sm hover:bg-green-600 transition-colors">
              💬 Chamar no WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
