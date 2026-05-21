import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';
import { sanitizeEmail, rateLimit, getClientIP } from '@/lib/security';
import { headers } from 'next/headers';

const LOJA_DEFAULT_ID = '00000000-0000-0000-0000-000000000001';

/** Busca configs (nome, logo) da loja do request atual */
async function getLojaInfo() {
  try {
    const h = headers();
    const lojaId = h.get('x-loja-id') || LOJA_DEFAULT_ID;
    const host = h.get('host') || '';
    const supabase = createClient();
    const { data: loja } = await supabase
      .from('lojas').select('nome, dominio, slug').eq('id', lojaId).maybeSingle();
    const { data: configs } = await supabase
      .from('configuracoes').select('chave, valor').eq('loja_id', lojaId);
    const c: Record<string, string> = {};
    (configs ?? []).forEach((r: { chave: string; valor: string | null }) => {
      if (r.valor) c[r.chave] = r.valor;
    });
    return {
      lojaId,
      nomeLoja: loja?.nome || c.loja_nome || 'Sua Loja',
      logoUrl: c.loja_logo_url || '',
      dominio: loja?.dominio || host,
      rodapeCredito: c.rodape_credito || '',
    };
  } catch {
    return { lojaId: LOJA_DEFAULT_ID, nomeLoja: 'Sua Loja', logoUrl: '', dominio: '', rodapeCredito: '' };
  }
}

/**
 * API robusta de recuperação de senha.
 * Tenta enviar via:
 * 1. Supabase Auth (padrão)
 * 2. Resend (se RESEND_API_KEY estiver configurado) — fallback mais confiável
 *
 * Em ambos os casos, gera um link válido para reset.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req);
    const limit = rateLimit(`reset-pwd:${ip}`, { max: 5, windowMs: 15 * 60_000 });
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Muitas tentativas. Aguarde 15 minutos.' }, { status: 429 });
    }

    const { email: emailRaw, tipo } = await req.json();
    const email = sanitizeEmail(emailRaw);
    if (!email) return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 });

    // tipo: 'super_admin' | 'admin' | undefined (cliente comum)
    const tipoValido = tipo === 'super_admin' || tipo === 'admin' ? tipo : null;

    const supabase = createClient();

    // Verifica se o usuário existe — busca paginada (listUsers tem limite por página)
    let user: { id: string; email?: string } | null = null;
    let page = 1;
    const perPage = 1000;
    while (page <= 20) { // até 20.000 usuários
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
      if (error) break;
      const found = data?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (found) { user = found; break; }
      if (!data?.users || data.users.length < perPage) break; // última página
      page++;
    }

    if (!user) {
      return NextResponse.json({
        error: 'Este e-mail não está cadastrado em nosso sistema.',
        code: 'USER_NOT_FOUND',
      }, { status: 404 });
    }

    // Se for tipo super_admin ou admin, valida se o usuário tem esse nível
    if (tipoValido === 'super_admin') {
      const { data: sa } = await supabase.from('super_admins').select('id').eq('id', user.id).maybeSingle();
      if (!sa) {
        return NextResponse.json({
          error: 'Este e-mail não tem acesso de Super Admin.',
          code: 'NOT_SUPER_ADMIN',
        }, { status: 403 });
      }
    } else if (tipoValido === 'admin') {
      const { data: ad } = await supabase.from('admins').select('id').eq('id', user.id).maybeSingle();
      if (!ad) {
        return NextResponse.json({
          error: 'Este e-mail não tem acesso de Admin.',
          code: 'NOT_ADMIN',
        }, { status: 403 });
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
    const redirectTo = `${appUrl}/auth/reset`;

    // Gera link mágico de reset via Admin API (sempre funciona)
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    });

    if (linkErr || !linkData?.properties?.action_link) {
      return NextResponse.json({ error: 'Erro ao gerar link de recuperação' }, { status: 500 });
    }

    const resetLink = linkData.properties.action_link;

    // Busca infos da loja pra branding do email
    const lojaInfo = await getLojaInfo();

    // Tenta enviar via Resend (se configurado)
    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM ?? 'noreply@bymarcelomedeiros.com.br';

    if (resendKey) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${lojaInfo.nomeLoja} <${fromEmail}>`,
            to: email,
            subject: `Recuperar sua senha — ${lojaInfo.nomeLoja}`,
            html: emailHTML(resetLink, lojaInfo),
          }),
        });

        if (resendRes.ok) {
          return NextResponse.json({ ok: true, mensagem: 'E-mail enviado!', provider: 'resend' });
        }
      } catch { /* cai pro fallback abaixo */ }
    }

    // Fallback: deixa o Supabase enviar (pode falhar no plano Free)
    const { error: supaErr } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (supaErr) {
      return NextResponse.json({
        error: 'Não foi possível enviar o e-mail. Tente novamente em alguns minutos ou entre em contato.',
      }, { status: 500 });
    }

    return NextResponse.json({ ok: true, mensagem: 'E-mail enviado!', provider: 'supabase' });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro interno' }, { status: 500 });
  }
}

function emailHTML(resetLink: string, loja: { nomeLoja: string; logoUrl: string; rodapeCredito: string }): string {
  const headerLogo = loja.logoUrl
    ? `<img src="${loja.logoUrl}" alt="${loja.nomeLoja}" style="max-height:60px;max-width:200px;margin:0 auto;display:block" />`
    : `<h1 style="color:#b89155;margin:0;font-family:'Playfair Display',serif;font-size:24px;letter-spacing:3px">${loja.nomeLoja.toUpperCase()}</h1>`;
  const ano = new Date().getFullYear();
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4efe8">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe8;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
        <tr>
          <td style="background:#1e1a16;padding:32px;text-align:center">
            ${headerLogo}
          </td>
        </tr>
        <tr>
          <td style="padding:40px 32px">
            <h2 style="color:#1e1a16;font-size:22px;margin:0 0 16px">Recuperar sua senha</h2>
            <p style="color:#666;font-size:15px;line-height:1.6;margin:0 0 24px">
              Recebemos uma solicitação para redefinir a senha da sua conta em <strong>${loja.nomeLoja}</strong>.<br/>
              Clique no botão abaixo para criar uma nova senha:
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:24px 0">
              <tr><td style="border-radius:4px;background:#b89155">
                <a href="${resetLink}" style="display:inline-block;padding:14px 32px;color:#fff;text-decoration:none;font-weight:600;letter-spacing:1px;font-size:14px;text-transform:uppercase">
                  REDEFINIR SENHA
                </a>
              </td></tr>
            </table>
            <p style="color:#999;font-size:13px;line-height:1.6;margin:24px 0 0">
              Ou copie e cole este link no navegador:<br/>
              <a href="${resetLink}" style="color:#b89155;word-break:break-all;font-size:12px">${resetLink}</a>
            </p>
            <p style="color:#999;font-size:12px;margin-top:32px;border-top:1px solid #eee;padding-top:24px">
              ⏰ Este link expira em <strong>1 hora</strong>.<br/>
              🔒 Se você não solicitou, ignore este e-mail — sua senha continua segura.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9f6f1;padding:20px;text-align:center;color:#999;font-size:12px">
            © ${ano} ${loja.nomeLoja}${loja.rodapeCredito ? ` · ${loja.rodapeCredito}` : ''}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
