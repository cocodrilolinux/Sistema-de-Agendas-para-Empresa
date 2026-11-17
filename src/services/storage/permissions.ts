import type { Note } from '../../types/note';
import type { User } from '../../types/user';

export function isNoteCreator(note: Note, user: User): boolean {
  return note.createdBy !== '' && note.createdBy === user.id;
}

export function canManageSharing(note: Note, user: User): boolean {
  return user.role === 'manager' || isNoteCreator(note, user);
}

export function canViewNote(note: Note, user: User): boolean {
  if (user.role === 'manager') return true;
  if (isNoteCreator(note, user)) return true;
  if (note.sharedUsers?.includes(user.id)) return true;
  if (user.area_id && note.area_id === user.area_id) return true;
  if (user.area_id && note.sharedAreas?.includes(user.area_id)) return true;
  return false;
}

export function canEditNote(note: Note, user: User): boolean {
  if (user.role === 'manager') return true;
  if (isNoteCreator(note, user)) return true;

  // La compartición explícita con una persona siempre es de solo lectura,
  // incluso si esa persona pertenece al área propietaria.
  if (note.sharedUsers?.includes(user.id)) return false;

  return !!user.area_id && note.area_id === user.area_id;
}

export function canDeleteNote(note: Note, user: User): boolean {
  return canEditNote(note, user);
}

export function canReadMedia(note: Note, user: User): boolean {
  return canViewNote(note, user);
}
