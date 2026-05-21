'use client';

import { useState, useEffect } from 'react';
import { Mail, CheckCircle, XCircle, AlertTriangle, Send, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface DiagResult {
  config: {
    resend_configurado: boolean;
    resend_key_preview: string | null;
    email_from: string;
    app_url: string;
    admin_logado: string;
  };
  resend: {
    configurado: boolean;
    api_key_valida?: boolean;
    dominios?: Array<{ nome: string; status: string; regiao: string }>;
    erro?: string;
  };
}

export default function DiagnosticoEmailPage() {
  const [diag, setDiag] = useState<DiagResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [emailTeste, setEmailTeste] = useState('');
  const [resultadoEnvio, setResultadoEnvio] = useState<Record<string, unknown> | null>(null);

  useEffect(() => { verificar(); }, []);

  async function verificar() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/diagnostico-email', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDiag(data);
      setEmailTeste(data.config.admin_logado);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao verificar');
    } finally { setLoading(false); }
  }

  async function enviarTeste() {
    if (!emailTeste) { toast.error('Informe um email'); return; }
    setEnviando(true);
    setResultadoEnvio(null);
    try {
      const res = await fetch('/api/admin/diagnostico-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ para: emailTeste }),
      });
      const data = await res.json();
      setResultadoEnvio(data);
      if (res.ok) toast.success('Email enviado! Verifique sua caixa de entrada.');
      else toast.error(data.erro ?? data.error ?? 'Erro ao enviar');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro');
    } finally { setEnviando(false); }
  }

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-2" />
        <p className="text-gray-400 text-sm">Verificando configuração...</p>
      </div>
    );
  }

  if (!diag) return <p className="text-red-500">Erro ao carregar diagnóstico</p>;

  const allOk = diag.config.resend_configurado &&
                diag.resend.api_key_valida &&
                (diag.resend.dominios?.some(d => d.status === 'verified') ?? false);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif text-charcoal">Diagnóstico de Email</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">Verifique se o sistema de envio está funcionando</p>
        </div>
        <button onClick={verificar} className="text-xs bg-gray-100 text-charcoal px-3 py-2 rounded-lg flex items-center gap-1.5 hover:bg-gray-200">
          <RefreshCw size={12} /> Atualizar
        </button>
      </div>

      {/* Status geral */}
      <div className={`rounded-2xl p-5 mb-5 ${allOk ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
        <div className="flex items-center gap-3 mb-2">
          {allOk
            ? <CheckCircle size={24} className="text-emerald-600" />
            : <AlertTriangle size={24} className="text-amber-600" />}
          <h2 className={`font-semibold text-lg ${allOk ? 'text-emerald-800' : 'text-amber-800'}`}>
            {allOk ? 'Tudo certo! Sistema operacional' : 'Atenção: precisa configurar'}
          </h2>
        </div>
        <p className={`text-sm ${allOk ? 'text-emerald-700' : 'text-amber-700'}`}>
          {allOk
            ? 'Você pode enviar um email de teste abaixo para confirmar.'
            : 'Veja os itens em vermelho abaixo e configure no EasyPanel.'}
        </p>
      </div>

      {/* Configurações */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-5 shadow-sm">
        <h3 className="font-semibold text-charcoal mb-4 text-sm">Variáveis de Ambiente</h3>
        <div className="space-y-2.5 text-sm">
          <Item label="RESEND_API_KEY"
            ok={diag.config.resend_configurado}
            valor={diag.config.resend_key_preview ?? '❌ Não configurado'}
            dica="Configure no EasyPanel → Environment" />
          <Item label="EMAIL_FROM"
            ok={diag.config.email_from !== '(não configurado)'}
            valor={diag.config.email_from}
            dica="Email do remetente (precisa do domínio verificado no Resend)" />
          <Item label="NEXT_PUBLIC_APP_URL"
            ok={diag.config.app_url !== '(não configurado)'}
            valor={diag.config.app_url} />
        </div>
      </div>

      {/* Status Resend */}
      {diag.config.resend_configurado && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-5 shadow-sm">
          <h3 className="font-semibold text-charcoal mb-4 text-sm">Resend API</h3>
          {diag.resend.api_key_valida === false ? (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <XCircle size={16} /> API Key inválida. Verifique no EasyPanel.
            </div>
          ) : diag.resend.erro ? (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <XCircle size={16} /> {diag.resend.erro}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-emerald-600 text-sm mb-3">
                <CheckCircle size={16} /> API Key válida ✓
              </div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Domínios cadastrados</p>
              {diag.resend.dominios && diag.resend.dominios.length > 0 ? (
                <div className="space-y-2">
                  {diag.resend.dominios.map(d => (
                    <div key={d.nome} className={`flex items-center justify-between p-3 rounded-lg ${d.status === 'verified' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                      <div>
                        <p className="font-mono text-sm font-semibold text-charcoal">{d.nome}</p>
                        <p className="text-[11px] text-gray-500">Região: {d.regiao}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${d.status === 'verified' ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'}`}>
                        {d.status === 'verified' ? '✓ Verificado' : `⏳ ${d.status}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                  ⚠️ Nenhum domínio cadastrado. Adicione <strong>bymarcelomedeiros.com.br</strong> no Resend → Domains.
                  <br />
                  <span className="text-[11px] mt-1 block">Sem domínio verificado, só consegue enviar para o email da conta do Resend (modo sandbox).</span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Teste de envio */}
      {diag.config.resend_configurado && diag.resend.api_key_valida !== false && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-charcoal mb-3 text-sm">Enviar email de teste</h3>
          <div className="flex gap-2">
            <input type="email" value={emailTeste} onChange={e => setEmailTeste(e.target.value)}
              placeholder="seu@email.com"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold/50" />
            <button onClick={enviarTeste} disabled={enviando}
              className="bg-gold text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gold-600 transition-all disabled:opacity-50 flex items-center gap-2">
              {enviando ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enviando...</> : <><Send size={13} /> Testar</>}
            </button>
          </div>

          {resultadoEnvio && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${resultadoEnvio.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
              {resultadoEnvio.ok ? (
                <>
                  <p className="font-semibold mb-1">✅ {resultadoEnvio.mensagem as string}</p>
                  <p className="text-xs">{resultadoEnvio.proximo_passo as string}</p>
                  <p className="text-[10px] text-gray-500 mt-1 font-mono">ID: {resultadoEnvio.resend_id as string}</p>
                </>
              ) : (
                <>
                  <p className="font-semibold mb-1">❌ Falha no envio</p>
                  <p className="text-xs">{(resultadoEnvio.erro as string) ?? 'Erro desconhecido'}</p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Item({ label, ok, valor, dica }: { label: string; ok: boolean; valor: string; dica?: string }) {
  return (
    <div className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0">
      {ok
        ? <CheckCircle size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
        : <XCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="font-mono text-xs text-charcoal break-all">{valor}</p>
        {!ok && dica && <p className="text-[11px] text-gray-500 mt-1">{dica}</p>}
      </div>
    </div>
  );
}
