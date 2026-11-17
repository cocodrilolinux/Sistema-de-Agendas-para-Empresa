import type { MediaRef, Note } from '../../types/note';

/**
 * Contrato de datos usado por la interfaz.
 * En la versión DEMO lo implementa IndexedDB (`demoStorage`), sin red.
 */
export interface NoteStorage {
  /** Devuelve las notas visibles (incluye las de la papelera). */
  list(): Promise<Note[]>;
  save(note: Note): Promise<Note>;
  /** Sin `permanent` mueve a la papelera; con `permanent` borra la nota y sus adjuntos. */
  remove(id: string, permanent?: boolean): Promise<Note | null>;
  restore(id: string): Promise<Note>;
  putMedia(id: string, blob: Blob, kind?: 'image' | 'audio', name?: string): Promise<MediaRef>;
  getMedia(id: string): Promise<Blob | null>;
  removeMedia(ids: string[]): Promise<void>;
}
