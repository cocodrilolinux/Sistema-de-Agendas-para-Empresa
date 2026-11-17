import { useNotes } from '../../hooks/useNotes';
import { useAuth } from '../../hooks/useAuth';
import { usePrefs } from '../../hooks/usePrefs';
import { Modal } from '../ui/ui';
import { AudioPlayer, ImageGallery } from '../media/media';
import { fmtDate, fmtStamp, fmtTime, fmtWhen } from '../../utils/dates';
import { PRIORITY, STATUS } from './meta';
import { departmentChip, departmentLabel } from '../../pages/DepartmentFilters';
import { canEditNote } from '../../services/storage/permissions';

export default function NoteDetailModal({ id, onClose, onEdit }: { id: string; onClose: () => void; onEdit: () => void }) {
  const { notes } = useNotes(); const { user } = useAuth(); const [prefs] = usePrefs(); const hour12 = prefs.hourFormat === '12'; const n = notes.find((x) => x.id === id);
  if (!n) return null;
  const editable = !!user && canEditNote(n, user);
  return (
    <Modal title={n.title} onClose={onClose} wide>
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY[n.priority].cls}`}>{PRIORITY[n.priority].label}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS[n.status].cls}`}>{STATUS[n.status].label}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${departmentChip(n.area_id)}`}>{departmentLabel(n.area_id)}</span>
          {n.category && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{n.category}</span>}
        </div>
        <p className="text-slate-500">{fmtWhen(n, hour12)}{n.resolvedAt && ` · Resuelta: ${fmtStamp(n.resolvedAt, hour12)}`}</p>
        {n.content ? <p className="whitespace-pre-wrap text-slate-700">{n.content}</p> : <p className="text-slate-400">Sin descripción.</p>}
        {n.audio && <AudioPlayer id={n.audio.id} />}
        <ImageGallery images={n.images} />
        {n.changes.length > 0 && (
          <div>
            <h3 className="mb-1 font-semibold text-ink">Historial de cambios de fecha</h3>
            <ul className="space-y-1 text-slate-600">{n.changes.map((c) => <li key={c.at}>{fmtStamp(c.at, hour12)}: de {fmtDate(c.fromDate)} {c.fromTime ? fmtTime(c.fromTime, hour12) : ''} a {fmtDate(c.toDate)} {c.toTime ? fmtTime(c.toTime, hour12) : ''}</li>)}</ul>
          </div>
        )}
        <div className="flex justify-end gap-2"><button className="btn-ghost" onClick={onClose}>Cerrar</button>{editable && <button className="btn-primary" onClick={onEdit}>Editar</button>}</div>
      </div>
    </Modal>
  );
}
