'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessaoValida, setSessaoValida] = useState<boolean | null>(null);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    // Supabase Auth redireciona com os tokens na URL hash:
    //   /auth/reset#access_token=XXX&refresh_token=YYY&type=recovery
    // Precisamos extrair manualmente e estabelecer a sessão
    (async () => {
      try {
        const supabase = createClient();

        // 1. Extrai tokens do hash da URL (depois do #)
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');
        const errorCode = params.get('error_code');

        // Se veio com erro do Supabase (token expirado, etc)
        if (errorCode) {
          setSessaoValida(false);
          return;
        }

        // 2. Se tem tokens e é tipo "recovery", estabelece a sessão
        if (accessToken && refreshToken && (type === 'recovery' || type === 'invite' || !type)) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            setSessaoValida(false);
            return;
          }
          // Limpa o hash da URL pra não vazar o token no histórico
          window.history.replaceState(null, '', window.location.pathname);
          setSessaoValida(true);
          return;
        }

        // 3. Fallback: verifica se já tem sessão ativa
        const { data: { session } } = await supabase.auth.getSession();
        setSessaoValida(!!session);
      } catch {
        setSessaoValida(false);
      }
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (novaSenha.length < 6) {
      toast.error('A senha precisa ter no mínimo 6 caracteres');
      return;
    }
    if (novaSenha !== confirmar) {
      toast.error('As senhas não conferem');
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) { toast.error(error.message); return; }

      // Detecta o nível do usuário pra redirecionar pro login correto
      const { data: { user } } = await supabase.auth.getUser();
      let destino = '/login';
      if (user) {
        // Verifica se é admin
        const { data: admin } = await supabase.from('admins').select('id').eq('id', user.id).maybeSingle();
        if (admin) destino = '/login';
      }

      // Faz logout pra forçar novo login com a senha nova
      await supabase.auth.signOut();

      setSucesso(true);
      toast.success('Senha alterada com sucesso!');
      setTimeout(() => router.push(destino), 2500);
    } catch {
      toast.error('Erro ao alterar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (sessaoValida === null) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center p-4">
        <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (sessaoValida === false) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center p-4">
        <div className="bg-[#1a1a1a] border border-white/10 rounded-sm p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={24} className="text-red-400" />
          </div>
          <h2 className="font-serif text-xl text-cream mb-2">Link inválido ou expirado</h2>
          <p className="text-cream/60 text-sm mb-6">
            O link de recuperação não é válido, foi usado ou expirou (válido por 1 hora).
          </p>
          <button onClick={() => router.push('/login')}
            className="w-full bg-gold hover:bg-gold-600 text-white py-3 font-semibold text-sm tracking-wider uppercase transition-colors rounded-sm">
            Solicitar novo link
          </button>
        </div>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center p-4">
        <div className="bg-[#1a1a1a] border border-white/10 rounded-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          <h2 className="font-serif text-2xl text-cream mb-2">Senha alterada!</h2>
          <p className="text-cream/60 text-sm">Você será redirecionado para o login em instantes...</p>
          <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mt-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-sm p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={24} className="text-gold" />
          </div>
          <h2 className="font-serif text-2xl text-cream mb-1">Nova senha</h2>
          <p className="text-cream/50 text-sm">Crie uma senha forte para sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-cream/40 uppercase tracking-wider mb-2">Nova senha</label>
            <div className="relative">
              <input
                type={mostrar ? 'text' : 'password'}
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required minLength={6}
                className="w-full bg-[#111] border border-white/10 text-cream placeholder-cream/30 px-4 py-3 text-sm focus:outline-none focus:border-gold/50 transition-colors rounded-sm pr-10"
              />
              <button type="button" onClick={() => setMostrar(!mostrar)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/40 hover:text-cream/70">
                {mostrar ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-cream/40 uppercase tracking-wider mb-2">Confirmar senha</label>
            <input
              type={mostrar ? 'text' : 'password'}
              value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
              placeholder="Digite novamente"
              required minLength={6}
              className="w-full bg-[#111] border border-white/10 text-cream placeholder-cream/30 px-4 py-3 text-sm focus:outline-none focus:border-gold/50 transition-colors rounded-sm"
            />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-gold hover:bg-gold-600 text-white py-3.5 font-semibold text-sm tracking-wider uppercase transition-colors disabled:opacity-50 rounded-sm">
            {loading ? 'Salvando...' : 'Alterar senha'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-charcoal" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
