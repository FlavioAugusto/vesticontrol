interface Props {
  telefone?: string;
  horario?: string;
}

export default function InfoBar({
  telefone = '(81) 99422-8240',
  horario = 'Seg–Sex: 08:00–18:00 | Sáb e Dom: sem atendimento',
}: Props) {
  return (
    <div className="bg-white border-b border-gray-100 py-1.5 px-4 hidden md:block">
      <div className="max-w-7xl mx-auto flex items-center justify-end gap-6 text-[11px] text-charcoal-muted font-sans">
        <a href={`tel:${telefone.replace(/\D/g, '')}`} className="hover:text-gold transition-colors font-semibold">
          {telefone}
        </a>
        <span>{horario}</span>
      </div>
    </div>
  );
}
