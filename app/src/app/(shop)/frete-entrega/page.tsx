import { Truck, Clock, Package, MapPin, QrCode } from 'lucide-react';

export default function FreteEntregaPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Truck size={24} className="text-gold" />
        </div>
        <h1 className="font-serif text-3xl text-charcoal mb-2">Frete e Entrega</h1>
        <p className="text-charcoal-muted text-sm">Enviamos para todo o Brasil com segurança</p>
      </div>

      {/* Destaque frete grátis */}
      <div className="bg-gold text-white rounded-sm p-5 mb-6 text-center">
        <p className="font-display text-xl tracking-widest mb-1">FRETE GRÁTIS</p>
        <p className="text-sm text-white/90">na sua primeira compra · ou acima de R$ 499,90</p>
      </div>

      {/* Cards informativos */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {[
          { icon: Clock, titulo: 'Prazo de Processamento', desc: 'Após a confirmação do pagamento, seu pedido é preparado em até 2 dias úteis antes do envio.' },
          { icon: Package, titulo: 'Embalagem Segura', desc: 'Todas as peças são embaladas com cuidado para chegar perfeitas até você.' },
          { icon: MapPin, titulo: 'Rastreamento', desc: 'Você recebe o código de rastreio por e-mail assim que o pedido for enviado.' },
          { icon: QrCode, titulo: 'Seguro de Transporte', desc: 'Todos os envios possuem declaração de valor para garantir sua compra.' },
        ].map(({ icon: Icon, titulo, desc }) => (
          <div key={titulo} className="bg-white border border-gray-100 rounded-sm p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-gold/10 rounded-full flex items-center justify-center shrink-0">
                <Icon size={16} className="text-gold" />
              </div>
              <h3 className="font-semibold text-sm text-charcoal">{titulo}</h3>
            </div>
            <p className="text-xs text-charcoal-muted leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Prazos por região */}
      <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-cream-darker bg-cream">
          <h2 className="font-serif text-lg text-charcoal">Prazos de Entrega por Região</h2>
          <p className="text-xs text-charcoal-muted mt-0.5">Contados em dias úteis após o envio</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream-darker">
              <th className="text-left px-5 py-3 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">Região</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">PAC</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">SEDEX</th>
            </tr>
          </thead>
          <tbody>
            {[
              { regiao: 'Nordeste (Pernambuco e arredores)', pac: '3–5 dias', sedex: '1–2 dias' },
              { regiao: 'Nordeste (demais estados)', pac: '5–8 dias', sedex: '2–3 dias' },
              { regiao: 'Sudeste', pac: '7–10 dias', sedex: '2–4 dias' },
              { regiao: 'Sul', pac: '8–12 dias', sedex: '3–5 dias' },
              { regiao: 'Centro-Oeste', pac: '7–11 dias', sedex: '2–4 dias' },
              { regiao: 'Norte', pac: '10–15 dias', sedex: '4–7 dias' },
            ].map((r, i) => (
              <tr key={r.regiao} className={`border-b border-cream-darker ${i % 2 === 0 ? '' : 'bg-cream/30'}`}>
                <td className="px-5 py-3 text-charcoal">{r.regiao}</td>
                <td className="px-5 py-3 text-center text-charcoal-muted">{r.pac}</td>
                <td className="px-5 py-3 text-center text-charcoal-muted font-semibold">{r.sedex}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 bg-cream/50">
          <p className="text-[11px] text-charcoal-muted">* Prazos estimados. Podem variar por região, condições climáticas e volume dos Correios.</p>
        </div>
      </div>

      {/* Transportadoras */}
      <div className="bg-white border border-gray-100 rounded-sm shadow-sm p-5 mb-6">
        <h2 className="font-serif text-lg text-charcoal mb-4">Transportadoras Parceiras</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { nome: 'Correios', desc: 'PAC e SEDEX para todo o Brasil', emoji: '📮' },
            { nome: 'Melhor Envio', desc: 'JadLog, Azul Cargo e mais opções', emoji: '📦' },
          ].map(({ nome, desc, emoji }) => (
            <div key={nome} className="border border-cream-darker rounded-sm p-4 flex items-center gap-3">
              <span className="text-2xl">{emoji}</span>
              <div>
                <p className="font-semibold text-sm text-charcoal">{nome}</p>
                <p className="text-[11px] text-charcoal-muted">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <a href="https://wa.me/5581994228240" target="_blank" rel="noopener"
          className="inline-flex items-center gap-2 bg-green-500 text-white px-5 py-2.5 text-sm font-semibold rounded-sm hover:bg-green-600 transition-colors">
          💬 Dúvidas sobre meu pedido
        </a>
      </div>
    </div>
  );
}
