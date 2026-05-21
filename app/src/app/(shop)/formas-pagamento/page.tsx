import { CreditCard, QrCode, FileText, ShieldCheck } from 'lucide-react';

export default function FormasPagamentoPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard size={24} className="text-gold" />
        </div>
        <h1 className="font-serif text-3xl text-charcoal mb-2">Formas de Pagamento</h1>
        <p className="text-charcoal-muted text-sm">Escolha a forma mais conveniente para você</p>
      </div>

      {/* Segurança */}
      <div className="bg-green-50 border border-green-200 rounded-sm p-4 flex items-center gap-3 mb-6">
        <ShieldCheck size={20} className="text-green-600 shrink-0" />
        <p className="text-sm text-green-800 font-semibold">
          🔒 Todos os pagamentos são processados em ambiente 100% seguro com criptografia SSL.
        </p>
      </div>

      {/* Métodos de pagamento */}
      <div className="space-y-4 mb-6">

        {/* PIX */}
        <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
          <div className="flex items-center gap-4 px-5 py-4 border-b border-cream-darker bg-cream/50">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <QrCode size={20} className="text-green-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-serif text-lg text-charcoal">PIX</h2>
              <p className="text-xs text-charcoal-muted">Pagamento instantâneo</p>
            </div>
            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-sm">10% OFF</span>
          </div>
          <div className="px-5 py-4 space-y-2 text-sm text-charcoal-muted">
            <p>✅ Desconto especial de <strong className="text-green-600">10%</strong> em todas as compras no PIX</p>
            <p>✅ Confirmação em até <strong>5 minutos</strong> após o pagamento</p>
            <p>✅ QR Code válido por <strong>15 minutos</strong> — gerado na hora da compra</p>
            <p>✅ Chave PIX: CNPJ <strong>48.065.930/0001-50</strong></p>
            <p className="text-[11px] pt-2 border-t border-cream-darker text-charcoal-muted">
              ⚠️ O QR Code expira em 15 minutos. Se não concluir no prazo, um novo código será gerado e o pedido pode ser cancelado se não pago em até 1 minuto após a expiração.
            </p>
          </div>
        </div>

        {/* Cartão de Crédito */}
        <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
          <div className="flex items-center gap-4 px-5 py-4 border-b border-cream-darker bg-cream/50">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <CreditCard size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-serif text-lg text-charcoal">Cartão de Crédito</h2>
              <p className="text-xs text-charcoal-muted">Visa, Mastercard, Elo, American Express</p>
            </div>
          </div>
          <div className="px-5 py-4 space-y-2 text-sm text-charcoal-muted">
            <p>✅ Parcelamento em até <strong>6x sem juros</strong></p>
            <p>✅ Processamento seguro — dados do cartão não armazenados</p>
            <p>✅ Aprovação em tempo real</p>
            <div className="mt-3 border-t border-cream-darker pt-3">
              <p className="text-xs font-semibold text-charcoal mb-2">Simulação de parcelamento para R$ 299,90:</p>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="bg-cream rounded-sm p-2 text-center">
                    <p className="text-xs font-bold text-charcoal">{n}x</p>
                    <p className="text-[11px] text-gold">R$ {(299.90 / n).toFixed(2).replace('.', ',')}</p>
                    <p className="text-[10px] text-green-600">sem juros</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Boleto */}
        <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
          <div className="flex items-center gap-4 px-5 py-4 border-b border-cream-darker bg-cream/50">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <FileText size={20} className="text-gray-600" />
            </div>
            <div>
              <h2 className="font-serif text-lg text-charcoal">Boleto Bancário</h2>
              <p className="text-xs text-charcoal-muted">Compensação em 2 dias úteis</p>
            </div>
          </div>
          <div className="px-5 py-4 space-y-2 text-sm text-charcoal-muted">
            <p>✅ Vencimento em <strong>2 dias úteis</strong> após a geração</p>
            <p>✅ Compensação bancária em <strong>2 dias úteis</strong></p>
            <p>✅ Pedido confirmado após a compensação</p>
            <p>⚠️ O estoque é reservado por até 5 dias. Se o boleto não for pago, o pedido é cancelado automaticamente.</p>
          </div>
        </div>
      </div>

      {/* Bandeiras aceitas */}
      <div className="bg-white border border-gray-100 rounded-sm shadow-sm p-5">
        <h2 className="font-serif text-lg text-charcoal mb-3">Bandeiras Aceitas</h2>
        <div className="flex flex-wrap gap-3">
          {['Visa', 'Mastercard', 'Elo', 'American Express', 'Hipercard', 'Diners'].map((b) => (
            <span key={b} className="border border-gray-200 px-3 py-1.5 text-xs font-semibold text-charcoal rounded-sm">{b}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
