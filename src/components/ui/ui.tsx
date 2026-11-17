import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, X, type LucideIcon } from 'lucide-react';

type Kind = 'ok' | 'error';
const ToastCtx = createContext<(m: string, k?: Kind) => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, set] = useState<{ id: number; m: string; k: Kind }[]>([]);
  const push = useCallback((m: string, k: Kind = 'ok') => {
    const id = Date.now() + Math.random();
    set((s) => [...s, { id, m, k }]);
    setTimeout(() => set((s) => s.filter((i) => i.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-20 right-4 z-[60] flex flex-col gap-2 md:bottom-6">
        {items.map((i) => (
          <div key={i.id} className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${i.k === 'ok' ? 'bg-emerald-600' : 'bg-red-600'}`}>
            {i.k === 'ok' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}{i.m}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function Modal({ title, onClose, children, wide, lock }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean; lock?: boolean }) {
  useEffect(() => {
    let onKey: ((e: KeyboardEvent) => void) | null = null;
    if (!lock) {
      onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
      document.addEventListener('keydown', onKey);
    }
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => {
      if (onKey) document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, lock]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 sm:items-center sm:p-4" onMouseDown={lock ? undefined : (e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <button aria-label="Cerrar" className="btn-ghost !p-2" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel, danger = true }: { title: string; message: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void; danger?: boolean }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn-ghost" onClick={onCancel}>Cancelar</button>
        <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}

export function EmptyState({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center">
      <span className="mb-3 rounded-full bg-brand-50 p-3 text-brand-600"><Icon size={26} /></span>
      <p className="font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-slate-500">{text}</p>
    </div>
  );
}
