'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star, Play, Quote, Volume2, Pause } from 'lucide-react';

export interface Depoimento {
  id: string;
  nome: string;
  cidade: string;
  foto_url?: string;     // Foto de perfil da cliente (avatar redondo)
  texto: string;
  nota: number;
  video_url?: string;    // YouTube URL ou arquivo de vídeo direto
  audio_url?: string;    // Arquivo de áudio (.mp3, .m4a, etc.)
  imagem_url?: string;   // Imagem do depoimento (print, foto com produto, story Instagram)
  imagem_alt?: string;   // Descrição da imagem para acessibilidade
  produto?: string;
  ativo: boolean;
}

const DEPOIMENTOS_PADRAO: Depoimento[] = [
  { id: '1', nome: 'Ana Paula Mendonça', cidade: 'Recife, PE', nota: 5, texto: 'Amei demais o vestido! A qualidade é incrível, o tecido é super macio e o caimento é perfeito. Chegou antes do prazo e a embalagem estava impecável. Já fiz meu segundo pedido!', produto: 'Conjunto Elegância Dourada', foto_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&q=85', ativo: true },
  { id: '2', nome: 'Carla Ferreira', cidade: 'São Paulo, SP', nota: 5, texto: 'O vestido midi é simplesmente perfeito! Usei no casamento da minha irmã e recebi elogios do começo ao fim. A qualidade da Sua Loja Medeiros é de outro nível. Super recomendo!', produto: 'Vestido Midi Cetim Noturno', foto_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop&q=85', ativo: true },
  { id: '3', nome: 'Juliana Santos', cidade: 'Brasília, DF', nota: 5, texto: 'Já é a terceira compra e nunca decepcionou. O atendimento é excelente e os produtos são de altíssima qualidade. O conjunto ficou ainda mais lindo do que nas fotos!', produto: 'Conjunto Seda Rosê', foto_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&q=85', ativo: true },
  { id: '4', nome: 'Fernanda Lima', cidade: 'Fortaleza, CE', nota: 5, texto: 'Perfeito para o evento que precisava! O vestido longo é lindo, elegante e confortável. Frete chegou super rápido. Com certeza vou comprar mais vezes!', produto: 'Vestido Longo Gala Suprema', foto_url: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop&q=85', ativo: true },
  { id: '5', nome: 'Marina Costa', cidade: 'Rio de Janeiro, RJ', nota: 5, texto: 'Que marca incrível! As peças são de uma qualidade que você só encontra em lojas de luxo, mas com um preço justo. Vou indicar para todas as minhas amigas!', produto: 'Vestido Midi Floral Encanto', foto_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&q=85', ativo: true },
];

function Stars({ nota }: { nota: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={14} className={i < nota ? 'fill-gold text-gold' : 'text-gray-200'} />
      ))}
    </div>
  );
}

function getYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return m ? m[1] : null;
}

function isDirectVideo(url: string): boolean {
  return /\.(mp4|mov|webm|ogg)(\?|$)/i.test(url);
}

// ─── Card de Áudio ───────────────────────────────────────────────────────────
function AudioCard({ d }: { d: Depoimento }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  function toggle() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  }

  function onTimeUpdate() {
    const el = audioRef.current;
    if (!el || !el.duration) return;
    setProgress((el.currentTime / el.duration) * 100);
  }

  function onEnded() {
    setPlaying(false);
    setProgress(0);
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const el = audioRef.current;
    if (!el) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    el.currentTime = pct * el.duration;
  }

  return (
    <div className="bg-gray-50 p-6 relative flex flex-col">
      <Quote size={40} className="absolute top-4 right-4 text-gray-100" />

      <div className="flex items-center gap-3 mb-4">
        {d.foto_url ? (
          <img src={d.foto_url} alt={d.nome} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
            <span className="text-gold font-bold text-lg">{d.nome[0]}</span>
          </div>
        )}
        <div>
          <p className="font-sans font-semibold text-sm text-charcoal">{d.nome}</p>
          <p className="text-[11px] text-charcoal-muted">{d.cidade}</p>
        </div>
      </div>

      <Stars nota={d.nota} />

      <p className="text-sm text-charcoal-muted mt-3 leading-relaxed italic flex-1">&ldquo;{d.texto}&rdquo;</p>

      {d.produto && (
        <p className="text-[10px] text-gold mt-3 font-semibold uppercase tracking-wider">Produto: {d.produto}</p>
      )}

      {/* Player de áudio */}
      <div className="mt-4 bg-white border border-cream-darker rounded-lg p-3">
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="w-9 h-9 rounded-full bg-gold flex items-center justify-center shrink-0 hover:bg-gold/80 transition-colors"
          >
            {playing
              ? <Pause size={14} className="text-white" />
              : <Play size={14} className="text-white fill-white ml-0.5" />}
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Volume2 size={11} className="text-charcoal-muted" />
              <span className="text-[10px] text-charcoal-muted font-semibold uppercase tracking-wider">Depoimento em áudio</span>
            </div>
            <div
              className="w-full h-1.5 bg-cream-darker rounded-full cursor-pointer overflow-hidden"
              onClick={seek}
            >
              <div
                className="h-full bg-gold rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
        <audio
          ref={audioRef}
          src={d.audio_url}
          onTimeUpdate={onTimeUpdate}
          onEnded={onEnded}
          className="hidden"
        />
      </div>
    </div>
  );
}

