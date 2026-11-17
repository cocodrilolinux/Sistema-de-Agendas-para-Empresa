import type { Note } from '../../types/note';

/** Punto de conexión para notificaciones externas (push, correo...). Hoy solo hay avisos dentro de la app. */
export interface ReminderService { schedule(note: Note): void; cancel(noteId: string): void }

const ALARMS_KEY = 'agenda-empresarial:alarms:v1';

type AlarmKey = Pick<Note, 'id' | 'date' | 'time'>;

function readHandled(): Record<string, string> {
  try {
    const raw = JSON.parse(localStorage.getItem(ALARMS_KEY) ?? '{}');
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeHandled(handled: Record<string, string>) {
  localStorage.setItem(ALARMS_KEY, JSON.stringify(handled));
}

/** Clave estable por usuario, nota, fecha y hora. Evita repetir la misma alarma. */
export function alarmKey(note: AlarmKey, userId: string): string {
  return `${userId}|${note.id}|${note.date}|${note.time ?? 'all-day'}`;
}

export function isAlarmHandled(note: AlarmKey, userId: string): boolean {
  return !!readHandled()[alarmKey(note, userId)];
}

export function markAlarmHandled(note: AlarmKey, userId: string): void {
  const handled = readHandled();
  handled[alarmKey(note, userId)] = new Date().toISOString();
  writeHandled(handled);
}

function clearNoteAlarms(noteId: string, keep?: AlarmKey): void {
  const handled = readHandled();
  let changed = false;
  for (const key of Object.keys(handled)) {
    const [, storedId, storedDate, storedTime] = key.split('|');
    if (storedId !== noteId) continue;
    const isCurrent = !!keep && storedDate === keep.date && storedTime === (keep.time ?? 'all-day');
    if (!isCurrent) {
      delete handled[key];
      changed = true;
    }
  }
  if (changed) writeHandled(handled);
}

export const reminders: ReminderService = {
  /** Si la nota cambió de fecha/hora, las alarmas anteriores dejan de ser válidas. */
  schedule(note) {
    clearNoteAlarms(note.id, note);
  },
  cancel(noteId) {
    clearNoteAlarms(noteId);
  },
};
