import { getConfiguracoes } from '@/lib/configuracoes';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Força no-cache em todos os headers
  try { headers(); } catch {}

  let logoUrl = '';
  let nomeLoja = 'Sua Loja';
  let telefone = '';
  let horario = '';

  try {
    const c = await getConfiguracoes();
    logoUrl = c.loja_logo_url || logoUrl;
    nomeLoja = c.loja_nome || nomeLoja;
    telefone = c.loja_telefone || telefone;
    horario = c.loja_horario_atendimento || horario;
  } catch { /* usa defaults */ }

  return (
    <div
      data-logo={logoUrl}
      data-nome={nomeLoja}
      data-telefone={telefone}
      data-horario={horario}
    >
      {/* Injetar configs no window para os Client Components lerem */}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__SITE_CONFIG__ = ${JSON.stringify({ logo: logoUrl, nome: nomeLoja, telefone, horario })}`,
        }}
      />
      {children}
    </div>
  );
}
