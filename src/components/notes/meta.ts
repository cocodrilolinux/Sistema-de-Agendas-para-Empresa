import type { NoteStatus, Priority } from '../../types/note';
export const PRIORITY: Record<Priority, { label: string; cls: string }> = {
  low: { label: 'Baja', cls: 'bg-slate-100 text-slate-600' },
  normal: { label: 'Normal', cls: 'bg-sky-100 text-sky-700' },
  high: { label: 'Alta', cls: 'bg-amber-100 text-amber-800' },
  urgent: { label: 'Urgente', cls: 'bg-red-100 text-red-700' },
};
export const STATUS: Record<NoteStatus, { label: string; cls: string }> = {
  pending: { label: 'Pendiente', cls: 'bg-brand-100 text-brand-700' },
  completed: { label: 'Completada', cls: 'bg-emerald-100 text-emerald-700' },
  missed: { label: 'Incumplida', cls: 'bg-slate-200 text-slate-700' },
};
