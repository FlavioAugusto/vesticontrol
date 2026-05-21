'use client';

import { useEffect, useState } from 'react';

export interface LojaInfo {
  loja_id: string;
  loja: { id: string; nome: string; slug: string; dominio: string | null } | null;
  nivel: string;
  eh_super_admin: boolean;
}

/**
 * Hook que retorna o loja_id do admin logado.
 * Use em TODAS as páginas /admin pra filtrar queries por loja.
 */
export function useLojaAdmin(): { lojaId: string | null; info: LojaInfo | null; loading: boolean } {
  const [info, setInfo] = useState<LojaInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/minha-loja', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then((data: LojaInfo | null) => setInfo(data))
      .catch(() => setInfo(null))
      .finally(() => setLoading(false));
  }, []);

  return { lojaId: info?.loja_id ?? null, info, loading };
}
