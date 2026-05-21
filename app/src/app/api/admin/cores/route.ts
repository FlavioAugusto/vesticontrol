import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';
import { createClient as createServer } from '@/lib/supabase/server';
import { headers } from 'next/headers';

const CHAVE = 'cores_personalizadas';
const LOJA_DEFAULT = '00000000-0000-0000-0000-000000000001';

/**
 * Resolve qual loja_id usar:
 * - Super admin: pode operar em qualquer loja (usa lojaId do request OU do domínio)
 * - Admin normal: só na própria loja (do registro em admins)
 */
async function resolverLojaId(lojaIdRequest?: string): Promise<{ lojaId: string; erro?: string }> {
  try {
    const s = createServer();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return { lojaId: LOJA_DEFAULT, erro: 'Não autenticado' };

    const a = createClient();
    const { data: sup } = await a.from('super_admins').select('id').eq('id', user.id).maybeSingle();
    const { data: admin } = await a.from('admins').select('loja_id').eq('id', user.id).maybeSingle();

    const lojaDoDominio = headers().get('x-loja-id') || LOJA_DEFAULT;
    const lojaSolicitada = lojaIdRequest || admin?.loja_id || lojaDoDominio;

    if (sup) {
      const { data: lojaExiste } = await a.from('lojas').select('id').eq('id', lojaSolicitada).maybeSingle();
      if (!lojaExiste) return { lojaId: LOJA_DEFAULT, erro: 'Loja não encontrada' };
      return { lojaId: lojaSolicitada };
    }

    if (!admin?.loja_id) return { lojaId: LOJA_DEFAULT, erro: 'Sem permissão' };
    if (lojaSolicitada !== admin.loja_id) {
      return { lojaId: admin.loja_id, erro: '⚠️ Sem permissão para essa loja' };
    }

    return { lojaId: admin.loja_id };
  } catch { return { lojaId: LOJA_DEFAULT }; }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const lojaIdRequest = url.searchParams.get('loja_id') || undefined;
    const { lojaId } = await resolverLojaId(lojaIdRequest);
    const supabase = createClient();
    const { data } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', CHAVE)
      .eq('loja_id', lojaId)
      .maybeSingle();
    const cores = data?.valor ? JSON.parse(data.valor) : [];
    return NextResponse.json(cores);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nome, hex, loja_id: lojaIdRequest } = body;
    if (!nome || !hex) return NextResponse.json({ error: 'Nome e hex obrigatórios' }, { status: 400 });

    const { lojaId, erro } = await resolverLojaId(lojaIdRequest);
    if (erro) return NextResponse.json({ error: erro }, { status: 403 });

    const supabase = createClient();

    const { data } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', CHAVE)
      .eq('loja_id', lojaId)
      .maybeSingle();

    const cores: { nome: string; hex: string }[] = data?.valor ? JSON.parse(data.valor) : [];
    if (cores.some(c => c.nome.toLowerCase() === nome.toLowerCase())) {
      return NextResponse.json({ error: 'Cor já existe nesta loja' }, { status: 409 });
    }
    cores.push({ nome: nome.trim(), hex });

    const { error } = await supabase.from('configuracoes').upsert({
      chave: CHAVE,
      loja_id: lojaId,
      valor: JSON.stringify(cores),
      tipo: 'text',
      grupo: 'cores',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'chave,loja_id' });

    if (error) return NextResponse.json({ error: `Erro ao salvar: ${error.message}` }, { status: 500 });
    return NextResponse.json({ ok: true, cores });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { nome, loja_id: lojaIdRequest } = body;
    const { lojaId, erro } = await resolverLojaId(lojaIdRequest);
    if (erro) return NextResponse.json({ error: erro }, { status: 403 });

    const supabase = createClient();
    const { data } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', CHAVE)
      .eq('loja_id', lojaId)
      .maybeSingle();

    const cores: { nome: string; hex: string }[] = data?.valor ? JSON.parse(data.valor) : [];
    const updated = cores.filter(c => c.nome !== nome);

    const { error } = await supabase.from('configuracoes').upsert({
      chave: CHAVE,
      loja_id: lojaId,
      valor: JSON.stringify(updated),
      tipo: 'text',
      grupo: 'cores',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'chave,loja_id' });

    if (error) return NextResponse.json({ error: `Erro ao salvar: ${error.message}` }, { status: 500 });
    return NextResponse.json({ ok: true, cores: updated });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro' }, { status: 500 });
  }
}
