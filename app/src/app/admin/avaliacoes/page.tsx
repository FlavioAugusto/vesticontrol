import { formatDate } from '@/lib/utils';
import { Star } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Avaliações' };
export const dynamic = 'force-dynamic';

interface Avaliacao {
  id: string; nota: number | null; titulo: string | null; texto: string | null;
  aprovado: boolean; created_at: string;
  clientes: { nome: string } | null;
  produtos: { nome: string } | null;
}

async function getLojaIdDoAdmin(): Promise<string> {
  try {
    const { createClient: createServer } = await import('@/lib/supabase/server');
    const { createClient } = await import('@/lib/supabase/admin');
    const s = createServer();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return '00000000-0000-0000-0000-000000000001';
    const a = createClient();
    const { data } = await a.from('admins').select('loja_id').eq('id', user.id).maybeSingle();
    return data?.loja_id || '00000000-0000-0000-0000-000000000001';
  } catch { return '00000000-0000-0000-0000-000000000001'; }
}

export default async function AdminAvaliacoesPage() {
  let avaliacoes: Avaliacao[] = [];
  const lojaId = await getLojaIdDoAdmin();

  try {
    const { createClient } = await import('@/lib/supabase/admin');
    const supabase = createClient();
    const { data } = await supabase
      .from('avaliacoes')
      .select('*, clientes(nome), produtos(nome)')
      .eq('loja_id', lojaId)
      .order('created_at', { ascending: false }).limit(50);
    avaliacoes = (data ?? []) as Avaliacao[];
  } catch { /* sem dados */ }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-charcoal">Avaliações</h1>
        <p className="text-charcoal-muted text-sm">{avaliacoes.length} avaliações</p>
      </div>

      {avaliacoes.length === 0 ? (
        <div className="bg-white rounded-sm shadow-sm py-16 text-center">
          <Star size={36} className="text-cream-darker mx-auto mb-3" />
          <p className="font-serif text-xl text-charcoal mb-1">Nenhuma avaliação ainda</p>
          <p className="text-charcoal-muted text-sm">As avaliações dos clientes aparecerão aqui após as primeiras compras.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {avaliacoes.map((a) => (
            <div key={a.id} className={`bg-white rounded-sm shadow-sm p-5 border-l-4 ${a.aprovado ? 'border-green-400' : 'border-yellow-400'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={12} className={i < (a.nota ?? 0) ? 'fill-gold text-gold' : 'text-gray-200'} />
                      ))}
                    </div>
                    {a.titulo && <span className="font-semibold text-sm text-charcoal">{a.titulo}</span>}
                  </div>
                  {a.texto && <p className="text-sm text-charcoal-muted">{a.texto}</p>}
                  <p className="text-xs text-charcoal-muted mt-2">
                    <strong>{a.clientes?.nome ?? 'Cliente'}</strong> sobre <strong>{a.produtos?.nome ?? 'Produto'}</strong> · {formatDate(a.created_at)}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-sm ${a.aprovado ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {a.aprovado ? 'Aprovada' : 'Pendente'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
