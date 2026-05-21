import Link from 'next/link';
import { MessageCircle, Mail, MapPin } from 'lucide-react';

function InstagramIcon({ size = 15 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-charcoal text-cream/70 font-sans">
      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Marca */}
        <div className="md:col-span-1">
          <h2 className="font-display text-xl text-cream tracking-widest mb-4">BY MARCELO MEDEIROS</h2>
          <p className="text-sm leading-relaxed text-cream/60 mb-5">
            Alta costura feminina com elegância, exclusividade e muito estilo.
          </p>
          <div className="flex gap-4">
            <a href="https://instagram.com/by.marcelomedeiros" target="_blank" rel="noopener"
              className="w-9 h-9 rounded-full border border-cream/20 flex items-center justify-center hover:border-gold hover:text-gold transition-colors">
              <InstagramIcon size={15} />
            </a>
            <a href="https://wa.me/5581999999999" target="_blank" rel="noopener"
              className="w-9 h-9 rounded-full border border-cream/20 flex items-center justify-center hover:border-gold hover:text-gold transition-colors">
              <MessageCircle size={15} />
            </a>
            <a href="mailto:contato@bymarcelomedeiros.com.br"
              className="w-9 h-9 rounded-full border border-cream/20 flex items-center justify-center hover:border-gold hover:text-gold transition-colors">
              <Mail size={15} />
            </a>
          </div>
        </div>

        {/* Links */}
        <div>
          <h3 className="text-xs font-semibold text-cream uppercase tracking-widest mb-4">Coleção</h3>
          <ul className="space-y-2.5 text-sm">
            {[['Todos os Produtos', '/produtos'], ['Conjuntos', '/categorias/conjuntos'], ['Vestidos Midi', '/categorias/midi'], ['Vestidos Longos', '/categorias/longos'], ['Lançamentos', '/produtos?badge=new'], ['Promoções', '/produtos?badge=sale']].map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="hover:text-gold transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-cream uppercase tracking-widest mb-4">Ajuda</h3>
          <ul className="space-y-2.5 text-sm">
            {[['Minha Conta', '/minha-conta'], ['Meus Pedidos', '/minha-conta/pedidos'], ['Trocas e Devoluções', '/trocas'], ['Guia de Tamanhos', '/guia-tamanhos'], ['Pagamento', '/formas-pagamento'], ['Frete e Entrega', '/frete']].map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="hover:text-gold transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contato */}
        <div>
          <h3 className="text-xs font-semibold text-cream uppercase tracking-widest mb-4">Contato</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2.5">
              <MessageCircle size={15} className="text-gold mt-0.5 shrink-0" />
              <span>WhatsApp: <a href="https://wa.me/5581999999999" className="hover:text-gold">(81) 99999-9999</a></span>
            </li>
            <li className="flex gap-2.5">
              <Mail size={15} className="text-gold mt-0.5 shrink-0" />
              <span><a href="mailto:contato@bymarcelomedeiros.com.br" className="hover:text-gold">contato@bymarcelomedeiros.com.br</a></span>
            </li>
            <li className="flex gap-2.5">
              <MapPin size={15} className="text-gold mt-0.5 shrink-0" />
              <span>Recife, Pernambuco — Brasil</span>
            </li>
          </ul>
          <div className="mt-5 p-3 bg-white/5 rounded-sm text-xs">
            <p className="text-cream/50">Atendimento</p>
            <p className="text-cream/70 mt-0.5">Seg–Sex: 9h–18h | Sáb: 9h–13h</p>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10 py-5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-cream/40">
          <p>© {new Date().getFullYear()} Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <Link href="/privacidade" className="hover:text-gold transition-colors">Privacidade</Link>
            <Link href="/termos" className="hover:text-gold transition-colors">Termos de Uso</Link>
            <Link href="/cookies" className="hover:text-gold transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
