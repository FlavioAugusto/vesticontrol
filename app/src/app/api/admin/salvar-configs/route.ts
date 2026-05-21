import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/admin';
import { createClient as createServer } from '@/lib/supabase/server';

const LOJA_DEFAULT = '00000000-0000-0000-0000-000000000001';

/**
 * Sistema single-tenant: TODOS os admins/super_admins gravam no MESMO loja_id.
 * Pega o loja_id do registro em `admins` se existir, senão usa LOJA_DEFAULT.
 * Sem validação contra a tabela `lojas` — não tem mais multi-tenant.
 */
async function pegarLojaId(): Promise<string> {
  try {
    const s = createServer();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return LOJA_DEFAULT;

    const a = createClient();
    const { data: admin } = await a.from('admins')
      .select('loja_id').eq('id', user.id).maybeSingle();

    return admin?.loja_id || LOJA_DEFAULT;
  } catch {
    return LOJA_DEFAULT;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const configs = body?.configs;

    if (!configs || typeof configs !== 'object') {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    const supabase = createClient();

    // Verificar conexão
    const { error: pingErr } = await supabase.from('configuracoes').select('chave').limit(1);
    if (pingErr) {
      return NextResponse.json({ error: `Conexão Supabase: ${pingErr.message}` }, { status: 503 });
    }

    const LOJA_ID = await pegarLojaId();

    // 🛡️ ANTI-SOBRESCRITA: ignora valores vazios pra NÃO apagar dados existentes no banco
    // Se o front mandar string vazia (ex: durante carregamento), o servidor preserva o valor antigo.
    // Pra LIMPAR um campo de fato, envia um espaço ' ' (que passa o filtro mas é tratado como vazio na UI).
    const entries = Object.entries(configs as Record<string, string>)
      .filter(([k, v]) => k && v !== undefined && v !== null && String(v).length > 0);

    const rows = entries.map(([chave, valor]) => ({
      chave: String(chave),
      loja_id: LOJA_ID,
      valor: String(valor),
      tipo: 'text',
      grupo: resolverGrupo(chave),
      updated_at: new Date().toISOString(),
    }));

    // Salvar em lotes de 5 com upsert na chave composta (chave, loja_id)
    for (let i = 0; i < rows.length; i += 5) {
      const batch = rows.slice(i, i + 5);
      const { error } = await supabase
        .from('configuracoes')
        .upsert(batch, { onConflict: 'chave,loja_id' });

      if (error) {
        return NextResponse.json({
          error: `Erro ao salvar lote ${i}-${i + 5}: ${error.message}`,
          code: error.code,
        }, { status: 500 });
      }
    }

    try {
      revalidatePath('/', 'layout');
    } catch { /* ignora se falhar */ }

    return NextResponse.json({ ok: true, total: rows.length, loja_id: LOJA_ID });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function resolverGrupo(chave: string): string {
  if (chave.startsWith('hero') || chave.startsWith('banner') || chave.startsWith('slide')) return 'hero';
  if (chave.startsWith('trust')) return 'trustbar';
  if (chave.startsWith('secao')) return 'secoes';
  if (chave.startsWith('quem')) return 'quemsomos';
  if (chave.startsWith('newsletter')) return 'newsletter';
  if (chave.startsWith('rodape')) return 'rodape';
  if (chave.startsWith('loja') || chave.startsWith('topbar')) return 'loja';
  if (chave.startsWith('modal')) return 'modais';
  if (chave.startsWith('depoimentos')) return 'depoimentos';
  if (chave.startsWith('pagamento') || chave.startsWith('mercado') || chave.startsWith('infinite') || chave.startsWith('gateway') || chave.startsWith('asaas') || chave.startsWith('pagarme') || chave.startsWith('parcelas')) return 'pagamento';
  if (chave.startsWith('frete') || chave.startsWith('melhor') || chave.startsWith('correios')) return 'frete';
  if (chave.startsWith('seo')) return 'seo';
  return 'geral';
}
