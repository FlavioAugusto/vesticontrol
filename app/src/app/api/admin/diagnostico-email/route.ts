import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@/lib/supabase/admin';

/**
 * Endpoint de diagnóstico do sistema de email.
 * Só admins logados podem acessar.
 *
 * GET → mostra status atual da configuração
 * POST → envia email de teste pro próprio admin
 */

async function isLoggedAdmin(): Promise<{ email: string } | null> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const admin = createAdmin();
    const { data } = await admin.from('admins').select('id').eq('id', user.id).maybeSingle();
    if (!data) {
      const { data: sa } = await admin.from('super_admins').select('id').eq('id', user.id).maybeSingle();
      if (!sa) return null;
    }
    return { email: user.email ?? '' };
  } catch { return null; }
}

export async function GET() {
  const adm = await isLoggedAdmin();
  if (!adm) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const resendKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const config = {
    resend_configurado: !!resendKey,
    resend_key_preview: resendKey ? `${resendKey.slice(0, 6)}...${resendKey.slice(-4)}` : null,
    email_from: emailFrom ?? '(não configurado)',
    app_url: appUrl ?? '(não configurado)',
    admin_logado: adm.email,
  };

  // Se Resend está configurado, verifica se a key é válida e quais domínios estão verificados
  let resendStatus: Record<string, unknown> = { configurado: false };
  if (resendKey) {
    try {
      const r = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${resendKey}` },
        cache: 'no-store',
      });
      if (r.ok) {
        const data = await r.json();
        resendStatus = {
          configurado: true,
          api_key_valida: true,
          dominios: (data.data ?? []).map((d: { name: string; status: string; region: string }) => ({
            nome: d.name,
            status: d.status,
            regiao: d.region,
          })),
        };
      } else if (r.status === 401) {
        resendStatus = { configurado: true, api_key_valida: false, erro: 'API Key inválida' };
      } else {
        resendStatus = { configurado: true, erro: `HTTP ${r.status}` };
      }
    } catch (e) {
      resendStatus = { configurado: true, erro: e instanceof Error ? e.message : 'Erro de rede' };
    }
  }

  return NextResponse.json({ config, resend: resendStatus });
}

export async function POST(req: NextRequest) {
  const adm = await isLoggedAdmin();
  if (!adm) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const { para } = await req.json().catch(() => ({}));
  const destino = para || adm.email;
  if (!destino) return NextResponse.json({ error: 'Email não informado' }, { status: 400 });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY não configurado no servidor' }, { status: 500 });
  }
  const fromEmail = process.env.EMAIL_FROM ?? 'noreply@bymarcelomedeiros.com.br';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `By Marcelo Medeiros <${fromEmail}>`,
        to: destino,
        subject: '✅ Teste de Email - By Marcelo Medeiros',
        html: `<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:32px;background:#f4efe8">
          <div style="background:#1e1a16;color:#b89155;text-align:center;padding:24px;letter-spacing:3px">BY MARCELO MEDEIROS</div>
          <div style="background:white;padding:32px;text-align:center">
            <h1 style="color:#1e1a16;font-size:22px">✅ Email funcionando!</h1>
            <p style="color:#666;font-size:14px;line-height:1.6">
              Se você está lendo isso, o sistema de envio de emails<br/>
              está <strong>funcionando perfeitamente</strong>.
            </p>
            <p style="color:#999;font-size:12px;margin-top:24px">
              Enviado de: ${fromEmail}<br/>
              Data: ${new Date().toLocaleString('pt-BR')}
            </p>
          </div>
        </div>`,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({
        ok: false,
        status: res.status,
        erro: data.message ?? data.error ?? 'Erro desconhecido',
        detalhes: data,
      }, { status: res.status });
    }

    return NextResponse.json({
      ok: true,
      mensagem: `Email de teste enviado para ${destino}!`,
      resend_id: data.id,
      proximo_passo: 'Verifique sua caixa de entrada (e spam) em até 1 minuto.',
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro' }, { status: 500 });
  }
}
