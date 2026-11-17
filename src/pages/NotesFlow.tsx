import { useState, type ReactNode } from 'react';
import type { Note } from '../types/note';
import { useNotes } from '../hooks/useNotes';
import { useAuth } from '../hooks/useAuth';
import { canEditNote } from '../services/storage/permissions';
import NoteEditorModal from '../components/notes/NoteEditorModal';
import NoteDetailModal from '../components/notes/NoteDetailModal';

/** Gestiona los modales de detalle y edición para cualquier página. */
export function useNoteModals(defaultDate: string) {
  const { notes } = useNotes();
  const { user } = useAuth();
  const [detail, setDetail] = useState<string | null>(null);
  const [edit, setEdit] = useState<{ note: Note | null } | null>(null);
  const modals: ReactNode = (<>
    {detail && <NoteDetailModal id={detail} onClose={() => setDetail(null)} onEdit={() => { setEdit({ note: notes.find((n) => n.id === detail) ?? null }); setDetail(null); }} />}
    {edit && <NoteEditorModal note={edit.note} defaultDate={defaultDate} onClose={() => setEdit(null)} />}
  </>);
  return {
    modals,
    open: (n: Note) => setDetail(n.id),
    edit: (n: Note) => { if (user && canEditNote(n, user)) setEdit({ note: n }); },
    create: () => setEdit({ note: null }),
  };
}
