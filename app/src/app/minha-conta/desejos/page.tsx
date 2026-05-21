import { createClient } from '@/lib/supabase/server';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Lista de Desejos' };
export const dynamic = 'force-dynamic';

export default async function DesejosPAge() {
  let desejos: { id: string; produtos: { id: string; nome: string; slug: string; preco: number; produto_imagens: { url: string }[] } | null }[] = [];

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('lista_desejos')
        .select('id, produtos(id, nome, slug, preco, produto_imagens(url))')
        .eq('cliente_id', user.id);
      desejos = (data ?? []) as typeof desejos;
    }
  } catch { /* sem dados */ }

  return (
    <div>
      <h1 className="font-serif text-2xl text-charcoal mb-6">Lista de Desejos</h1>

      {desejos.length === 0 ? (
        <div className="bg-white rounded-sm shadow-sm py-20 text-center">
          <Heart size={48} className="text-cream-darker mx-auto mb-4" />
          <p className="font-serif text-xl text-charcoal mb-2">Sua lista está vazia</p>
          <p className="text-charcoal-muted text-sm mb-6">Favorite produtos para encontrá-los facilmente depois</p>
          <Link href="/produtos" className="btn-gold inline-flex">Ver Coleção</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {desejos.map((d) => {
            const p = d.produtos;
            if (!p) return null;
            const img = p.produto_imagens?.[0]?.url;
            return (
              <Link key={d.id} href={`/produtos/${p.slug}`} className="bg-white rounded-sm shadow-sm overflow-hidden card-hover block">
                <div className="aspect-[3/4] bg-cream-dark overflow-hidden">
                  {img ? (
                    <img src={img} alt={p.nome} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-display text-charcoal/20 text-center px-4">Sem foto</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-sans font-semibold text-sm text-charcoal truncate">{p.nome}</p>
                  <p className="text-gold font-semibold text-sm mt-1">{formatPrice(p.preco)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
