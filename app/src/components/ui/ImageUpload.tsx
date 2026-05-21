'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  pasta?: string;
  label?: string;
  aspectRatio?: string;
}

const MAX_MB = 2;
const MAX_BYTES = MAX_MB * 1024 * 1024;

export default function ImageUpload({
  value, onChange, pasta = 'produtos', label = 'Imagem', aspectRatio = '3/4',
}: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [preview, setPreview] = useState(value ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setErro('');

    // Validar tamanho antes de enviar
    if (file.size > MAX_BYTES) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      const msg = `⚠️ Imagem muito grande: ${sizeMB}MB. Limite máximo é ${MAX_MB}MB. Reduza antes de enviar.`;
      setErro(msg);
      toast.error(msg);
      return;
    }

    // Preview local imediato
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('pasta', pasta);

      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) {
        setErro(data.error ?? 'Erro ao enviar imagem');
        toast.error(data.error ?? 'Erro ao enviar imagem');
        setPreview(value ?? '');
        return;
      }

      setPreview(data.url);
      onChange(data.url);
      toast.success(`Imagem enviada (${data.sizeMB}MB)`);
    } catch {
      setErro('Erro de conexão ao enviar imagem');
      toast.error('Erro de conexão');
      setPreview(value ?? '');
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function limpar() {
    setPreview('');
    setErro('');
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">
          {label} <span className="font-normal text-charcoal-muted/60 normal-case">(máx. {MAX_MB}MB · JPG, PNG, WEBP)</span>
        </label>
      )}

      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`relative border-2 border-dashed rounded-sm cursor-pointer transition-colors overflow-hidden
          ${loading ? 'border-gold/50 bg-gold/5' : erro ? 'border-red-300 bg-red-50' : preview ? 'border-gray-300 bg-gray-50 hover:border-gold' : 'border-gray-200 bg-gray-50 hover:border-gold hover:bg-gold/5'}`}
        style={{ aspectRatio }}
      >
        {/* Preview */}
        {preview && !loading && (
          <>
            <Image src={preview} alt="Preview" fill className="object-cover" sizes="200px" />
            <div className="absolute inset-0 bg-charcoal/0 hover:bg-charcoal/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <span className="bg-white text-charcoal text-xs font-semibold px-3 py-1.5 rounded-sm">Trocar imagem</span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); limpar(); }}
              className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 z-10"
            >
              <X size={12} />
            </button>
          </>
        )}

        {/* Loading */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Loader2 size={24} className="text-gold animate-spin" />
            <p className="text-xs text-charcoal-muted">Enviando...</p>
          </div>
        )}

        {/* Vazio */}
        {!preview && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            <Upload size={20} className="text-charcoal-muted" />
            <p className="text-xs text-charcoal-muted text-center">
              Clique ou arraste a imagem aqui
            </p>
            <p className="text-[10px] text-charcoal-muted/60 text-center">Máximo {MAX_MB}MB</p>
          </div>
        )}
      </div>

      {/* Erro */}
      {erro && (
        <div className="flex items-start gap-2 mt-2 p-2.5 bg-red-50 border border-red-200 rounded-sm">
          <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">{erro}</p>
        </div>
      )}

      {/* Sucesso */}
      {preview && !erro && !loading && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <CheckCircle size={12} className="text-green-500" />
          <p className="text-[10px] text-green-600">Imagem pronta</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
