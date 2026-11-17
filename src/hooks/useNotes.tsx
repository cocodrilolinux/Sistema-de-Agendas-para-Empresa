import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Note, NoteStatus } from '../types/note';
import type { NoteStorage } from '../services/storage/types';
import { demoStorage } from '../services/demo/demoStorage';
import { DEMO_DATA_EVENT } from '../services/demo/constants';
import { reminders } from '../services/reminders/reminders';
import { useToast } from '../components/ui/ui';
import { useAuth } from './useAuth';

interface Ctx {
  notes: Note[]; trashed: Note[]; loading: boolean; error: string | null; now: Date; storage: NoteStorage;
  save(n: Note): Promise<boolean>; remove(n: Note): Promise<boolean>;
  restore(n: Note): Promise<boolean>; emptyTrash(): Promise<boolean>;
  resolve(n: Note, s: 'completed' | 'missed'): Promise<boolean>;
  postpone(n: Note, date: string, time: string): Promise<boolean>;
}

const NotesCtx = createContext<Ctx | null>(null);
export const useNotes = () => { const c = useContext(NotesCtx); if (!c) throw new Error('NotesProvider ausente'); return c; };

export function NotesProvider({ children }: { children: ReactNode }) {
  const storage = demoStorage;
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  const notes = useMemo(() => allNotes.filter((note) => !note.deletedAt), [allNotes]);
  const trashed = useMemo(
    () => allNotes.filter((note) => !!note.deletedAt).sort((a, b) => (b.deletedAt ?? '').localeCompare(a.deletedAt ?? '')),
    [allNotes],
  );

  const applyNote = useCallback((next: Note) => {
    setAllNotes((current) => {
      const index = current.findIndex((item) => item.id === next.id);
      return index >= 0 ? current.map((item) => (item.id === next.id ? next : item)) : [...current, next];
    });
  }, []);

  const clearNote = useCallback((id: string) => {
    setAllNotes((current) => current.filter((item) => item.id !== id));
  }, []);

  const replaceAll = useCallback((list: Note[]) => {
    setAllNotes(list);
  }, []);

  const reload = useCallback(async (showSpinner = false) => {
    if (!user) {
      setAllNotes([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (showSpinner) setLoading(true);
    setError(null);
    try {
      const list = await storage.list();
      replaceAll(list);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las notas locales.');
    } finally {
      setLoading(false);
    }
  }, [user, storage, replaceAll]);

  /** Carga inicial desde IndexedDB. No existe sincronización con ningún servidor. */
  useEffect(() => {
    if (authLoading) return;
    void reload(true);
  }, [authLoading, reload]);

  /** Tras «Restablecer demostración» se recargan los datos de ejemplo. */
  useEffect(() => {
    const onReset = () => { void reload(false); };
    window.addEventListener(DEMO_DATA_EVENT, onReset);
    return () => window.removeEventListener(DEMO_DATA_EVENT, onReset);
  }, [reload]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    const vis = () => setNow(new Date());
    document.addEventListener('visibilitychange', vis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', vis); };
  }, []);

  const guard = useCallback(async (fn: () => Promise<void>, msg: string) => {
    try {
      await fn();
      setNow(new Date());
      return true;
    } catch (cause) {
      toast(cause instanceof Error && cause.message ? cause.message : msg, 'error');
      return false;
    }
  }, [toast]);

  const value = useMemo<Ctx>(() => ({
    notes, trashed, loading, error, now, storage,
    save: (n) => guard(async () => {
      const saved = await storage.save(n);
      applyNote(saved);
      reminders.schedule(saved);
    }, 'No se pudo guardar la nota.'),
    remove: (n) => guard(async () => {
      const updated = await storage.remove(n.id);
      if (updated) applyNote(updated); else clearNote(n.id);
      reminders.cancel(n.id);
    }, 'No se pudo mover la nota a la papelera.'),
    restore: (n) => guard(async () => {
      const restored = await storage.restore(n.id);
      applyNote(restored);
      reminders.schedule(restored);
    }, 'No se pudo restaurar la nota.'),
    emptyTrash: () => guard(async () => {
      for (const note of trashed) {
        await storage.remove(note.id, true);
        clearNote(note.id);
        reminders.cancel(note.id);
      }
    }, 'No se pudo vaciar la papelera.'),
    resolve: (n, status: NoteStatus) => guard(async () => {
      const saved = await storage.save({ ...n, status, resolvedAt: new Date().toISOString() });
      applyNote(saved);
    }, 'No se pudo actualizar la nota.'),
    postpone: (n, date, time) => guard(async () => {
      const saved = await storage.save({
        ...n, date, time, status: 'pending', resolvedAt: null,
        changes: [...n.changes, { at: new Date().toISOString(), fromDate: n.date, fromTime: n.time, toDate: date, toTime: time }],
      });
      applyNote(saved);
    }, 'No se pudo posponer la nota.'),
  }), [notes, trashed, loading, error, now, storage, guard, applyNote, clearNote]);

  return <NotesCtx.Provider value={value}>{children}</NotesCtx.Provider>;
}