// ─── Card de Vídeo ───────────────────────────────────────────────────────────
function VideoCard({ d, onPlay }: { d: Depoimento; onPlay: (url: string) => void }) {
  const ytId = d.video_url ? getYoutubeId(d.video_url) : null;
  const isDirect = d.video_url ? isDirectVideo(d.video_url) : false;
  const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

  return (
    <div className="bg-gray-50 p-6 relative flex flex-col">
      <Quote size={40} className="absolute top-4 right-4 text-gray-100" />

      <div className="flex items-center gap-3 mb-4">
        {d.foto_url ? (
          <img src={d.foto_url} alt={d.nome} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
            <span className="text-gold font-bold text-lg">{d.nome[0]}</span>
          </div>
        )}
        <div>
          <p className="font-sans font-semibold text-sm text-charcoal">{d.nome}</p>
          <p className="text-[11px] text-charcoal-muted">{d.cidade}</p>
        </div>
      </div>

      <Stars nota={d.nota} />

      {d.texto && (
        <p className="text-sm text-charcoal-muted mt-3 leading-relaxed italic">&ldquo;{d.texto}&rdquo;</p>
      )}

      {d.produto && (
        <p className="text-[10px] text-gold mt-3 font-semibold uppercase tracking-wider">Produto: {d.produto}</p>
      )}

      {/* Thumbnail do vídeo */}
      <button
        onClick={() => onPlay(d.video_url!)}
        className="mt-4 relative w-full overflow-hidden rounded-lg group"
      >
        {thumb ? (
          <img src={thumb} alt="Thumbnail" className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : isDirect ? (
          <video src={d.video_url} className="w-full h-32 object-cover" muted playsInline />
        ) : (
          <div className="w-full h-32 bg-charcoal/10 flex items-center justify-center">
            <Play size={24} className="text-charcoal-muted" />
          </div>
        )}
        <div className="absolute inset-0 bg-charcoal/40 group-hover:bg-charcoal/30 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play size={18} className="text-charcoal fill-charcoal ml-1" />
          </div>
        </div>
        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded font-semibold">
          ▶ Ver depoimento
        </div>
      </button>
    </div>
  );
}

// ─── Card de Imagem (print, foto com produto, story Instagram) ──────────────
function ImagemCard({ d, onZoom }: { d: Depoimento; onZoom: (url: string) => void }) {
  return (
    <div className="bg-white shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      {/* Imagem clicável */}
      <button
        onClick={() => onZoom(d.imagem_url!)}
        className="relative overflow-hidden group"
        style={{ aspectRatio: '4/5' }}
      >
        <img
          src={d.imagem_url}
          alt={d.imagem_alt || `Depoimento de ${d.nome}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
          <span className="text-white text-[11px] font-semibold tracking-widest uppercase">🔍 Ampliar</span>
        </div>
      </button>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          {d.foto_url ? (
            <img src={d.foto_url} alt={d.nome} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
              <span className="text-gold font-bold">{d.nome[0]}</span>
            </div>
          )}
          <div>
            <p className="font-sans font-semibold text-sm text-charcoal">{d.nome}</p>
            <p className="text-[11px] text-charcoal-muted">{d.cidade}</p>
          </div>
        </div>
        <Stars nota={d.nota} />
        {d.texto && (
          <p className="text-xs text-charcoal-muted mt-2 leading-relaxed italic line-clamp-3">&ldquo;{d.texto}&rdquo;</p>
        )}
        {d.produto && (
          <p className="text-[10px] text-gold mt-auto pt-2 font-semibold uppercase tracking-wider">{d.produto}</p>
        )}
      </div>
    </div>
  );
}

// ─── Modal de Imagem (lightbox) ──────────────────────────────────────────────
function ImagemModal({ url, alt, onClose }: { url: string; alt?: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-3xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <img src={url} alt={alt || ''} className="max-w-full max-h-[90vh] object-contain" />
        <button onClick={onClose}
          className="absolute -top-10 right-0 text-white text-sm font-semibold hover:text-gold transition-colors">
          ✕ Fechar
        </button>
      </div>
    </div>
  );
}

// ─── Card de Texto ───────────────────────────────────────────────────────────
function TextCard({ d }: { d: Depoimento }) {
  return (
    <div className="bg-gray-50 p-6 relative">
      <Quote size={40} className="absolute top-4 right-4 text-gray-100" />

      <div className="flex items-center gap-3 mb-4">
        {d.foto_url ? (
          <img src={d.foto_url} alt={d.nome} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
            <span className="text-gold font-bold text-lg">{d.nome[0]}</span>
          </div>
        )}
        <div>
          <p className="font-sans font-semibold text-sm text-charcoal">{d.nome}</p>
          <p className="text-[11px] text-charcoal-muted">{d.cidade}</p>
        </div>
      </div>

      <Stars nota={d.nota} />
      <p className="text-sm text-charcoal-muted mt-3 leading-relaxed italic">&ldquo;{d.texto}&rdquo;</p>

      {d.produto && (
        <p className="text-[10px] text-gold mt-3 font-semibold uppercase tracking-wider">Produto: {d.produto}</p>
      )}
    </div>
  );
}

// ─── Modal de Vídeo ──────────────────────────────────────────────────────────
function VideoModal({ url, onClose }: { url: string; onClose: () => void }) {
  const ytId = getYoutubeId(url);
  const isDirect = isDirectVideo(url);

  return (
    <div
      className="fixed inset-0 z-50 bg-charcoal/85 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-black rounded-lg overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {ytId ? (
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        ) : isDirect ? (
          <video src={url} controls autoPlay className="w-full max-h-[80vh]" />
        ) : null}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors text-sm"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ─── Componente Principal ────────────────────────────────────────────────────
interface Props {
  depoimentos?: Depoimento[];
  titulo?: string;
  subtitulo?: string;
  descricao?: string;
}

export default function Depoimentos({ depoimentos = DEPOIMENTOS_PADRAO, titulo, subtitulo, descricao }: Props) {
  const ativos = depoimentos.filter((d) => d.ativo);
  const [current, setCurrent] = useState(0);
  const [videoAberto, setVideoAberto] = useState<string | null>(null);
  const [imagemAberta, setImagemAberta] = useState<{ url: string; alt?: string } | null>(null);
  const perPage = 3;
  const totalPages = Math.ceil(ativos.length / perPage);
  const visibles = ativos.slice(current * perPage, current * perPage + perPage);

  useEffect(() => {
    if (videoAberto) return;
    const t = setInterval(() => setCurrent((c) => (c + 1) % totalPages), 7000);
    return () => clearInterval(t);
  }, [totalPages, videoAberto]);

  if (ativos.length === 0) return null;

  return (
    <section className="py-16 px-4 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-sans font-semibold tracking-[4px] uppercase text-charcoal-muted mb-2">
            {subtitulo ?? 'DEPOIMENTOS'}
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-charcoal mb-2">
            {titulo ?? 'Experiências Reais'}
          </h2>
          <p className="text-charcoal-muted text-sm">{descricao ?? 'O que dizem nossas clientes'}</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} className="fill-gold text-gold" />)}
            </div>
            <span className="text-sm text-charcoal-muted">4.9/5 · 320+ avaliações verificadas</span>
          </div>
        </div>

        {/* Cards */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {visibles.map((d) => {
              if (d.imagem_url) return <ImagemCard key={d.id} d={d} onZoom={(url) => setImagemAberta({ url, alt: d.imagem_alt })} />;
              if (d.audio_url) return <AudioCard key={d.id} d={d} />;
              if (d.video_url) return <VideoCard key={d.id} d={d} onPlay={setVideoAberto} />;
              return <TextCard key={d.id} d={d} />;
            })}
          </div>

          {/* Navegação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setCurrent((c) => (c - 1 + totalPages) % totalPages)}
                className="w-10 h-10 border border-gray-200 flex items-center justify-center hover:border-charcoal transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button key={i} onClick={() => setCurrent(i)}
                    className={`transition-all rounded-full ${i === current ? 'w-6 h-2 bg-gold' : 'w-2 h-2 bg-gray-300'}`} />
                ))}
              </div>
              <button
                onClick={() => setCurrent((c) => (c + 1) % totalPages)}
                className="w-10 h-10 border border-gray-200 flex items-center justify-center hover:border-charcoal transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de vídeo */}
      {videoAberto && <VideoModal url={videoAberto} onClose={() => setVideoAberto(null)} />}
      {imagemAberta && <ImagemModal url={imagemAberta.url} alt={imagemAberta.alt} onClose={() => setImagemAberta(null)} />}
    </section>
  );
}
