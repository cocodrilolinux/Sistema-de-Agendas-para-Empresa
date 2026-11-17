import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import type { Department, MediaRef, Note, NoteStatus, Priority } from '../../types/note';
import type { ShareableUser } from '../../types/user';
import { useNotes } from '../../hooks/useNotes';
import { useAuth } from '../../hooks/useAuth';
import { usePrefs } from '../../hooks/usePrefs';
import { ConfirmDialog, Modal, useToast } from '../ui/ui';
import { ImageUploader, VoiceRecorder, type NewImage } from '../media/media';
import { uid } from '../../utils/validation';
import { PRIORITY, STATUS } from './meta';
import { departmentLabel } from '../../pages/DepartmentFilters';
import { useActiveAreas, useAreas } from '../../hooks/useAreas';
import { canManageSharing } from '../../services/storage/permissions';

export default function NoteEditorModal({ note, defaultDate, onClose }: { note: Note | null; defaultDate: string; onClose: () => void }) {
  const { save, remove, storage } = useNotes(); const toast = useToast();
  const { user, listShareableUsers } = useAuth();
  const [prefs] = usePrefs();
  const activeAreas = useActiveAreas();
  const { areas: knownAreas } = useAreas();
  const allAreas = useMemo(() => {
    if (!note || activeAreas.some((area) => area.id === note.area_id)) return activeAreas;
    const current = knownAreas.find((area) => area.id === note.area_id);
    return current ? [...activeAreas, current] : activeAreas;
  }, [activeAreas, knownAreas, note]);
  const shareAreaChoices = useMemo(() => {
    const ids = activeAreas.map((area) => area.id);
    for (const id of note?.sharedAreas ?? []) {
      if (!ids.includes(id)) ids.push(id);
    }
    return ids.map((id) => {
      const area = knownAreas.find((item) => item.id === id);
      return { id, label: area?.label ?? departmentLabel(id), active: area?.active ?? true };
    });
  }, [activeAreas, knownAreas, note]);
  const shareAreaOptions = shareAreaChoices.map((area) => area.id);
  const [shareableUsers, setShareableUsers] = useState<ShareableUser[]>([]);
  const [shareableError, setShareableError] = useState('');
  useEffect(() => {
    let live = true;
    listShareableUsers()
      .then((users) => {
        if (!live) return;
        setShareableUsers(users);
        setShareableError('');
      })
      .catch((cause) => {
        if (!live) return;
        setShareableUsers([]);
        setShareableError(cause instanceof Error ? cause.message : 'No se pudieron cargar los usuarios para compartir.');
      });
    return () => { live = false; };
  }, [listShareableUsers]);
  const [title, setTitle] = useState(note?.title ?? ''); const [content, setContent] = useState(note?.content ?? '');
  const [date, setDate] = useState(note?.date ?? defaultDate); const [time, setTime] = useState(note?.time ?? '');
  const [priority, setPriority] = useState<Priority>(note?.priority ?? 'normal'); const [category, setCategory] = useState(note?.category ?? '');
  const isManager = user?.role === 'manager';
  const [areaId, setAreaId] = useState<Department>(() => note?.area_id ?? user?.area_id ?? 'gerencia');
  const effectiveArea: Department = areaId;
  const sharingLocked = !!note && (!user || !canManageSharing(note, user));
  const [status, setStatus] = useState<NoteStatus>(note?.status ?? 'pending');
  const [sharedAreas, setSharedAreas] = useState<Department[]>(() => [...new Set(note?.sharedAreas ?? [])]);
  const [sharedUsers, setSharedUsers] = useState<string[]>(() => [...new Set(note?.sharedUsers ?? [])]);
  const [audioRef, setAudioRef] = useState<MediaRef | null>(note?.audio ?? null); const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [images, setImages] = useState<MediaRef[]>(note?.images ?? []); const [added, setAdded] = useState<NewImage[]>([]);
  const [errors, setErrors] = useState<{ title?: string; date?: string; share?: string }>({}); const [busy, setBusy] = useState(false); const [confirm, setConfirm] = useState(false);

  const allAreasSelected = shareAreaOptions.length > 0 && shareAreaOptions.every((id) => sharedAreas.includes(id));
  const allUsersSelected = shareableUsers.length > 0 && shareableUsers.every((u) => sharedUsers.includes(u.id));

  function clearShareError() {
    setErrors((prev) => (prev.share ? { ...prev, share: undefined } : prev));
  }

  function toggleArea(id: Department) {
    setSharedAreas((current) => (current.includes(id) ? current.filter((a) => a !== id) : [...current, id]));
    clearShareError();
  }

  function toggleUser(id: string) {
    setSharedUsers((current) => (current.includes(id) ? current.filter((u) => u !== id) : [...current, id]));
    clearShareError();
  }

  function toggleAllAreas() {
    setSharedAreas((current) =>
      allAreasSelected
        ? current.filter((id) => !shareAreaOptions.includes(id))
        : [...new Set([...current, ...shareAreaOptions])],
    );
    clearShareError();
  }

  function toggleAllUsers() {
    setSharedUsers((current) => {
      const visible = shareableUsers.map((u) => u.id);
      return allUsersSelected
        ? current.filter((id) => !visible.includes(id))
        : [...new Set([...current, ...visible])];
    });
    clearShareError();
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user) { toast('Tu sesión ya no es válida. Vuelve a iniciar sesión.', 'error'); return; }
    const v: typeof errors = {};
    if (!title.trim()) v.title = 'Escribe un título.';
    if (!date) v.date = 'Elige una fecha.';
    const sharesWithArea = sharedAreas.length > 0;
    const sharesWithUsers = sharedUsers.length > 0;
    if (!sharingLocked && !sharesWithArea && !sharesWithUsers) {
      v.share = 'Debes marcar y seleccionar al menos un área o usuario para compartir la nota.';
    }
    setErrors(v);
    if (Object.keys(v).length) {
      if (v.share) toast(v.share, 'error');
      return;
    }
    setBusy(true);
    try {
      // Cada adjunto se sube al servidor antes de guardar la nota; el
      // identificador real del archivo es el que devuelve el backend.
      const imgRefs = [...images];
      for (const ni of added) {
        imgRefs.push(await storage.putMedia(ni.id, ni.file, 'image', ni.file.name));
      }
      let audio = audioRef;
      if (audioBlob) { audio = await storage.putMedia(uid(), audioBlob, 'audio', 'Nota de voz'); }
      const keep = new Set<string>([...imgRefs.map((i) => i.id), ...(audio ? [audio.id] : [])]);
      const orig = note ? [...note.images, ...(note.audio ? [note.audio] : [])] : [];
      await storage.removeMedia(orig.filter((m) => !keep.has(m.id)).map((m) => m.id));
      const t = time || null; const nowIso = new Date().toISOString();
      const moved = !!note && (note.date !== date || note.time !== t);
      const finalSharedAreas = sharingLocked ? [...new Set(note?.sharedAreas ?? [])] : [...new Set(sharedAreas)];
      const finalSharedUsers = sharingLocked ? [...new Set(note?.sharedUsers ?? [])] : [...new Set(sharedUsers)];
      const finalShareType = sharingLocked
        ? note?.shareType ?? null
        : finalSharedAreas.length > 0 && finalSharedUsers.length === 0
          ? 'area'
          : finalSharedUsers.length > 0 && finalSharedAreas.length === 0
            ? 'users'
            : null;
      const n: Note = {
        id: note?.id ?? uid(), title: title.trim(), content, date, time: t, priority, category: category.trim(), area_id: effectiveArea, status,
        createdBy: note?.createdBy ?? user?.id ?? '',
        shareType: finalShareType,
        sharedAreas: finalSharedAreas,
        sharedUsers: finalSharedUsers,
        audio, images: imgRefs, createdAt: note?.createdAt ?? nowIso,
        resolvedAt: status === 'pending' ? null : note?.resolvedAt ?? nowIso,
        changes: moved && note ? [...note.changes, { at: nowIso, fromDate: note.date, fromTime: note.time, toDate: date, toTime: t }] : note?.changes ?? [],
        updatedAt: note?.updatedAt ?? null,
      };
      if (await save(n)) { toast(note ? 'Nota actualizada' : 'Nota guardada'); onClose(); }
    } catch { toast('No se pudieron guardar los archivos adjuntos.', 'error'); }
    finally { setBusy(false); }
  }

  return (
    <Modal title={note ? 'Editar nota' : 'Nueva nota'} onClose={onClose} wide lock>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div><label className="label" htmlFor="t">Título</label><input id="t" className="input" value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={!!errors.title} autoFocus />{errors.title && <p role="alert" className="mt-1 text-sm text-red-600">{errors.title}</p>}</div>
        <div><label className="label" htmlFor="c">Descripción</label><textarea id="c" rows={5} className="input resize-y" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Detalles, pendientes, recordatorios…" /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label" htmlFor="d">Fecha</label><input id="d" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />{errors.date && <p role="alert" className="mt-1 text-sm text-red-600">{errors.date}</p>}</div>
          <div><label className="label" htmlFor="h">Hora ({prefs.hourFormat === '12' ? '12 h AM/PM' : '24 h'}; vacía = todo el día)</label><input id="h" type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} /></div>
          <div><label className="label" htmlFor="p">Prioridad</label><select id="p" className="input" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>{(Object.keys(PRIORITY) as Priority[]).map((k) => <option key={k} value={k}>{PRIORITY[k].label}</option>)}</select></div>
          <div><label className="label" htmlFor="s">Estado</label><select id="s" className="input" value={status} onChange={(e) => setStatus(e.target.value as NoteStatus)}>{(Object.keys(STATUS) as NoteStatus[]).map((k) => <option key={k} value={k}>{STATUS[k].label}</option>)}</select></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="k">Categoría (opcional)</label><input id="k" className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Trabajo, Salud, Familia…" /></div>
          {isManager && (
            <div className="sm:col-span-2">
              <label className="label" htmlFor="area-owner">Área propietaria</label>
              <select id="area-owner" className="input" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
                {allAreas.map((area) => <option key={area.id} value={area.id}>{area.label}</option>)}
              </select>
            </div>
          )}
          <div className="sm:col-span-2 rounded-xl border border-slate-200 p-3">
            <span className="label">Compartir nota</span>
            {sharingLocked && <p className="mb-2 text-xs font-medium text-amber-700">Solo el creador o gerencia pueden modificar la compartición.</p>}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-700">Compartir en áreas:</p>
                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-brand-600"
                      disabled={sharingLocked}
                      checked={allAreasSelected}
                      onChange={toggleAllAreas}
                    />
                    Todos
                  </label>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {shareAreaChoices.map((area) => (
                      <label key={area.id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-brand-600"
                          disabled={sharingLocked}
                          checked={sharedAreas.includes(area.id)}
                          onChange={() => toggleArea(area.id)}
                        />
                        {area.label}{area.active ? '' : ' (inactiva)'}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Compartir con usuarios:</p>
                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  {shareableError && <p role="alert" className="mb-2 text-sm text-red-600">{shareableError}</p>}
                  {shareableUsers.length === 0 ? (
                    <p className="text-sm text-slate-500">No hay otros usuarios aprobados para compartir.</p>
                  ) : (
                    <>
                      <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-brand-600"
                          disabled={sharingLocked}
                          checked={allUsersSelected}
                          onChange={toggleAllUsers}
                        />
                        Todos
                      </label>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {shareableUsers.map((u) => (
                          <label key={u.id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-slate-300 text-brand-600"
                              disabled={sharingLocked}
                              checked={sharedUsers.includes(u.id)}
                              onChange={() => toggleUser(u.id)}
                            />
                            <span>
                              {u.name}
                              {u.area_id && <span className="text-xs text-slate-500"> · {departmentLabel(u.area_id)}</span>}
                            </span>
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              {errors.share && <p role="alert" className="text-sm text-red-600">{errors.share}</p>}
            </div>
          </div>
        </div>
        <div><span className="label">Nota de voz</span><VoiceRecorder blob={audioBlob} saved={audioRef} onRecorded={setAudioBlob} onRemove={() => { setAudioBlob(null); setAudioRef(null); }} /></div>
        <div><span className="label">Imágenes</span><ImageUploader saved={images} added={added} onRemoveSaved={(id) => setImages((s) => s.filter((i) => i.id !== id))} onAdd={(fs) => setAdded((s) => [...s, ...fs.map((file) => ({ id: uid(), file }))])} onRemoveAdded={(id) => setAdded((s) => s.filter((i) => i.id !== id))} /></div>
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          {note && <button type="button" className="btn-ghost text-red-600" onClick={() => setConfirm(true)}><Trash2 size={16} /> Eliminar nota</button>}
          <div className="ml-auto flex gap-2"><button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button><button className="btn-primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar nota'}</button></div>
        </div>
      </form>
      {confirm && note && <ConfirmDialog title="Eliminar nota" message="La nota y sus adjuntos se moverán a la Papelera. Podrás restaurarla desde allí." confirmLabel="Mover a papelera" onCancel={() => setConfirm(false)} onConfirm={async () => { if (await remove(note)) { toast('Nota movida a la papelera'); onClose(); } else setConfirm(false); }} />}
    </Modal>
  );
}
