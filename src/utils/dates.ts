import type { Note } from '../types/note';
const p = (n: number) => String(n).padStart(2, '0');
export const DAY = 86_400_000;
export const toISODate = (d: Date) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
export const toTime = (d: Date) => `${p(d.getHours())}:${p(d.getMinutes())}`;
export const parseDate = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
/** Momento de vencimiento. Regla: sin hora, vence a las 23:59:59 del día elegido. */
export function dueAt(n: Pick<Note, 'date' | 'time'>): Date {
  const d = parseDate(n.date);
  if (n.time) { const [h, m] = n.time.split(':').map(Number); d.setHours(h, m, 0, 0); } else d.setHours(23, 59, 59, 999);
  return d;
}
export type Bucket = 'done' | 'missed' | 'overdue' | 'upcoming' | 'future';
export function classify(n: Note, now: Date): Bucket {
  if (n.status === 'completed') return 'done';
  if (n.status === 'missed') return 'missed';
  const due = dueAt(n).getTime();
  if (due < now.getTime()) return 'overdue';
  return due <= now.getTime() + 7 * DAY ? 'upcoming' : 'future';
}
export function dayLabel(n: Note, now: Date): string {
  const diff = Math.round((startOfDay(dueAt(n)).getTime() - startOfDay(now).getTime()) / DAY);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff === -1) return 'Ayer';
  if (diff === 7) return 'En una semana';
  return diff > 0 ? `En ${diff} días` : `Hace ${-diff} días`;
}
export function remaining(n: Note, now: Date): string {
  const ms = dueAt(n).getTime() - now.getTime();
  if (ms > 0 && ms < 3_600_000) return `En ${Math.max(1, Math.round(ms / 60000))} min`;
  if (ms > 0 && ms < DAY && dayLabel(n, now) === 'Hoy') return `Hoy, en ${Math.round(ms / 3_600_000)} h`;
  return dayLabel(n, now);
}
export function elapsed(n: Note, now: Date): string {
  const min = Math.floor((now.getTime() - dueAt(n).getTime()) / 60000);
  if (min < 60) return `Venció hace ${Math.max(1, min)} min`;
  if (min < 1440) return `Venció hace ${Math.floor(min / 60)} h`;
  const d = Math.floor(min / 1440); return `Venció hace ${d} ${d === 1 ? 'día' : 'días'}`;
}
export function monthGrid(year: number, month: number, weekStart: 0 | 1): Date[] {
  const offset = (new Date(year, month, 1).getDay() - weekStart + 7) % 7;
  return Array.from({ length: 42 }, (_, i) => new Date(year, month, 1 - offset + i));
}
export const fmtDate = (s: string) => parseDate(s).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
export const fmtLong = (s: string) => parseDate(s).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
export function fmtTime(time: string | null | undefined, hour12 = false): string {
  if (!time) return 'todo el día';
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  if (hour12) {
    const period = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${p(m)} ${period}`;
  }
  return `${p(h)}:${p(m)}`;
}
export const fmtStamp = (iso: string, hour12 = false) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })} · ${fmtTime(`${p(d.getHours())}:${p(d.getMinutes())}`, hour12)}`;
};
export const fmtWhen = (n: Pick<Note, 'date' | 'time'>, hour12 = false) => `${fmtDate(n.date)} · ${n.time ? fmtTime(n.time, hour12) : 'todo el día'}`;
export const byDue = (a: Note, b: Note) => dueAt(a).getTime() - dueAt(b).getTime();
