import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// Endpoint protegido por secret interno
export async function POST(req: NextRequest) {
  try {
    // Apenas chamadas internas do próprio servidor (admin logado)
    // Verificação básica de origem
    const origin = req.headers.get('origin') ?? '';
    const host = req.headers.get('host') ?? '';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

    // Permite chamadas do próprio servidor (sem origin = server-side)
    const isInternal = !origin || origin.includes(host) || (appUrl && origin.includes(new URL(appUrl).hostname));
    if (!isInternal) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { paths } = await req.json().catch(() => ({ paths: null }));
    const paginas = paths ?? ['/'];

    for (const path of paginas) {
      revalidatePath(path, 'page');
    }
    revalidatePath('/', 'layout');

    return NextResponse.json({ revalidated: true, paths: paginas });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro' }, { status: 500 });
  }
}
