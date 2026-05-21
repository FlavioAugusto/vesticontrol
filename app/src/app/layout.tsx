import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { getConfiguracoes } from '@/lib/configuracoes';
import './globals.css';

// Força renderização dinâmica pra sempre pegar favicon/título atualizados do banco
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper pra criar cache-buster ESTÁVEL baseado na URL real (não Date.now)
function cacheBust(url: string): string {
  if (!url || url.startsWith('/favicon.ico')) return url;
  // Extrai um fingerprint do path da URL (estável quando URL não muda)
  const hash = url.split('/').pop()?.split('.')[0]?.slice(-8) ?? 'v1';
  return url.includes('?') ? `${url}&v=${hash}` : `${url}?v=${hash}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const configs = await getConfiguracoes();
  const titulo = configs.seo_titulo || configs.loja_nome || 'Sua Loja — Moda Feminina';
  const descricao = configs.seo_descricao || 'Moda feminina com peças exclusivas.';
  const faviconBase = configs.loja_favicon_url || '/favicon.ico';
  const favicon = cacheBust(faviconBase);
  const loja = configs.loja_nome || 'Sua Loja';

  return {
    title: {
      default: titulo,
      template: `%s | ${loja}`,
    },
    description: descricao,
    keywords: ['moda feminina', 'vestidos', 'conjuntos', 'alta costura', loja.toLowerCase()],
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
    },
    openGraph: {
      title: loja,
      description: descricao,
      locale: 'pt_BR',
      type: 'website',
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const configs = await getConfiguracoes();
  const faviconBase = configs.loja_favicon_url || '/favicon.ico';
  const favicon = cacheBust(faviconBase);
  // Detecta tipo MIME baseado na extensão
  const ext = faviconBase.split('.').pop()?.toLowerCase() ?? 'png';
  const mimeType =
    ext === 'svg' ? 'image/svg+xml' :
    ext === 'webp' ? 'image/webp' :
    ext === 'ico' ? 'image/x-icon' :
    'image/png';

  return (
    <html lang="pt-BR">
      <head>
        {/* Favicons com tipo MIME correto pra reduzir cache agressivo */}
        <link rel="icon" type={mimeType} href={favicon} />
        <link rel="shortcut icon" type={mimeType} href={favicon} />
        <link rel="apple-touch-icon" href={favicon} />
        <meta name="theme-color" content="#1e1a16" />
      </head>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e1a16',
              color: '#faf9f7',
              fontFamily: 'Nunito Sans, sans-serif',
              fontSize: '14px',
              borderRadius: '2px',
            },
            success: { iconTheme: { primary: '#b89155', secondary: '#faf9f7' } },
          }}
        />
      </body>
    </html>
  );
}
