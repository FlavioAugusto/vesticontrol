import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const LOJA_PADRAO = '00000000-0000-0000-0000-000000000001';

interface AdminRow {
  id: string;
  nome: string | null;
  nivel: string | null;
  foto_url?: string | null;
}

async function buscarAdmin(adminClient: ReturnType<typeof createAdmin>, userId: string): Promise<AdminRow | null> {
  // Tenta com foto_url
  const r1 = await adminClient.from('admins').select('id, nome, nivel, foto_url').eq('id', userId).maybeSingle();
  if (!r1.error && r1.data) return r1.data as AdminRow;
  // Fallback sem foto_url
  const r2 = await adminClient.from('admins').select('id, nome, nivel').eq('id', userId).maybeSingle();
  if (!r2.error && r2.data) return r2.data as AdminRow;
  return null;
}

// ─── GET — Carrega perfil atual ──────────────────────────────────────────────
export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const adminClient = createAdmin();
    const adminRow = await buscarAdmin(adminClient, user.id);

    return NextResponse.json({
      id: user.id,
      email: user.email,
      nome: adminRow?.nome ?? user.email?.split('@')[0] ?? 'Admin',
      nivel: adminRow?.nivel ?? 'admin',
      foto_url: adminRow?.foto_url ?? '',
      existe_no_banco: !!adminRow,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erro interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── POST — Salva perfil ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { nome, foto_url, nova_senha } = await req.json();
    if (!nome?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });

    const adminClient = createAdmin();

    // 1. Verifica se admin existe na tabela
    const existente = await buscarAdmin(adminClient, user.id);

    if (!existente) {
      // INSERT — admin não existe ainda, cria com loja padrão
      const insertData: Record<string, string> = {
        id: user.id,
        nome: nome.trim(),
        nivel: 'admin',
        loja_id: LOJA_PADRAO,
      };
      if (foto_url) insertData.foto_url = foto_url;

      let { error: insertErr } = await adminClient.from('admins').insert(insertData);

      // Se falhar por causa de foto_url, tenta sem
      if (insertErr && insertErr.message.includes('foto_url')) {
        delete insertData.foto_url;
        const r = await adminClient.from('admins').insert(insertData);
        insertErr = r.error;
      }
      // Se falhar por causa de loja_id, tenta sem
      if (insertErr && insertErr.message.includes('loja_id')) {
        delete insertData.loja_id;
        const r = await adminClient.from('admins').insert(insertData);
        insertErr = r.error;
      }

      if (insertErr) {
        return NextResponse.json({ error: 'Erro ao criar admin: ' + insertErr.message }, { status: 500 });
      }
    } else {
      // UPDATE nome
      const { error: nomeErr } = await adminClient
        .from('admins')
        .update({ nome: nome.trim() })
        .eq('id', user.id);

      if (nomeErr) {
        return NextResponse.json({ error: 'Erro ao salvar nome: ' + nomeErr.message }, { status: 500 });
      }

      // UPDATE foto_url separado (pode falhar se coluna não existe)
      if (foto_url !== undefined && foto_url !== null) {
        await adminClient
          .from('admins')
          .update({ foto_url } as Record<string, string>)
          .eq('id', user.id);
      }
    }

    // 2. Alterar senha se fornecida
    if (nova_senha && nova_senha.length >= 6) {
      const { error: senhaErr } = await adminClient.auth.admin.updateUserById(user.id, {
        password: nova_senha,
      });
      if (senhaErr) {
        return NextResponse.json({ error: 'Erro ao alterar senha: ' + senhaErr.message }, { status: 500 });
      }
    }

    // 3. Retornar dados atualizados (re-buscando para confirmar)
    const atualizado = await buscarAdmin(adminClient, user.id);

    return NextResponse.json({
      ok: true,
      perfil: {
        id: user.id,
        email: user.email,
        nome: atualizado?.nome ?? nome.trim(),
        nivel: atualizado?.nivel ?? 'admin',
        foto_url: atualizado?.foto_url ?? foto_url ?? '',
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erro interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
