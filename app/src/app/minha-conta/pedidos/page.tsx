import { createClient } from '@/lib/supabase/server';
import { Package } from 'lucide-react';
import Link from 'next/link';
import PedidoCardCliente from '@/components/shop/PedidoCardCliente';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Meus Pedidos' };
export const dynamic = 'force-dynamic';

export default async function MeusPedidosPage() {
  let pedidos: {
    id: string; numero: number; status: string; total: number; frete: number;
    metodo_pagamento: string | null; created_at: string; codigo_rastreio: string | null
  }[] = [];

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('pedidos')
        .select('id, numero, status, total, frete, metodo_pagamento, created_at, codigo_rastreio')
        .eq('cliente_id', user.id)
        .order('created_at', { ascending: false });
      pedidos = (data ?? []) as typeof pedidos;
    }
  } catch { /* sem dados */ }

  return (
    <div>
      <h1 className="font-serif text-2xl text-charcoal mb-6">Meus Pedidos</h1>

      {pedidos.length === 0 ? (
        <div className="bg-white rounded-sm shadow-sm py-20 text-center">
          <Package size={48} className="text-cream-darker mx-auto mb-4" />
          <p className="font-serif text-xl text-charcoal mb-2">Nenhum pedido ainda</p>
          <p className="text-charcoal-muted text-sm mb-6">Explore nossa coleção e faça seu primeiro pedido</p>
          <Link href="/produtos" className="btn-gold inline-flex">Ver Coleção</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((p) => (
            <PedidoCardCliente key={p.id} pedido={p} />
          ))}
        </div>
      )}
    </div>
  );
}
