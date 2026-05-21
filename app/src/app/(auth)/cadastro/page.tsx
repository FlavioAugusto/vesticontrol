'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useConfig } from '@/hooks/useConfig';
import { Phone, Clock } from 'lucide-react';

const schema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  sobrenome: z.string().min(2, 'Sobrenome obrigatório'),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().min(10, 'Telefone inválido').optional().or(z.literal('')),
  senha: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Use ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Use ao menos um número'),
  confirmar: z.string(),
  newsletter: z.boolean(),
}).refine((d) => d.senha === d.confirmar, { message: 'Senhas não conferem', path: ['confirmar'] });

type FormData = z.infer<typeof schema>;

export default function CadastroPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [bloqueadoAdmin, setBloqueadoAdmin] = useState(false);
  const supabase = createClient();

  // Bloqueia cadastro com destino admin — admins são criados fora do sistema
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next') || '';
    if (next.startsWith('/admin') || next.startsWith('/super-admin')) {
      setBloqueadoAdmin(true);
    }
  }, []);
  const config = useConfig();
  const logo = config?.logo ?? '/images/logo.svg';
  const nome = config?.nome ?? 'By Marcelo Medeiros';
  const telefone = config?.telefone ?? '';
  const horario = config?.horario ?? '';

  // Pegar e-mail/CPF da URL (vindo do fluxo de login)
  const emailParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('email') ?? '' : '';

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { newsletter: true, email: emailParam },
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.senha,
      options: {
        data: { nome: data.nome, sobrenome: data.sobrenome },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // Cria perfil via API (com loja_id detectado pelo middleware no servidor)
      // Passa user_id explicitamente porque pode rodar antes da confirmação de email
      await fetch('/api/clientes/criar-perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: authData.user.id,
          nome: data.nome,
          sobrenome: data.sobrenome,
          telefone: data.telefone || null,
          whatsapp: data.telefone || null,
          newsletter: data.newsletter ?? true,
        }),
      }).catch(() => {});
    }

    // Login automático após criar conta
    const { error: loginErr } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.senha,
    });

    setLoading(false);

    if (!loginErr) {
      toast.success('Conta criada com sucesso! Bem-vinda(o)!');
      router.push('/minha-conta');
      router.refresh();
    } else {
      toast.success('Conta criada! Faça seu login.');
      router.push('/login');
    }
  }

  if (bloqueadoAdmin) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-[#1a1a1a] border border-white/10 p-8 rounded-sm text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gold/10 border border-gold/30 rounded-full flex items-center justify-center text-2xl">
            🔒
          </div>
          <h1 className="font-serif text-2xl text-cream mb-2">Acesso Restrito</h1>
          <p className="text-cream/60 text-sm mb-6">
            Contas administrativas não podem ser criadas pelo site.
            Apenas a equipe interna pode cadastrar administradores.
          </p>
          <p className="text-cream/40 text-xs mb-6">
            Se você é cliente, acesse a página de cadastro normalmente para criar sua conta de compras.
          </p>
          <div className="flex flex-col gap-2">
            <Link href="/cadastro" className="bg-gold hover:bg-gold-600 text-white py-3 px-6 rounded-sm text-sm font-semibold tracking-wider uppercase">
              Criar conta de cliente
            </Link>
            <Link href="/" className="text-cream/50 text-sm hover:text-gold py-2">
              Voltar à loja
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal flex flex-col">

      {/* Telefone e horário */}
      {(telefone || horario) && (
        <div className="border-b border-white/10 py-2.5 px-4">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-end gap-4 text-[12px] text-cream/50">
            {telefone && <span className="flex items-center gap-1.5"><Phone size={11} className="text-gold" />{telefone}</span>}
            {horario && <span className="flex items-center gap-1.5"><Clock size={11} className="text-gold" />{horario}</span>}
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            {logo ? (
              <img src={logo} alt={nome}
                className="h-16 w-auto mx-auto object-contain mb-3"
                onError={(e) => {
                  const img = e.currentTarget;
                  img.style.display = 'none';
                  const fallback = img.parentElement?.parentElement?.querySelector('.fallback-name') as HTMLElement | null;
                  if (fallback) fallback.style.display = 'block';
                }} />
            ) : null}
            <h2 className="fallback-name font-display text-lg tracking-[6px] text-cream uppercase mb-3"
              style={{ display: logo ? 'none' : 'block' }}>
              {nome}
            </h2>
          </Link>
          <h1 className="font-serif text-3xl text-cream mb-2">Criar Conta</h1>
          <p className="text-cream/50 text-sm">Faça parte da nossa comunidade exclusiva</p>
        </div>

        <div className="bg-[#1a1a1a] border border-white/10 p-8 rounded-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Nome e Sobrenome */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-cream/50 uppercase tracking-wider mb-1.5">NOME *</label>
                <input type="text" {...register('nome')} className="w-full bg-[#111] border border-white/10 text-cream placeholder-cream/20 px-3 py-3 text-sm focus:outline-none focus:border-gold/50 transition-colors" />
                {errors.nome && <p className="text-red-400 text-[11px] mt-1">{errors.nome.message}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-cream/50 uppercase tracking-wider mb-1.5">SOBRENOME *</label>
                <input type="text" {...register('sobrenome')} className="w-full bg-[#111] border border-white/10 text-cream placeholder-cream/20 px-3 py-3 text-sm focus:outline-none focus:border-gold/50 transition-colors" />
                {errors.sobrenome && <p className="text-red-400 text-[11px] mt-1">{errors.sobrenome.message}</p>}
              </div>
            </div>

            {/* E-mail */}
            <div>
              <label className="block text-[11px] font-semibold text-cream/50 uppercase tracking-wider mb-1.5">E-MAIL *</label>
              <input type="email" {...register('email')} className="w-full bg-[#111] border border-white/10 text-cream placeholder-cream/20 px-3 py-3 text-sm focus:outline-none focus:border-gold/50 transition-colors" />
              {errors.email && <p className="text-red-400 text-[11px] mt-1">{errors.email.message}</p>}
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-[11px] font-semibold text-cream/50 uppercase tracking-wider mb-1.5">TELEFONE / WHATSAPP</label>
              <input type="tel" placeholder="(81) 99999-9999" {...register('telefone')} className="w-full bg-[#111] border border-white/10 text-cream placeholder-cream/20 px-3 py-3 text-sm focus:outline-none focus:border-gold/50 transition-colors" />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-[11px] font-semibold text-cream/50 uppercase tracking-wider mb-1.5">SENHA *</label>
              <input type="password" {...register('senha')} className="w-full bg-[#111] border border-white/10 text-cream placeholder-cream/20 px-3 py-3 text-sm focus:outline-none focus:border-gold/50 transition-colors" />
              {errors.senha && <p className="text-red-400 text-[11px] mt-1">{errors.senha.message}</p>}
            </div>

            {/* Confirmar senha */}
            <div>
              <label className="block text-[11px] font-semibold text-cream/50 uppercase tracking-wider mb-1.5">CONFIRMAR SENHA *</label>
              <input type="password" {...register('confirmar')} className="w-full bg-[#111] border border-white/10 text-cream placeholder-cream/20 px-3 py-3 text-sm focus:outline-none focus:border-gold/50 transition-colors" />
              {errors.confirmar && <p className="text-red-400 text-[11px] mt-1">{errors.confirmar.message}</p>}
            </div>

            {/* Newsletter */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked {...register('newsletter')} className="accent-gold w-4 h-4" />
              <span className="text-xs text-cream/40">Quero receber novidades e promoções exclusivas</span>
            </label>

            <button type="submit" disabled={loading}
              className="w-full bg-gold hover:bg-gold-600 text-white py-3.5 font-semibold text-sm tracking-wider uppercase transition-colors disabled:opacity-50 rounded-sm mt-2">
              {loading ? 'Criando conta...' : 'CRIAR CONTA'}
            </button>
          </form>

          <p className="text-center text-sm text-cream/30 mt-6">
            Já tem conta?{' '}
            <Link href="/login" className="text-gold font-semibold hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
