import { NextResponse } from 'next/server';
import { createClient as createServer } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@/lib/supabase/admin';

/**
 * Debug endpoint — diagnóstico de acesso ao /admin.
 * Mostra exatamente o que o middleware vê.
 */
export async function GET() {
  try {
    const server = createServer();
    const { data: { user }, error: userErr } = await server.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({
        diagnostico: '❌ Não está logado',
        user_error: userErr?.message,
      }, { headers: { 'Cache-Control': 'no-store' } });
    }

    const admin = createAdmin();

    // Verifica se está em admins
    const { data: adminRow, error: adminErr } = await admin
      .from('admins')
      .select('id, nome, nivel, loja_id')
      .eq('id', user.id)
      .maybeSingle();

    // Verifica se está em super_admins
    const { data: superRow } = await admin
      .from('super_admins')
      .select('id, nome')
      .eq('id', user.id)
      .maybeSingle();

    // Lista TODOS admins (pra ver se tem algum)
    const { data: todosAdmins } = await admin
      .from('admins').select('id').limit(5);

    // Lista TODOS super_admins
    const { data: todosSuper } = await admin
      .from('super_admins').select('id').limit(5);

    // Tenta via REST API (igual o middleware faz)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    let middlewareSimulation: unknown = null;
    let middlewareError: string | null = null;
    try {
      const r = await fetch(
        `${supaUrl}/rest/v1/admins?id=eq.${user.id}&select=id,nivel&limit=1`,
        { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
      );
      middlewareSimulation = {
        status: r.status,
        body: r.ok ? await r.json() : await r.text(),
      };
    } catch (e) {
      middlewareError = e instanceof Error ? e.message : 'erro';
    }

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      eh_admin: !!adminRow,
      admin_row: adminRow,
      admin_error: adminErr?.message,
      eh_super_admin: !!superRow,
      super_row: superRow,
      contadores: {
        total_admins: todosAdmins?.length ?? 0,
        total_super_admins: todosSuper?.length ?? 0,
      },
      simulacao_middleware: middlewareSimulation,
      middleware_error: middlewareError,
      env: {
        has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      },
      diagnostico: !adminRow
        ? '❌ Usuário NÃO está na tabela `admins` — por isso /admin retorna acesso negado.'
        : '✅ Usuário ESTÁ em admins — middleware deveria permitir acesso',
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : 'erro',
    }, { status: 500 });
  }
}
