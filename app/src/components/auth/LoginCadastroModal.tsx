'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useConfig } from '@/hooks/useConfig';

interface Props {
  onClose: () => void;
  onSucesso: () => void;
  redirectAfter?: string;
}

type Etapa = 'identificacao' | 'senha' | 'cadastro' | 'confirmacao';

export default function LoginCadastroModal({ onClose, onSucesso }: Props) {
  const config = useConfig();
  const logo = config?.logo ?? '/images/logo.svg';
  const nome = config?.nome ?? 'By Marcelo Medeiros';
  const [etapa, setEtapa] = useState<Etapa>('identificacao');
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [form, setForm] = useState({
    email: '', cpf: '', senha: '', confirmarSenha: '',
    nome: '', sobrenome: '', telefone: '',
  });
  const supabase = createClient();

  function set(k: keyof typeof form, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function verificarIdentificacao() {
    if (!form.email && !form.cpf) { toast.error('Informe e-mail ou CPF'); return; }
    setLoading(true);
    try {
      const identificador = form.email || form.cpf;
      const email = identificador.includes('@') ? identificador : null;

      if (email) {
        // Verificar se conta existe tentando recuperar senha (indiretamente)
        // Usamos signInWithPassword com senha errada para detectar se existe
        const { error } = await supabase.auth.signInWithPassword({ email, password: '___CHECK___' });
        if (error?.message?.includes('Invalid login credentials')) {
          // Conta existe mas senha errada → ir para login
          set('email', email);
          setEtapa('senha');
        } else {
          // Conta não existe → ir para cadastro
          set('email', email);
          setEtapa('cadastro');
        }
      } else {
        // CPF/CNPJ → buscar por CPF no banco
        const { data } = await supabase.from('clientes').select('id').eq('cpf', form.cpf.replace(/\D/g, '')).single();
        if (data) {
          toast.error('Use o e-mail cadastrado para fazer login');
        } else {
          setEtapa('cadastro');
        }
      }
    } finally { setLoading(false); }
  }

  async function fazerLogin() {
    if (!form.senha) { toast.error('Informe a senha'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.senha });
      if (error) { toast.error('Senha incorreta. Tente novamente.'); return; }
      toast.success('Login realizado com sucesso!');
      onSucesso();
    } finally { setLoading(false); }
  }

  async function fazerCadastro() {
    if (!form.nome || !form.email || !form.senha) { toast.error('Preencha todos os campos obrigatórios'); return; }
    if (form.senha !== form.confirmarSenha) { toast.error('Senhas não coincidem'); return; }
    if (form.senha.length < 8) { toast.error('Senha deve ter no mínimo 8 caracteres'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.senha,
        options: {
          data: { nome: form.nome, sobrenome: form.sobrenome },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) { toast.error(error.message); return; }
      if (data.user) {
        // Cria perfil com loja_id correto (detectado pelo middleware no servidor)
        await fetch('/api/clientes/criar-perfil', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: data.user.id,
            nome: form.nome,
            sobrenome: form.sobrenome,
            cpf: form.cpf.replace(/\D/g, '') || null,
            telefone: form.telefone || null,
            whatsapp: form.telefone || null,
            newsletter: true,
          }),
        }).catch(() => {});
        setEtapa('confirmacao');
        toast.success('Conta criada! Verifique seu e-mail para confirmar.');
      }
    } finally { setLoading(false); }
  }

  async function recuperarSenha() {
    if (!form.email) { toast.error('Informe o e-mail'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('E-mail de recuperação enviado!');
  }

  return (
    <div className="fixed inset-0 z-[60] bg-charcoal/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative bg-white w-full max-w-md rounded-sm shadow-2xl animate-zoom-in" onClick={(e) => e.stopPropagation()}>

        {/* Fechar */}
        <button onClick={onClose} className="absolute top-4 right-4 text-charcoal-muted hover:text-charcoal transition-colors z-10">
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center pt-8 pb-6 px-8 border-b border-cream-darker">
          <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
            <img src={logo} alt={nome} className="h-14 w-auto object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <h2 className="font-serif text-xl text-charcoal">
            {etapa === 'identificacao' && 'Acesse sua conta'}
            {etapa === 'senha' && 'Bem-vinda de volta!'}
            {etapa === 'cadastro' && 'Criar conta'}
            {etapa === 'confirmacao' && 'Verifique seu e-mail'}
          </h2>
          <p className="text-xs text-charcoal-muted mt-1">
            {etapa === 'identificacao' && 'Informe seu e-mail ou CPF para continuar'}
            {etapa === 'senha' && form.email}
            {etapa === 'cadastro' && 'Preencha seus dados para criar a conta'}
            {etapa === 'confirmacao' && `Enviamos um link de confirmação para ${form.email}`}
          </p>
        </div>

        {/* Conteúdo */}
        <div className="px-8 py-6 space-y-4">

          {/* ETAPA 1: Identificação */}
          {etapa === 'identificacao' && (
            <>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-muted" />
                <input
                  type="text"
                  placeholder="E-MAIL ou CPF/CNPJ"
                  value={form.email || form.cpf}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v.includes('@')) { set('email', v); set('cpf', ''); }
                    else { set('cpf', v); set('email', ''); }
                  }}
                  className="input-field pl-9 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && verificarIdentificacao()}
                />
              </div>
              <Button onClick={verificarIdentificacao} loading={loading} className="w-full">
                Continuar
              </Button>
            </>
          )}

          {/* ETAPA 2: Senha */}
          {etapa === 'senha' && (
            <>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-muted" />
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="Senha"
                  value={form.senha}
                  onChange={(e) => set('senha', e.target.value)}
                  className="input-field pl-9 pr-9 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && fazerLogin()}
                  autoFocus
                />
                <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-muted hover:text-charcoal">
                  {mostrarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <Button onClick={fazerLogin} loading={loading} className="w-full">Entrar</Button>
              <div className="flex justify-between text-xs">
                <button onClick={() => setEtapa('identificacao')} className="text-charcoal-muted hover:text-charcoal">← Voltar</button>
                <button onClick={recuperarSenha} className="text-gold hover:underline">Esqueci a senha</button>
              </div>
            </>
          )}

          {/* ETAPA 3: Cadastro */}
          {etapa === 'cadastro' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-muted" />
                  <input type="text" placeholder="Nome *" value={form.nome} onChange={(e) => set('nome', e.target.value)} className="input-field pl-9 text-sm" />
                </div>
                <input type="text" placeholder="Sobrenome" value={form.sobrenome} onChange={(e) => set('sobrenome', e.target.value)} className="input-field text-sm" />
              </div>
              <div className="relative">
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-muted" />
                <input type="email" placeholder="E-mail *" value={form.email} onChange={(e) => set('email', e.target.value)} className="input-field pl-9 text-sm" />
              </div>
              <div className="relative">
                <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-muted" />
                <input type="tel" placeholder="WhatsApp/Telefone" value={form.telefone} onChange={(e) => set('telefone', e.target.value)} className="input-field pl-9 text-sm" />
              </div>
              <div className="relative">
                <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-muted" />
                <input type={mostrarSenha ? 'text' : 'password'} placeholder="Senha (mín. 8 caracteres) *" value={form.senha} onChange={(e) => set('senha', e.target.value)} className="input-field pl-9 pr-9 text-sm" />
                <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-muted hover:text-charcoal">
                  {mostrarSenha ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              <input type="password" placeholder="Confirmar senha *" value={form.confirmarSenha} onChange={(e) => set('confirmarSenha', e.target.value)} className="input-field text-sm" />
              <Button onClick={fazerCadastro} loading={loading} className="w-full">Criar Conta</Button>
              <button onClick={() => setEtapa('identificacao')} className="text-xs text-charcoal-muted hover:text-charcoal w-full text-center">← Já tenho conta</button>
            </>
          )}

          {/* ETAPA 4: Confirmação */}
          {etapa === 'confirmacao' && (
            <div className="text-center py-4 space-y-3">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <Mail size={28} className="text-green-500" />
              </div>
              <p className="text-sm text-charcoal-muted leading-relaxed">
                Acesse seu e-mail <strong>{form.email}</strong> e clique no link de confirmação para ativar sua conta.
              </p>
              <p className="text-xs text-charcoal-muted">Não recebeu? Verifique a pasta de spam.</p>
              <Button onClick={onSucesso} variant="outline" className="w-full">Continuar comprando</Button>
            </div>
          )}
        </div>

        {/* Login/cadastro obrigatório — sem opção de pular */}
      </div>
    </div>
  );
}
