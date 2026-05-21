'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Phone, Clock } from 'lucide-react';
import { useConfig } from '@/hooks/useConfig';

type Etapa = 'identificacao' | 'senha' | 'esqueci';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Guarda contra searchParams null durante SSR/SSG
  const next = searchParams?.get('next') ?? '/minha-conta';
  const motivo = searchParams?.get('motivo') ?? null;
  const erro = searchParams?.get('erro') ?? null;
  const config = useConfig();
  // Defesa: config pode ser undefined em alguns casos
  const logo = config?.logo ?? '/images/logo.svg';
  const nome = config?.nome ?? 'By Marcelo Medeiros';
  const telefone = config?.telefone ?? '';
  const horario = config?.horario ?? '';
  const rodapeRua = (config as Record<string, string> | undefined)?.rodapeRua ?? '';
  const rodapeCnpj = (config as Record<string, string> | undefined)?.rodapeCnpj ?? '';
  const rodapeCredito = (config as Record<string, string> | undefined)?.rodapeCredito ?? '';

  const [etapa, setEtapa] = useState<Etapa>('identificacao');
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [emailMascarado, setEmailMascarado] = useState('');
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const supabase = createClient();

  async function handleContinuar(e: React.FormEvent) {
    e.preventDefault();
    if (!identificador.trim()) { toast.error('Informe seu e-mail ou CPF'); return; }
    setLoading(true);

    if (identificador.includes('@')) {
      // E-mail → vai direto para senha
      setLoading(false);
      setEtapa('senha');
    } else {
      // CPF/CNPJ → verificar se existe cadastro
      try {
        const res = await fetch('/api/auth/verificar-cpf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cpf: identificador }),
        });
        const d = await res.json();
        setLoading(false);

        if (d.encontrado) {
          // CPF encontrado → usar o e-mail real para login, mostrar mascarado
          setIdentificador(d.email); // usa e-mail real internamente
          setEmailMascarado(d.emailMascarado);
          setEtapa('senha');
        } else {
          // CPF não cadastrado → vai para cadastro
          router.push(`/cadastro?cpf=${encodeURIComponent(identificador)}&next=${next}`);
        }
      } catch {
        setLoading(false);
        toast.error('Erro ao verificar cadastro');
      }
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!senha) { toast.error('Informe sua senha'); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: identificador, password: senha });
    setLoading(false);
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast((t) => (
          <span className="text-sm">
            E-mail ou senha incorretos.{' '}
            <button className="text-blue-400 underline ml-1" onClick={() => {
              toast.dismiss(t.id);
              router.push(`/cadastro?email=${encodeURIComponent(identificador)}&next=${next}`);
            }}>Criar conta</button>
          </span>
        ), { duration: 5000 });
      } else {
        toast.error(error.message);
      }
      return;
    }
    if (data.user) {
      const { data: adminData } = await supabase.from('admins').select('id').eq('id', data.user.id).single();
      router.push(adminData ? '/admin' : next);
      router.refresh();
    }
  }

  async function handleEsqueci(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identificador }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'USER_NOT_FOUND') {
          toast.error('Este e-mail não está cadastrado em nosso sistema.', { duration: 6000 });
        } else {
          toast.error(data.error ?? 'Erro ao enviar e-mail');
        }
        return;
      }
      toast.success(data.mensagem ?? 'E-mail enviado! Verifique sua caixa de entrada e spam.', { duration: 6000 });
      setEtapa('senha');
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-charcoal flex flex-col">

      {/* Topo com informações */}
      <div className="border-b border-white/10 py-3 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-end gap-4 text-[12px] text-cream/50">
          {telefone && <span className="flex items-center gap-1.5"><Phone size={11} className="text-gold" />{telefone}</span>}
          {horario && <span className="flex items-center gap-1.5"><Clock size={11} className="text-gold" />{horario}</span>}
        </div>
      </div>

      {/* Centro */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            {logo ? (
              <img
                src={`${logo}${logo.includes('?') ? '&' : '?'}t=${Date.now()}`}
                alt={nome}
                className="h-16 w-auto mx-auto object-contain mb-3"
                onError={(e) => {
                  const img = e.currentTarget;
                  img.style.display = 'none';
                  const fallback = img.nextElementSibling as HTMLElement | null;
                  if (fallback) fallback.style.display = 'block';
                }} />
            ) : null}
            <h1 className="font-display text-xl tracking-[6px] text-cream uppercase mb-3"
              style={{ display: logo ? 'none' : 'block' }}>
              {nome}
            </h1>
          </div>

          <div className="bg-[#1a1a1a] border border-white/10 rounded-sm p-8">

            {/* Avisos de sessão/erro */}
            {(motivo === 'sessao_expirada' || erro === 'auth') && (
              <div className="mb-5 bg-amber-500/10 border border-amber-500/30 text-amber-200 px-4 py-2.5 rounded-sm text-xs">
                ⚠️ Sua sessão expirou. Faça login novamente para continuar.
              </div>
            )}
            {erro === 'conexao' && (
              <div className="mb-5 bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-2.5 rounded-sm text-xs">
                ❌ Falha na conexão. Verifique sua internet e faça login novamente.
              </div>
            )}
            {erro === 'verificacao' && (
              <div className="mb-5 bg-orange-500/10 border border-orange-500/30 text-orange-200 px-4 py-2.5 rounded-sm text-xs">
                ⚠️ Não foi possível verificar suas permissões. Tente fazer login novamente.
              </div>
            )}

            {etapa === 'identificacao' && (
              <>
                <h2 className="text-center font-serif text-xl text-cream mb-6">Faça seu login</h2>
                <form onSubmit={handleContinuar} className="space-y-4">
                  <input type="text" placeholder="E-MAIL ou CPF/CNPJ" value={identificador}
                    onChange={(e) => setIdentificador(e.target.value)} autoFocus
                    className="w-full bg-[#111] border border-white/10 text-cream placeholder-cream/30 px-4 py-3.5 text-sm focus:outline-none focus:border-gold/50 transition-colors rounded-sm" />
                  <button type="submit" disabled={loading}
                    className="w-full bg-gold hover:bg-gold-600 text-white py-3.5 font-semibold text-sm tracking-wider uppercase transition-colors disabled:opacity-50 rounded-sm">
                    {loading ? 'Verificando...' : 'Continuar'}
                  </button>
                </form>
                {!next.startsWith('/admin') && !next.startsWith('/super-admin') && (
                  <p className="text-center text-sm text-cream/40 mt-5">
                    Não tem uma conta?{' '}
                    <Link href={`/cadastro?next=${next}`} className="text-gold hover:underline font-semibold">Cadastre-se</Link>
                  </p>
                )}
              </>
            )}

            {etapa === 'senha' && (
              <>
                <h2 className="text-center font-serif text-xl text-cream mb-1">Bem-vinda!</h2>
                <p className="text-center text-xs text-cream/40 mb-6">
                  {emailMascarado || identificador}
                </p>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="relative">
                    <input type={mostrarSenha ? 'text' : 'password'} placeholder="SENHA"
                      value={senha} onChange={(e) => setSenha(e.target.value)} autoFocus
                      className="w-full bg-[#111] border border-white/10 text-cream placeholder-cream/30 px-4 py-3.5 text-sm focus:outline-none focus:border-gold/50 transition-colors pr-10 rounded-sm" />
                    <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/40 hover:text-cream">
                      {mostrarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <div className="text-right -mt-1">
                    <button type="button" onClick={() => setEtapa('esqueci')}
                      className="text-xs text-gold hover:underline">Esqueci minha senha</button>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full bg-gold hover:bg-gold-600 text-white py-3.5 font-semibold text-sm tracking-wider uppercase transition-colors disabled:opacity-50 rounded-sm">
                    {loading ? 'Entrando...' : 'Entrar'}
                  </button>
                </form>
                <button
                  onClick={() => { setEtapa('identificacao'); setEmailMascarado(''); setIdentificador(''); }}
                  className="w-full text-center text-xs text-cream/30 hover:text-cream/60 mt-4 transition-colors">← Usar outro e-mail ou CPF</button>
              </>
            )}

            {etapa === 'esqueci' && (
              <>
                <h2 className="text-center font-serif text-xl text-cream mb-2">Recuperar senha</h2>
                <p className="text-center text-xs text-cream/40 mb-6">
                  Enviaremos um link para <strong className="text-cream/70">{identificador}</strong>
                </p>
                <form onSubmit={handleEsqueci} className="space-y-4">
                  <button type="submit" disabled={loading}
                    className="w-full bg-gold hover:bg-gold-600 text-white py-3.5 font-semibold text-sm tracking-wider uppercase transition-colors disabled:opacity-50 rounded-sm">
                    {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                  </button>
                </form>
                <button onClick={() => setEtapa('senha')}
                  className="w-full text-center text-xs text-cream/30 hover:text-cream/60 mt-4 transition-colors">← Voltar</button>
              </>
            )}

          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div className="border-t border-white/10 py-4 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] text-cream/25">
          <span>{nome}{rodapeRua && ` — ${rodapeRua}`}{rodapeCnpj && ` · CNPJ: ${rodapeCnpj}`}</span>
          {rodapeCredito && <span>{rodapeCredito}</span>}
        </div>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <p className="text-cream/40 text-sm">Carregando...</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
