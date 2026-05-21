'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setEmail('');
    toast.success('Você foi inscrito com sucesso!');
  }

  return (
    <section className="bg-charcoal text-cream py-14 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-5">
          <Mail size={20} className="text-gold" />
        </div>
        <h2 className="font-serif text-3xl text-cream mb-2">Receba em Primeira Mão</h2>
        <p className="text-cream/60 text-sm mb-8">
          Cadastre-se e ganhe 10% de desconto na primeira compra + novidades exclusivas antes de todo mundo.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <div className="flex-1">
            <Input
              type="email"
              placeholder="seu@email.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/10 border-white/20 text-cream placeholder-cream/40 focus:border-gold"
              required
            />
          </div>
          <Button type="submit" loading={loading} className="shrink-0">
            Quero 10% Off
          </Button>
        </form>
        <p className="text-cream/30 text-xs mt-4">Sem spam. Cancele quando quiser.</p>
      </div>
    </section>
  );
}
