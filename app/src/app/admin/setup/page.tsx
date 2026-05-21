'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useConfig } from '@/hooks/useConfig';

export default function AdminSetupPage() {
  const config = useConfig();
  const logo = config?.logo ?? '/images/logo.svg';
  const nome = config?.nome ?? 'By Marcelo Medeiros';
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [form, setForm] = useState({ email: '', senha: '', nome: '', codigoSetup: '' });
  const router = useRouter();

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    if (form.senha.length < 8) { toast.error('Senha deve ter mínimo 8 caracteres'); return; }
    setLoading(true);

    try {
      // Usa API com service role — cria usuário com e-mail já confirmado
      const res = await fetch('/api/admin/criar-usuario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          senha: form.senha,
          nome: form.nome,
          codigoSetup: form.codigoSetup,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error ?? 'Erro ao criar conta');
        setLoading(false);
        return;
      }

      // Fazer login automático após criar
      const supabase = createClient();
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.senha,
      });

      setLoading(false);

      if (loginErr) {
        toast.error('Conta criada! Agora faça login com suas credenciais.');
        setTimeout(() => router.push('/login?next=/admin'), 1500);
      } else {
        toast.success('Admin configurado com sucesso!');
        setTimeout(() => router.push('/admin'), 1200);
      }
    } catch {
      setLoading(false);
      toast.error('Erro de conexão. Tente novamente.');
    }
  }

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <img src={logo} alt={nome} className="h-16 w-auto object-contain brightness-0 invert"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }} />
            <div className="hidden w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center">
              <ShieldCheck size={28} className="text-gold" />
            </div>
          </div>
          <h1 className="font-display text-2xl text-cream tracking-widest">{nome.toUpperCase()}</h1>
          <p className="text-cream/60 text-sm mt-2">Configuração do Primeiro Admin</p>
        </div>

        <div className="bg-white p-8 rounded-sm">
          <form onSubmit={handleSetup} className="space-y-4">
            <Input label="Seu Nome" placeholder="Marcelo Medeiros"
              value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
            <Input label="E-mail do Admin" type="email" placeholder="admin@bymarcelomedeiros.com.br"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <div className="relative">
              <Input label="Senha (mín. 8 caracteres)" type={mostrarSenha ? 'text' : 'password'}
                value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} required />
              <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-8 text-charcoal-muted hover:text-charcoal">
                {mostrarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <Input label="Código de Setup" placeholder="Código secreto"
              value={form.codigoSetup} onChange={(e) => setForm({ ...form, codigoSetup: e.target.value })} required />
            <Button type="submit" loading={loading} className="w-full">Criar Conta Admin</Button>
          </form>
          <p className="text-xs text-charcoal-muted text-center mt-4">
            Após configurar, use o e-mail e senha criados para acessar o admin.
          </p>
        </div>
      </div>
    </div>
  );
}
