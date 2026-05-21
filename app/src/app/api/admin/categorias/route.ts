import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';
import { createClient as createServer } from '@/lib/supabase/server';

const LOJA_DEFAULT = '00000000-0000-0000-0000-000000000001';

async function getLojaIdDoAdmin(): Promise<string> {
  try {
    const s = createServer();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return LOJA_DEFAULT;
    const a = createClient();
    const { data } = await a.from('admins').select('loja_id').eq('id', user.id).maybeSingle();
    return data?.loja_id || LOJA_DEFAULT;
  } catch { return LOJA_DEFAULT; }
}

function slugify(s: string) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET() {
  try {
    const lojaId = await getLojaIdDoAdmin();
    const supabase = createClient();
    const { data, error } = await supabase
      .from('categorias')
      .select('id, nome, slug, descricao, imagem_url, ativo, ordem')
      .eq('loja_id', lojaId)
      .order('ordem');
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { nome, descricao, imagem_url } = await req.json();
    if (!nome?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });

    const lojaId = await getLojaIdDoAdmin();
    const supabase = createClient();

    const slug = slugify(nome);

    // Verifica slug duplicado DENTRO da mesma loja
    const { data: existente } = await supabase
      .from('categorias').select('id').eq('slug', slug).eq('loja_id', lojaId).maybeSingle();
    if (existente) {
      return NextResponse.json({ error: 'Já existe uma categoria com esse nome nesta loja' }, { status: 409 });
    }

    const { count } = await supabase.from('categorias')
      .select('*', { count: 'exact', head: true }).eq('loja_id', lojaId);

    const { data, error } = await supabase.from('categorias').insert({
      nome: nome.trim(),
      slug,
      descricao: descricao ?? null,
      imagem_url: imagem_url ?? null,
      ativo: true,
      ordem: (count ?? 0) + 1,
      loja_id: lojaId,
    }).select().single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erro ao criar categoria' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, nome, descricao, imagem_url, ativo, ordem } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    const lojaId = await getLojaIdDoAdmin();
    const supabase = createClient();
    const update: Record<string, unknown> = {};
    if (nome !== undefined) { update.nome = nome.trim(); update.slug = slugify(nome); }
    if (descricao !== undefined) update.descricao = descricao;
    if (imagem_url !== undefined) update.imagem_url = imagem_url;
    if (ativo !== undefined) update.ativo = ativo;
    if (ordem !== undefined) update.ordem = ordem;

    // Só atualiza se a categoria for da loja do admin
    const { data, error } = await supabase.from('categorias')
      .update(update).eq('id', id).eq('loja_id', lojaId).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    const lojaId = await getLojaIdDoAdmin();
    const supabase = createClient();

    const { count } = await supabase.from('produtos')
      .select('*', { count: 'exact', head: true }).eq('categoria_id', id).eq('loja_id', lojaId);
    if ((count ?? 0) > 0) {
      return NextResponse.json({ error: `Não pode excluir: ${count} produto(s) usam esta categoria` }, { status: 409 });
    }

    const { error } = await supabase.from('categorias').delete().eq('id', id).eq('loja_id', lojaId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
