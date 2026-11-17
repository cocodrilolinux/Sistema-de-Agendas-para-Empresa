import type { ReactNode } from 'react';
import { CalendarClock, Image as ImageIcon, Mic, Pencil, Eye } from 'lucide-react';
import type { Note } from '../../types/note';
import { useNotes } from '../../hooks/useNotes';
import { useAuth } from '../../hooks/useAuth';
import { usePrefs } from '../../hooks/usePrefs';
import { classify, elapsed, fmtWhen, remaining } from '../../utils/dates';
import { PRIORITY, STATUS } from './meta';
import { departmentChip, departmentLabel } from '../../pages/DepartmentFilters';
import { canEditNote } from '../../services/storage/permissions';

export default function NoteCard({ note, onOpen, onEdit, children }: { note: Note; onOpen: () => void; onEdit?: () => void; children?: ReactNode }) {
  const { now } = useNotes();
  const { user } = useAuth();
  const editable = !!user && canEditNote(note, user);
  const [prefs] = usePrefs();
  const bucket = classify(note, now);
  const when = bucket === 'overdue' ? elapsed(note, now) : bucket === 'upcoming' || bucket === 'future' ? remaining(note, now) : null;
  const dept = note.area_id ?? 'otros';
  return (
    <article className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-semibold text-ink">{note.title}</h3>
        <div className="flex gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY[note.priority].cls}`}>{PRIORITY[note.priority].label}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${bucket === 'overdue' ? 'bg-red-100 text-red-700' : STATUS[note.status].cls}`}>{bucket === 'overdue' ? 'Vencida' : STATUS[note.status].label}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${departmentChip(dept)}`}>{departmentLabel(dept)}</span>
        </div>
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><CalendarClock size={14} />{fmtWhen(note, prefs.hourFormat === '12')}{when && <strong className={bucket === 'overdue' ? 'text-red-600' : 'text-brand-700'}> · {when}</strong>}</p>
      {note.content && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{note.content}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {note.images.length > 0 && <span className="flex items-center gap-1 text-xs text-slate-500"><ImageIcon size={14} />{note.images.length}</span>}
        {note.audio && <span className="flex items-center gap-1 text-xs text-slate-500"><Mic size={14} />Audio</span>}
        <div className="ml-auto flex flex-wrap gap-2">
          {children}
          <button className="btn-ghost !px-2 !py-1" onClick={onOpen}><Eye size={15} /> Detalles</button>
          {onEdit && editable && <button className="btn-ghost !px-2 !py-1" onClick={onEdit}><Pencil size={15} /> Editar</button>}
        </div>
      </div>
    </article>
  );
}
