import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Mic, Pause, Play, Square, Trash2 } from 'lucide-react';
import type { MediaRef } from '../../types/note';
import { useBlobUrl, useMediaUrl } from '../../hooks/useMedia';
import { validateImage, MAX_IMAGE_MB } from '../../utils/validation';

export function AudioPlayer({ blob, id }: { blob?: Blob | null; id?: string | null }) {
  const a = useBlobUrl(blob); const b = useMediaUrl(blob ? null : id);
  const url = a ?? b;
  return url ? <audio controls src={url} className="w-full" /> : <p className="text-sm text-slate-500">Cargando audio…</p>;
}

export function ImageThumb({ id, blob, name, onRemove }: { id?: string; blob?: Blob; name: string; onRemove?: () => void }) {
  const a = useBlobUrl(blob); const b = useMediaUrl(blob ? null : id);
  const url = a ?? b;
  return (
    <figure className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
      {url ? (onRemove ? <img src={url} alt={name} className="aspect-square w-full object-cover" /> :
        <a href={url} target="_blank" rel="noreferrer"><img src={url} alt={name} className="aspect-square w-full object-cover" /></a>) : <div className="aspect-square animate-pulse bg-slate-100" />}
      <figcaption className="truncate px-2 py-1 text-xs text-slate-500">{name}</figcaption>
      {onRemove && <button type="button" aria-label={`Quitar ${name}`} onClick={onRemove} className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-red-600 shadow hover:bg-white"><Trash2 size={14} /></button>}
    </figure>
  );
}
export function ImageGallery({ images }: { images: MediaRef[] }) {
  if (!images.length) return null;
  return <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{images.map((i) => <ImageThumb key={i.id} id={i.id} name={i.name} />)}</div>;
}

export interface NewImage { id: string; file: File }
export function ImageUploader({ saved, added, onRemoveSaved, onAdd, onRemoveAdded }: {
  saved: MediaRef[]; added: NewImage[]; onRemoveSaved: (id: string) => void; onAdd: (f: File[]) => void; onRemoveAdded: (id: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null); const [errors, setErrors] = useState<string[]>([]);
  function pick(files: FileList | null) {
    if (!files) return;
    const ok: File[] = []; const errs: string[] = [];
    for (const f of Array.from(files)) { const e = validateImage(f); if (e) errs.push(e); else ok.push(f); }
    setErrors(errs); if (ok.length) onAdd(ok);
    if (ref.current) ref.current.value = '';
  }
  return (
    <div>
      <input ref={ref} type="file" accept="image/*" multiple hidden onChange={(e) => pick(e.target.files)} />
      <button type="button" className="btn-outline" onClick={() => ref.current?.click()}><ImagePlus size={16} /> Adjuntar imágenes</button>
      <span className="ml-2 text-xs text-slate-500">Máx. {MAX_IMAGE_MB} MB por imagen</span>
      {errors.map((e) => <p key={e} role="alert" className="mt-1 text-sm text-red-600">{e}</p>)}
      {(saved.length > 0 || added.length > 0) && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {saved.map((i) => <ImageThumb key={i.id} id={i.id} name={i.name} onRemove={() => onRemoveSaved(i.id)} />)}
          {added.map((i) => <ImageThumb key={i.id} blob={i.file} name={i.file.name} onRemove={() => onRemoveAdded(i.id)} />)}
        </div>
      )}
    </div>
  );
}

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
export function VoiceRecorder({ blob, saved, onRecorded, onRemove }: { blob: Blob | null; saved: MediaRef | null; onRecorded: (b: Blob) => void; onRemove: () => void }) {
  const [state, setState] = useState<'idle' | 'rec' | 'paused'>('idle');
  const [secs, setSecs] = useState(0); const [error, setError] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null); const chunks = useRef<Blob[]>([]); const stream = useRef<MediaStream | null>(null);
  const supported = typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  const canPause = supported && typeof MediaRecorder.prototype.pause === 'function';
  const hasAudio = !!blob || !!saved;

  useEffect(() => {
    if (state !== 'rec') return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [state]);
  useEffect(() => () => {
    if (rec.current && rec.current.state !== 'inactive') { rec.current.onstop = null; rec.current.stop(); }
    stream.current?.getTracks().forEach((t) => t.stop());
  }, []);
  function release() { stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null; setState('idle'); }

  async function start() {
    setError(null);
    if (!window.isSecureContext) { setError('El micrófono solo funciona en https o en localhost.'); return; }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true }); stream.current = s;
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find((m) => MediaRecorder.isTypeSupported(m));
      const r = new MediaRecorder(s, mime ? { mimeType: mime } : undefined); chunks.current = [];
      r.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      r.onerror = () => { setError('Ocurrió un error durante la grabación.'); release(); };
      r.onstop = () => { onRecorded(new Blob(chunks.current, { type: r.mimeType || mime || 'audio/webm' })); release(); };
      r.start(); rec.current = r; setSecs(0); setState('rec');
    } catch (e) {
      const n = e instanceof DOMException ? e.name : '';
      setError(n === 'NotAllowedError' || n === 'SecurityError' ? 'Permiso de micrófono denegado. Actívalo en los ajustes del navegador y vuelve a intentarlo.'
        : n === 'NotFoundError' ? 'No se encontró ningún micrófono.' : 'No se pudo iniciar la grabación.');
    }
  }
  if (!supported) return <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Este navegador no admite grabación de audio (MediaRecorder).</p>;
  return (
    <div className="space-y-2">
      {state === 'idle' && !hasAudio && <button type="button" className="btn-outline" onClick={start}><Mic size={16} /> Grabar nota de voz</button>}
      {state !== 'idle' && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-red-50 p-3">
          <span className={`h-3 w-3 rounded-full bg-red-600 ${state === 'rec' ? 'animate-pulse' : 'opacity-40'}`} aria-hidden />
          <span className="font-mono text-sm font-semibold text-red-700" role="timer">{mmss(secs)}</span>
          <span className="text-sm text-red-700">{state === 'rec' ? 'Grabando…' : 'En pausa'}</span>
          <div className="ml-auto flex gap-2">
            {canPause && (state === 'rec'
              ? <button type="button" className="btn-outline" onClick={() => { rec.current?.pause(); setState('paused'); }}><Pause size={16} /> Pausar</button>
              : <button type="button" className="btn-outline" onClick={() => { rec.current?.resume(); setState('rec'); }}><Play size={16} /> Reanudar</button>)}
            <button type="button" className="btn-danger" onClick={() => rec.current?.stop()}><Square size={16} /> Detener</button>
          </div>
        </div>
      )}
      {state === 'idle' && hasAudio && (
        <div className="space-y-2">
          <AudioPlayer blob={blob} id={saved?.id} />
          <button type="button" className="btn-ghost !px-2 text-red-600" onClick={onRemove}><Trash2 size={16} /> Eliminar y volver a grabar</button>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
