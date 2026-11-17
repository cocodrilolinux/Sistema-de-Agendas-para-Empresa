import type { MediaRef, Note } from '../../types/note';
import type { User } from '../../types/user';
import type { NoteStorage } from '../storage/types';
import { canDeleteNote, canEditNote, canViewNote } from '../storage/permissions';
import { getSessionUser } from '../auth/session';
import {
  deleteMediaBlob,
  deleteNoteRecord,
  getMediaBlob,
  getNote,
  listNotes,
  putMediaBlob,
  putNote,
} from './repository';

function requireUser(): User {
  const user = getSessionUser();
  if (!user) throw new Error('No hay una sesión activa en la demostración.');
  return user;
}

function nowIso(): string {
  return new Date().toISOString();
}

function noteMediaIds(note: Note): string[] {
  return [...note.images.map((item) => item.id), ...(note.audio ? [note.audio.id] : [])];
}

/**
 * Almacenamiento principal de la demo. IndexedDB es la fuente autoritativa:
 * no hay caché, ni sincronización, ni peticiones al servidor.
 */
export const demoStorage: NoteStorage = {
  async list() {
    const user = requireUser();
    const all = await listNotes();
    return all
      .filter((note) => canViewNote(note, user))
      .sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
  },

  async save(note) {
    const user = requireUser();
    const existing = await getNote(note.id);

    if (existing && !canEditNote(existing, user)) {
      throw new Error('No tienes permisos para editar esta nota.');
    }

    const timestamp = nowIso();
    const saved: Note = {
      ...note,
      createdAt: note.createdAt || timestamp,
      updatedAt: timestamp,
      deletedAt: note.deletedAt ?? null,
      sharedAreas: [...new Set(note.sharedAreas ?? [])],
      sharedUsers: [...new Set(note.sharedUsers ?? [])],
      changes: note.changes ?? [],
      images: note.images ?? [],
      audio: note.audio ?? null,
    };

    await putNote(saved);
    return saved;
  },

  async remove(id, permanent = false) {
    const user = requireUser();
    const note = await getNote(id);
    if (!note) throw new Error('La nota ya no existe.');

    if (permanent) {
      if (user.role !== 'manager') throw new Error('Solo el gerente puede eliminar notas definitivamente.');
      for (const mediaId of noteMediaIds(note)) await deleteMediaBlob(mediaId);
      await deleteNoteRecord(id);
      return null;
    }

    if (!canDeleteNote(note, user)) throw new Error('No tienes permisos para eliminar esta nota.');

    const trashed: Note = {
      ...note,
      deletedAt: nowIso(),
      updatedAt: nowIso(),
    };
    await putNote(trashed);
    return trashed;
  },

  async restore(id) {
    const user = requireUser();
    if (user.role !== 'manager') throw new Error('Solo el gerente puede restaurar notas.');

    const note = await getNote(id);
    if (!note) throw new Error('La nota ya no existe.');

    const restored: Note = {
      ...note,
      deletedAt: null,
      updatedAt: nowIso(),
    };
    await putNote(restored);
    return restored;
  },

  async putMedia(id, blob, kind, name) {
    const mediaId = id || `media-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    await putMediaBlob(mediaId, blob);
    const type = blob.type || (kind === 'audio' ? 'audio/webm' : 'image/png');
    return {
      id: mediaId,
      name: name || (kind === 'audio' ? 'Nota de voz' : 'Imagen'),
      type,
    } satisfies MediaRef;
  },

  async getMedia(id) {
    return getMediaBlob(id);
  },

  async removeMedia(ids) {
    for (const id of ids) await deleteMediaBlob(id);
  },
};
