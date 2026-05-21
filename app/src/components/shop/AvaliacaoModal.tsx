'use client';

import { useState } from 'react';
import { Star, X, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';

interface Props {
  pedidoId: string;
  produtos: { id: string; nome: string; imagem?: string }[];
  onFechar: () => void;
}

interface AvalItem {
  produto_id: string;
  nota: number;
  titulo: string;
  texto: string;
}

export default function AvaliacaoModal({ pedidoId, produtos, onFechar }: Props) {
  const router = useRouter();
  const [avaliacoes, setAvaliacoes] = useState<AvalItem[]>(
    produtos.map((p) => ({ produto_id: p.id, nota: 5, titulo: '', texto: '' }))
  );
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [step, setStep] = useState(0);

  function setNota(idx: number, nota: number) {
    setAvaliacoes((prev) => prev.map((a, i) => i === idx ? { ...a, nota } : a));
  }
  function setTexto(idx: number, field: 'titulo' | 'texto', val: string) {
    setAvaliacoes((prev) => prev.map((a, i) => i === idx ? { ...a, [field]: val } : a));
  }

  async function enviar() {
    setEnviando(true);
    try {
      for (const av of avaliacoes) {
        await fetch('/api/avaliacoes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...av, pedido_id: pedidoId }),
        });
      }
      setConcluido(true);
      setTimeout(() => { router.push('/'); }, 3000);
    } catch { toast.error('Erro ao enviar avaliação'); }
    finally { setEnviando(false); }
  }

  const produto = produtos[step];
  const av = avaliacoes[step];

  if (concluido) {
    return (
      <div className="fixed inset-0 z-50 bg-charcoal/80 flex items-center justify-center p-4">
        <div className="bg-white rounded-sm p-10 text-center max-w-md w-full animate-zoom-in">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h2 className="font-serif text-2xl text-charcoal mb-3">Obrigada pelo seu feedback!</h2>
          <p className="text-charcoal-muted text-sm mb-2">
            Sua avaliação é muito importante para nós e ajuda outras clientes a encontrar as melhores peças.
          </p>
          <p className="text-charcoal-muted text-xs">Redirecionando para a loja em instantes...</p>
          <div className="mt-6">
            <Button onClick={() => router.push('/')} className="w-full">Voltar à Loja</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-charcoal/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-sm w-full max-w-lg animate-zoom-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-darker">
          <div>
            <h2 className="font-serif text-lg text-charcoal">Avalie sua compra</h2>
            <p className="text-xs text-charcoal-muted">{step + 1} de {produtos.length} produtos</p>
          </div>
          <button onClick={onFechar} className="text-charcoal-muted hover:text-charcoal"><X size={18} /></button>
        </div>

        {/* Produto atual */}
        <div className="px-6 py-6 space-y-5">
          <div className="flex items-center gap-3">
            {produto?.imagem && <img src={produto.imagem} alt={produto.nome} className="w-14 h-18 object-cover border" />}
            <h3 className="font-sans font-semibold text-charcoal">{produto?.nome}</h3>
          </div>

          {/* Estrelas */}
          <div>
            <p className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-2">Sua nota</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setNota(step, n)}>
                  <Star size={28} className={n <= av.nota ? 'fill-gold text-gold' : 'text-gray-200'} />
                </button>
              ))}
              <span className="ml-2 text-sm text-charcoal-muted self-center">
                {av.nota === 5 ? 'Excelente!' : av.nota === 4 ? 'Muito bom' : av.nota === 3 ? 'Regular' : av.nota === 2 ? 'Ruim' : 'Muito ruim'}
              </span>
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider block mb-1.5">Título (opcional)</label>
            <input value={av.titulo} onChange={(e) => setTexto(step, 'titulo', e.target.value)}
              placeholder="Resumo da sua experiência" className="input-field text-sm" />
          </div>

          {/* Texto */}
          <div>
            <label className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider block mb-1.5">Depoimento (opcional)</label>
            <textarea rows={3} value={av.texto} onChange={(e) => setTexto(step, 'texto', e.target.value)}
              placeholder="Conte como foi sua experiência com este produto..."
              className="input-field resize-none text-sm" />
          </div>
        </div>

        {/* Botões */}
        <div className="px-6 pb-6 flex gap-3">
          {step < produtos.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} className="flex-1">
              Próximo produto →
            </Button>
          ) : (
            <Button onClick={enviar} loading={enviando} className="flex-1">
              Enviar Avaliação
            </Button>
          )}
          <Button variant="outline" onClick={onFechar}>Pular</Button>
        </div>
      </div>
    </div>
  );
}
