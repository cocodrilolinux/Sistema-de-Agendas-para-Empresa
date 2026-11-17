import { useState } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotes } from '../hooks/useNotes';
import { usePrefs } from '../hooks/usePrefs';
import { ConfirmDialog, EmptyState, useToast } from '../components/ui/ui';
import { departmentChip, departmentLabel } from './DepartmentFilters';
import { fmtStamp } from '../utils/dates';

export default function TrashPage() {
  const { user } = useAuth();
  const { trashed, restore, emptyTrash } = useNotes();
  const [prefs] = usePrefs();
  const toast = useToast();
  const isManager = user?.role === 'manager';
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-ink"><Trash2 className="text-slate-500" /> Papelera</h1>
          <p className="-mt-2 text-sm text-slate-500">Las notas eliminadas se conservan aquí hasta que gerencia las restaure o vacíe la papelera.</p>
        </div>
        {isManager && (
          <button type="button" className="btn-danger" disabled={trashed.length === 0} onClick={() => setConfirmEmpty(true)}>
            <Trash2 size={16} /> Vaciar papelera
          </button>
        )}
      </div>

      {!isManager && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Solo los usuarios con acceso de gerencia pueden restaurar notas o vaciar la papelera.
        </p>
      )}

      {trashed.length === 0 ? (
        <EmptyState icon={Trash2} title="La papelera está vacía" text="Cuando elimines una nota aparecerá aquí para poder recuperarla." />
      ) : (
        <ul className="space-y-3">
          {trashed.map((note) => (
            <li key={note.id} className="card flex flex-wrap items-start gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-ink">{note.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${departmentChip(note.area_id)}`}>{departmentLabel(note.area_id)}</span>
                </div>
                {note.content && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{note.content}</p>}
                <p className="mt-1 text-xs text-slate-400">Eliminada el {note.deletedAt ? fmtStamp(note.deletedAt, prefs.hourFormat === '12') : '—'}</p>
              </div>
              {isManager && (
                <button type="button" className="btn-outline !px-3 !py-1.5" onClick={async () => { if (await restore(note)) toast('Nota restaurada'); }}>
                  <RotateCcw size={15} /> Restaurar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {confirmEmpty && (
        <ConfirmDialog
          title="Vaciar papelera"
          message="Se borrarán definitivamente todas las notas de la papelera y sus adjuntos. Esta acción no se puede deshacer."
          confirmLabel="Vaciar papelera"
          onCancel={() => setConfirmEmpty(false)}
          onConfirm={async () => { if (await emptyTrash()) toast('Papelera vaciada'); setConfirmEmpty(false); }}
        />
      )}
    </>
  );
}
