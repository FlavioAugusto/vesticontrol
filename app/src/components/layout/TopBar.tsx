export default function TopBar() {
  const msg = '''';
  const repeated = Array(12).fill(msg);

  return (
    <div className="bg-charcoal text-cream overflow-hidden py-2.5 relative">
      <div className="flex animate-marquee whitespace-nowrap">
        {repeated.map((text, i) => (
          <span key={i} className="text-[11px] font-sans font-semibold tracking-[3px] uppercase mx-8 shrink-0">
            {text}
            <span className="mx-8 text-gold">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
