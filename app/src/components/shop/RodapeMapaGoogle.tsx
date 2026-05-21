import { MapPin } from 'lucide-react';

interface Props { titulo?: string; url: string; endereco?: string }

/**
 * Converte qualquer URL do Google Maps (compartilhada, encurtada ou endereço puro)
 * em uma URL embedável que funciona dentro de iframe.
 */
function montarUrlEmbed(url: string, endereco?: string): string {
  const limpo = (url ?? '').trim();

  // 1. Se é um iframe completo colado, extrai o src PRIMEIRO
  //    (precisa vir antes do check de "includes embed" porque o iframe contém a URL)
  const srcMatch = limpo.match(/src=["']([^"']+)["']/);
  if (srcMatch) {
    return srcMatch[1];
  }

  // 2. Se já é uma URL de embed limpa, retorna direto
  if (limpo.includes('google.com/maps/embed')) {
    return limpo;
  }

  // 3. Se é uma URL pública (maps.app.goo.gl, goo.gl/maps), o Google não permite
  //    embed direto delas — usa o endereço como fallback.
  const queryFonte = endereco?.trim() || limpo;
  if (!queryFonte) return '';
  const query = encodeURIComponent(queryFonte);
  return `https://maps.google.com/maps?q=${query}&output=embed`;
}

export default function RodapeMapaGoogle({ titulo = 'Nossa Localização', url, endereco }: Props) {
  // Se não tem url nem endereço, não exibe a seção
  if (!url && !endereco) return null;

  const embedUrl = montarUrlEmbed(url, endereco);

  return (
    <section className="bg-cream-dark py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={18} className="text-gold" />
          <h2 className="font-serif text-2xl text-charcoal">{titulo}</h2>
        </div>
        {endereco && <p className="text-sm text-charcoal-muted mb-4">{endereco}</p>}
        <div className="overflow-hidden rounded-sm shadow-sm">
          <iframe
            src={embedUrl}
            width="100%"
            height="350"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={titulo}
          />
        </div>
      </div>
    </section>
  );
}
