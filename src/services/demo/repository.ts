import type { Note } from '../../types/note';
import type { CreateUserInput, Role, User } from '../../types/user';
import type { Area } from '../areas/areas';
import { requestAll, STORES, withStore } from '../db/database';
import { uid } from '../../utils/validation';

interface MetaRecord {
  key: string;
  value: unknown;
}

/* -------------------------------------------------------------------------- */
/* Meta                                                                       */
/* -------------------------------------------------------------------------- */

export async function getMeta<T>(key: string): Promise<T | null> {
  return withStore<MetaRecord | undefined>(STORES.meta, 'readonly', (store) => store.get(key))
    .then((record) => (record ? (record.value as T) : null));
}

export async function setMeta<T>(key: string, value: T): Promise<void> {
  await withStore(STORES.meta, 'readwrite', (store) => store.put({ key, value } satisfies MetaRecord));
}

/* -------------------------------------------------------------------------- */
/* Áreas                                                                      */
/* -------------------------------------------------------------------------- */

const AREA_ORDER: Record<string, number> = {
  gerencia: 0,
  administracion: 1,
  contabilidad: 2,
  ventas: 3,
  soporte: 4,
  marketing: 5,
};

function sortAreas(areas: Area[]): Area[] {
  return [...areas].sort((a, b) => {
    const orderA = AREA_ORDER[a.id] ?? 99;
    const orderB = AREA_ORDER[b.id] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export async function listAreas(): Promise<Area[]> {
  return sortAreas(await requestAll<Area>(STORES.areas));
}

function slugify(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function createArea(label: string): Promise<Area> {
  const clean = label.trim();
  if (clean.length < 2) throw new Error('El nombre del área debe tener al menos 2 caracteres.');

  const areas = await listAreas();
  if (areas.some((area) => area.label.toLowerCase() === clean.toLowerCase())) {
    throw new Error('Ya existe un área con ese nombre.');
  }

  let id = slugify(clean) || `area-${Date.now().toString(36)}`;
  let suffix = 2;
  while (areas.some((area) => area.id === id)) {
    id = `${slugify(clean)}-${suffix}`;
    suffix += 1;
  }

  const area: Area = {
    id,
    label: clean,
    active: true,
    builtin: false,
    createdAt: new Date().toISOString(),
  };

  await withStore(STORES.areas, 'readwrite', (store) => store.put(area));
  return area;
}

export async function updateArea(id: string, changes: { label?: string; active?: boolean }): Promise<Area> {
  const areas = await listAreas();
  const current = areas.find((area) => area.id === id);
  if (!current) throw new Error('El área no existe.');
  if (current.id === 'gerencia' && (changes.label !== undefined || changes.active === false)) {
    throw new Error('El área Gerencia es interna y no se puede renombrar ni desactivar.');
  }

  if (changes.label !== undefined) {
    const clean = changes.label.trim();
    if (clean.length < 2) throw new Error('El nombre del área debe tener al menos 2 caracteres.');
    if (areas.some((area) => area.id !== id && area.label.toLowerCase() === clean.toLowerCase())) {
      throw new Error('Ya existe un área con ese nombre.');
    }
    current.label = clean;
  }

  if (changes.active !== undefined) current.active = changes.active;

  await withStore(STORES.areas, 'readwrite', (store) => store.put(current));
  return current;
}

export async function deleteArea(id: string): Promise<void> {
  if (id === 'gerencia') throw new Error('El área Gerencia es interna y no se puede eliminar.');

  const users = await listUsers();
  if (users.some((user) => user.area_id === id)) {
    throw new Error('No puedes eliminar un área asignada a usuarios. Reasigna primero esas cuentas.');
  }

  await withStore(STORES.areas, 'readwrite', (store) => store.delete(id));
}

/* -------------------------------------------------------------------------- */
/* Usuarios                                                                   */
/* -------------------------------------------------------------------------- */

export async function listUsers(): Promise<User[]> {
  const users = await requestAll<User>(STORES.users);
  return users.sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export async function findUserById(id: string): Promise<User | null> {
  const user = await withStore<User | undefined>(STORES.users, 'readonly', (store) => store.get(id));
  return user ?? null;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const users = await listUsers();
  const target = email.trim().toLowerCase();
  return users.find((user) => user.email.toLowerCase() === target) ?? null;
}

function validateUserInput(input: CreateUserInput, areas: Area[], users: User[], ignoreId?: string): void {
  if (!input.name.trim()) throw new Error('El nombre es obligatorio.');
  if (!input.email.trim()) throw new Error('El correo es obligatorio.');
  if (!/^\S+@\S+\.\S+$/.test(input.email.trim())) throw new Error('El correo no es válido.');
  if (input.password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
  if (users.some((user) => user.id !== ignoreId && user.email.toLowerCase() === input.email.trim().toLowerCase())) {
    throw new Error('Ya existe un usuario con ese correo.');
  }
  if (input.role !== 'manager' && input.role !== 'employee') throw new Error('El rol no es válido.');
  if (input.role === 'employee') {
    if (!input.area_id) throw new Error('Debes asignar un área al empleado.');
    const area = areas.find((item) => item.id === input.area_id);
    if (!area) throw new Error('El área seleccionada no existe.');
    if (!area.active) throw new Error('El área seleccionada está inactiva.');
    if (area.id === 'gerencia') throw new Error('El área Gerencia está reservada para gerentes.');
  }
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const [areas, users] = await Promise.all([listAreas(), listUsers()]);
  validateUserInput(input, areas, users);

  const user: User = {
    id: `user-${uid()}`,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    role: input.role,
    area_id: input.role === 'manager' ? null : input.area_id,
  };

  await withStore(STORES.users, 'readwrite', (store) => store.put(user));
  return user;
}

export async function updateUserAccess(id: string, role: Role, areaId: string | null): Promise<User> {
  const [areas, users] = await Promise.all([listAreas(), listUsers()]);
  const user = users.find((item) => item.id === id);
  if (!user) throw new Error('El usuario no existe.');

  if (role !== 'manager' && role !== 'employee') throw new Error('El rol no es válido.');

  if (role === 'employee') {
    if (!areaId) throw new Error('Debes asignar un área al empleado.');
    const area = areas.find((item) => item.id === areaId);
    if (!area) throw new Error('El área seleccionada no existe.');
    if (!area.active) throw new Error('El área seleccionada está inactiva.');
    if (area.id === 'gerencia') throw new Error('El área Gerencia está reservada para gerentes.');
  }

  if (user.role === 'manager' && role !== 'manager') {
    const managers = users.filter((item) => item.role === 'manager');
    if (managers.length <= 1) throw new Error('La demostración necesita al menos un usuario gerente.');
  }

  const updated: User = {
    ...user,
    role,
    area_id: role === 'manager' ? null : areaId,
  };

  await withStore(STORES.users, 'readwrite', (store) => store.put(updated));
  return updated;
}

export async function deleteUser(id: string, actorId: string): Promise<void> {
  if (id === actorId) throw new Error('No puedes eliminar tu propia cuenta.');

  const users = await listUsers();
  const user = users.find((item) => item.id === id);
  if (!user) throw new Error('El usuario no existe.');

  if (user.role === 'manager' && users.filter((item) => item.role === 'manager').length <= 1) {
    throw new Error('La demostración necesita al menos un usuario gerente.');
  }

  await withStore(STORES.users, 'readwrite', (store) => store.delete(id));
}

/** Almacena el usuario ficticio del seed sin pasar por las validaciones de alta. */
export async function putSeedUser(user: User): Promise<void> {
  await withStore(STORES.users, 'readwrite', (store) => store.put(user));
}

export async function putSeedArea(area: Area): Promise<void> {
  await withStore(STORES.areas, 'readwrite', (store) => store.put(area));
}

/* -------------------------------------------------------------------------- */
/* Notas                                                                      */
/* -------------------------------------------------------------------------- */

export async function listNotes(): Promise<Note[]> {
  return requestAll<Note>(STORES.notes);
}

export async function getNote(id: string): Promise<Note | null> {
  const note = await withStore<Note | undefined>(STORES.notes, 'readonly', (store) => store.get(id));
  return note ?? null;
}

export async function putNote(note: Note): Promise<void> {
  await withStore(STORES.notes, 'readwrite', (store) => store.put(note));
}

export async function deleteNoteRecord(id: string): Promise<void> {
  await withStore(STORES.notes, 'readwrite', (store) => store.delete(id));
}

/* -------------------------------------------------------------------------- */
/* Adjuntos multimedia                                                        */
/* -------------------------------------------------------------------------- */

export async function putMediaBlob(id: string, blob: Blob): Promise<void> {
  await withStore(STORES.media, 'readwrite', (store) => store.put(blob, id));
}

export async function getMediaBlob(id: string): Promise<Blob | null> {
  const blob = await withStore<Blob | undefined>(STORES.media, 'readonly', (store) => store.get(id));
  return blob ?? null;
}

export async function deleteMediaBlob(id: string): Promise<void> {
  await withStore(STORES.media, 'readwrite', (store) => store.delete(id));
}
