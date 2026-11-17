export type NoteStatus = 'pending' | 'completed' | 'missed';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';
export type NoteShareScope = 'area' | 'users';
export type Department = string;
export interface MediaRef { id: string; name: string; type: string }
export interface NoteChange { at: string; fromDate: string; fromTime: string | null; toDate: string; toTime: string | null }
export interface Note {
  id: string; title: string; content: string;
  /** YYYY-MM-DD (fecha local) */ date: string;
  /** HH:mm o null. Sin hora = vence al final del día (23:59:59). */ time: string | null;
  priority: Priority; category: string; area_id: Department; status: NoteStatus;
  /** Identificador del usuario que creó la nota. Conserva el control aunque cambie de área. */
  createdBy: string;
  /** Metadato legado de compartición. Las fuentes de verdad son sharedAreas y sharedUsers. */
  shareType?: NoteShareScope | null;
  /** Áreas seleccionadas. Independiente de sharedUsers. */
  sharedAreas?: Department[];
  /** IDs de usuarios seleccionados. Independiente de sharedAreas. */
  sharedUsers?: string[];
  audio: MediaRef | null; images: MediaRef[];
  resolvedAt: string | null; changes: NoteChange[]; createdAt: string;
  /** Fecha de envío a la papelera. Ausente o null = nota activa. */
  deletedAt?: string | null;
  /** Marca de tiempo de la última actualización en el servidor. Sirve para detectar conflictos de edición. */
  updatedAt?: string | null;
}
