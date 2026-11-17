import { useState } from 'react';
import { UpcomingNotes } from '../components/notes/NoteLists';
import { toISODate } from '../utils/dates';
import { useNoteModals } from './NotesFlow';

export function UpcomingPage() {
  const { modals, open, edit } = useNoteModals(toISODate(new Date()));
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  return (
    <>
      <h1 className="text-2xl font-extrabold text-ink">Notas próximas</h1>
      <p className="-mt-3 text-sm text-slate-500">Compromisos de los próximos días.</p>
      <div className="flex flex-wrap items-end gap-2">
        <div className="ml-auto flex items-end gap-2">
          <div><label className="label" htmlFor="up-from">Desde</label><input id="up-from" type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><label className="label" htmlFor="up-to">Hasta</label><input id="up-to" type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        </div>
      </div>
      <UpcomingNotes onOpen={open} onEdit={edit} from={from} to={to} />
      {modals}
    </>
  );
}
