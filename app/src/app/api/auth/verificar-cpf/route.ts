import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';
import { rateLimit, getClientIP } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  // Rate limit: 5 tentativas por minuto por IP
  const ip = getClientIP(req);
  const { allowed, remaining } = rateLimit(`cpf-lookup:${ip}`, { windowMs: 60_000, max: 5 });

  if (!allowed) {
    return NextResponse.json(
      { encontrado: false, erro: 'Muitas tentativas. Aguarde 1 minuto.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  try {
    const body = await req.json();
    const cpf = body?.cpf;
    if (!cpf) return NextResponse.json({ encontrado: false });

    // Sanitizar: apenas dígitos, exatamente 11 (CPF) ou 14 (CNPJ)
    const cpfLimpo = String(cpf).replace(/\D/g, '');
    if (cpfLimpo.length !== 11 && cpfLimpo.length !== 14) {
      return NextResponse.json({ encontrado: false });
    }

    const supabase = createClient();
    const { data: cliente } = await supabase
      .from('clientes')
      .select('id')
      .eq('cpf', cpfLimpo)
      .single();

    if (!cliente) return NextResponse.json({ encontrado: false });

    const { data: userData } = await supabase.auth.admin.getUserById(cliente.id);
    if (!userData?.user?.email) return NextResponse.json({ encontrado: false });

    const email = userData.user.email;
    const [local, domain] = email.split('@');
    const emailMascarado = `${local[0]}${'*'.repeat(Math.max(local.length - 2, 2))}${local[local.length - 1]}@${domain}`;

    return NextResponse.json({ encontrado: true, email, emailMascarado });
  } catch {
    return NextResponse.json({ encontrado: false });
  }
}
