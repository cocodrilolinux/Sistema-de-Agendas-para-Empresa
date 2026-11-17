import { useState } from 'react';
import { Check, Clock, History, X } from 'lucide-react';
import type { Note } from '../types/note';
import { useNotes } from '../hooks/useNotes';
import { useAuth } from '../hooks/useAuth';
import { EmptyState, useToast } from '../components/ui/ui';
import NoteCard from '../components/notes/NoteCard';
import PostponeModal from '../components/notes/PostponeModal';
import { toISODate } from '../utils/dates';
import { useNoteModals } from './NotesFlow';
import { canEditNote } from '../services/storage/permissions';

type F = 'all' | 'pending' | 'completed' | 'missed';
const FILTERS: [F, string][] = [['all', 'Todas'], ['pending', 'Pendientes'], ['completed', 'Completadas'], ['missed', 'Incumplidas']];

export default function HistoryPage() {
  const { notes, resolve } = useNotes();
  const { user } = useAuth();
  const toast = useToast();
  const [f, setF] = useState<F>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [postponing, setPostponing] = useState<Note | null>(null);
  const { modals, open, edit } = useNoteModals(toISODate(new Date()));
  const list = notes
    .filter((n) => f === 'all' || n.status === f)
    .filter((n) => (!from || n.date >= from) && (!to || n.date <= to))
    .sort((a, b) => (b.resolvedAt ?? b.date).localeCompare(a.resolvedAt ?? a.date));
  return (
    <>
      <h1 className="text-2xl font-extrabold text-ink">Administrar notas</h1>
      <div className="flex flex-wrap items-end gap-2">
        {FILTERS.map(([k, l]) => <button key={k} aria-pressed={f === k} className={f === k ? 'btn-primary' : 'btn-outline'} onClick={() => setF(k)}>{l}</button>)}
        <div className="ml-auto flex items-end gap-2">
          <div><label className="label" htmlFor="hf">Desde</label><input id="hf" type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><label className="label" htmlFor="ht">Hasta</label><input id="ht" type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        </div>
      </div>
      {list.length === 0 ? <EmptyState icon={History} title="Sin notas" text="No hay notas que coincidan con el filtro o el rango de fechas seleccionado." /> : (
        <div className="grid gap-3 lg:grid-cols-2">
          {list.map((n) => (
            <NoteCard key={n.id} note={n} onOpen={() => open(n)} onEdit={() => edit(n)}>
              {n.changes.length > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Pospuesta {n.changes.length}×</span>}
              {!!user && canEditNote(n, user) && (
                <>
                  <button className="btn-primary !px-3 !py-1 !bg-emerald-600 hover:!bg-emerald-700" onClick={async () => { if (await resolve(n, 'completed')) toast('Marcada como cumplida'); }}><Check size={15} /> Se cumplió</button>
                  <button className="btn-outline !px-3 !py-1" onClick={async () => { if (await resolve(n, 'missed')) toast('Marcada como no cumplida'); }}><X size={15} /> No se cumplió</button>
                  <button className="btn-outline !px-3 !py-1" onClick={() => setPostponing(n)}><Clock size={15} /> Posponer</button>
                </>
              )}
            </NoteCard>
          ))}
        </div>
      )}
      {postponing && <PostponeModal note={postponing} onClose={() => setPostponing(null)} />}
      {modals}
    </>
  );
}
