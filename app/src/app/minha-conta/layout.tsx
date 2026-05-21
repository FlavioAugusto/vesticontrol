import ContaNav from '@/components/conta/ContaNav';

export default function MinhaContaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-8">
          <aside className="md:col-span-1">
            <ContaNav />
          </aside>
          <div className="md:col-span-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
