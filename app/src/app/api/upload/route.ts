import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import sharp from 'sharp';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // aceita até 5MB de entrada (vai comprimir)
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const ALLOWED_FOLDERS = ['produtos', 'cores', 'site', 'logo', 'favicon', 'depoimentos', 'banners', 'categorias', 'admins'];
const BUCKET = 'imagens';

// Configurações de compressão por pasta
const COMPRESSION_PROFILES: Record<string, { maxWidth: number; quality: number }> = {
  produtos:    { maxWidth: 1200, quality: 80 }, // produto: até 1200px largura, q80
  cores:       { maxWidth: 600,  quality: 80 }, // foto cor: até 600px
  site:        { maxWidth: 1920, quality: 85 }, // banner: até 1920px (full HD)
  logo:        { maxWidth: 800,  quality: 90 }, // logo: até 800px, alta qualidade
  favicon:     { maxWidth: 64,   quality: 95 }, // favicon: 64x64 max, alta qualidade
  depoimentos: { maxWidth: 400,  quality: 80 }, // foto de cliente: pequena
  banners:     { maxWidth: 1920, quality: 85 }, // banner promocional
  categorias:  { maxWidth: 1600, quality: 85 }, // capa de categoria
  admins:      { maxWidth: 400,  quality: 85 }, // foto de perfil do admin
};

async function ensureBucket(supabase: ReturnType<typeof createClient>) {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_SIZE_BYTES,
      allowedMimeTypes: ALLOWED_TYPES,
    });
  }
}

/**
 * Comprime imagem usando Sharp:
 * - Redimensiona se largura > maxWidth (mantém proporção)
 * - Converte para WebP (melhor compressão que JPG/PNG)
 * - SVG e GIF: passa sem alterar (animação preservada)
 */
async function comprimirImagem(buffer: Buffer, mimeType: string, pasta: string): Promise<{ buffer: Buffer; type: string; ext: string }> {
  // SVG e GIF não são processados (manter original)
  if (mimeType === 'image/svg+xml') return { buffer, type: 'image/svg+xml', ext: 'svg' };
  if (mimeType === 'image/gif')     return { buffer, type: 'image/gif', ext: 'gif' };

  const profile = COMPRESSION_PROFILES[pasta] ?? COMPRESSION_PROFILES.produtos;

  const processed = await sharp(buffer)
    .rotate() // corrige orientação EXIF
    .resize({ width: profile.maxWidth, withoutEnlargement: true })
    .webp({ quality: profile.quality, effort: 4 })
    .toBuffer();

  return { buffer: processed, type: 'image/webp', ext: 'webp' };
}

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const { allowed } = rateLimit(`upload:${ip}`, { windowMs: 60_000, max: 20 });
  if (!allowed) {
    return NextResponse.json({ error: 'Muitos uploads. Aguarde 1 minuto.' }, { status: 429 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'Configuração incompleta: variáveis SUPABASE não definidas no servidor.' },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const pastaRaw = (formData.get('pasta') as string) || 'produtos';

    const pasta = pastaRaw.replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase();
    if (!ALLOWED_FOLDERS.includes(pasta)) {
      return NextResponse.json({ error: 'Pasta inválida' }, { status: 400 });
    }

    if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Formato inválido. Use JPG, PNG, WEBP ou GIF.' }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      return NextResponse.json({ error: `Arquivo muito grande: ${sizeMB}MB. Limite: 5MB.` }, { status: 400 });
    }

    const originalSize = file.size;
    const inputBuffer = Buffer.from(await file.arrayBuffer());

    // ─── Compressão ───
    const { buffer: compressedBuffer, type: compressedType, ext } = await comprimirImagem(
      inputBuffer,
      file.type,
      pasta
    );

    const compressedSize = compressedBuffer.byteLength;
    const economia = originalSize > 0 ? Math.round((1 - compressedSize / originalSize) * 100) : 0;

    const safeName = `${pasta}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const supabase = createClient();

    try {
      await ensureBucket(supabase);
    } catch (bucketErr) {
      const msg = bucketErr instanceof Error ? bucketErr.message : String(bucketErr);
      return NextResponse.json(
        { error: `Erro ao acessar Storage. Verifique SUPABASE_SERVICE_ROLE_KEY no servidor. Detalhe: ${msg}` },
        { status: 500 }
      );
    }

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(safeName, compressedBuffer, { contentType: compressedType, upsert: false });

    if (error) {
      return NextResponse.json({ error: `Erro no upload: ${error.message}` }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(safeName);

    return NextResponse.json({
      url: urlData.publicUrl,
      sizeMB: (compressedSize / 1024 / 1024).toFixed(2),
      original_kb: Math.round(originalSize / 1024),
      compressed_kb: Math.round(compressedSize / 1024),
      economia_pct: economia,
      formato: ext,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno';
    const userMsg = msg.toLowerCase().includes('fetch')
      ? 'Não foi possível conectar ao Supabase Storage. Verifique SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente do servidor.'
      : msg;
    return NextResponse.json({ error: userMsg }, { status: 500 });
  }
}
