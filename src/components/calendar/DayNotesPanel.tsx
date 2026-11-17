import { Plus, StickyNote } from 'lucide-react';
import type { Department, Note } from '../../types/note';
import { useNotes } from '../../hooks/useNotes';
import { byDue, fmtLong } from '../../utils/dates';
import { EmptyState } from '../ui/ui';
import NoteCard from '../notes/NoteCard';
import { departmentLabel, filterByArea } from '../../pages/DepartmentFilters';

export default function DayNotesPanel({ date, areaId = null, onNew, onOpen, onEdit }: { date: string; areaId?: Department | null; onNew: () => void; onOpen: (n: Note) => void; onEdit: (n: Note) => void }) {
  const { notes } = useNotes();
  const all = notes.filter((n) => n.date === date).sort(byDue);
  const list = filterByArea(all, areaId);
  return (
    <section className="card p-4" aria-label="Notas del día">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold capitalize text-ink">{fmtLong(date)}</h2>
        <button className="btn-primary" onClick={onNew}><Plus size={16} /> Nueva nota</button>
      </div>
      {areaId && <p className="mb-3 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">Mostrando solo notas de <strong>{departmentLabel(areaId)}</strong> · {list.length} de {all.length}</p>}
      {list.length ? <div className="space-y-3">{list.map((n) => <NoteCard key={n.id} note={n} onOpen={() => onOpen(n)} onEdit={() => onEdit(n)} />)}</div>
        : <EmptyState icon={StickyNote} title={areaId ? 'Sin notas en esta área' : 'Sin notas este día'} text={areaId ? 'No hay notas guardadas en esta opción para este día.' : 'Crea una nota para guardar un compromiso, una idea o un audio.'} />}
    </section>
  );
}
