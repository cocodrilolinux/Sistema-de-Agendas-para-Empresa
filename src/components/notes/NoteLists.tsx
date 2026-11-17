import { CalendarCheck } from 'lucide-react';
import type { Department, Note } from '../../types/note';
import { useNotes } from '../../hooks/useNotes';
import { byDue, classify } from '../../utils/dates';
import { EmptyState } from '../ui/ui';
import NoteCard from './NoteCard';
import { filterByArea } from '../../pages/DepartmentFilters';

interface Handlers { onOpen: (n: Note) => void; onEdit: (n: Note) => void }

export function UpcomingNotes({ onOpen, onEdit, areaId = null, from = '', to = '' }: Handlers & { areaId?: Department | null; from?: string; to?: string }) {
  const { notes, now } = useNotes();
  const list = filterByArea(
    notes
      .filter((n) => classify(n, now) === 'upcoming')
      .filter((n) => (!from || n.date >= from) && (!to || n.date <= to)),
    areaId,
  ).sort(byDue);
  if (!list.length) return <EmptyState icon={CalendarCheck} title="Nada para los próximos 7 días" text={from || to ? 'No hay notas próximas que coincidan con el rango de fechas seleccionado.' : 'Cuando crees notas con fecha cercana aparecerán aquí.'} />;
  return <div className="grid gap-3 lg:grid-cols-2">{list.map((n) => <NoteCard key={n.id} note={n} onOpen={() => onOpen(n)} onEdit={() => onEdit(n)} />)}</div>;
}
