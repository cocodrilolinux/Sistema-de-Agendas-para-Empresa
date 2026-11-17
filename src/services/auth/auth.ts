import type { CreateUserInput, Role, ShareableUser, User } from '../../types/user';
import {
  DEMO_USER,
  DEMO_USER_ID,
  clearDemoSession,
  readDemoSession,
  writeDemoSession,
} from '../demo/constants';
import { seedDemoData } from '../demo/seed';
import {
  createUser as createUserRecord,
  deleteUser as deleteUserRecord,
  findUserByEmail,
  findUserById,
  listUsers as listUserRecords,
  updateUserAccess,
} from '../demo/repository';
import { getSessionUser, setSessionUser } from './session';

export interface AuthService {
  login(email: string, password: string, remember: boolean): Promise<User>;
  /** Inicia sesión directa con el usuario ficticio de gerencia, sin credenciales ni red. */
  startDemo(): Promise<User>;
  me(): Promise<User | null>;
  logout(): Promise<void>;
  listUsers(): Promise<User[]>;
  listShareableUsers(): Promise<ShareableUser[]>;
  createUser(input: CreateUserInput): Promise<User>;
  deleteUser(id: string): Promise<void>;
  updateAccess(id: string, role: Role, area_id: string | null): Promise<User>;
}

function normalizeUser(user: User): User {
  return {
    id: String(user.id),
    name: String(user.name),
    email: String(user.email),
    role: user.role,
    area_id: user.area_id ?? null,
    ...(typeof user.password === 'string' ? { password: user.password } : {}),
  };
}

async function ensureInitialized(): Promise<void> {
  await seedDemoData();
}

async function startSession(user: User, remember = true): Promise<User> {
  const normalized = normalizeUser(user);
  writeDemoSession(normalized.id, remember);
  setSessionUser(normalized);
  return normalized;
}

/**
 * Autenticación 100 % local de la demostración.
 * No hay cookies de sesión, ni endpoints PHP, ni base de datos MySQL.
 */
export const authService: AuthService = {
  async login(email, password, remember) {
    await ensureInitialized();

    const user = await findUserByEmail(email);
    if (!user || user.password !== password) {
      throw new Error('Correo o contraseña incorrectos. En esta demostración también puedes usar el botón «Entrar en modo demostración».');
    }

    return startSession(user, remember);
  },

  async startDemo() {
    await ensureInitialized();

    const user = (await findUserById(DEMO_USER_ID)) ?? DEMO_USER;
    return startSession(user, true);
  },

  async me() {
    const session = readDemoSession();
    if (!session) {
      setSessionUser(null);
      return null;
    }

    await ensureInitialized();

    const user = await findUserById(session.userId);
    if (!user) {
      clearDemoSession();
      setSessionUser(null);
      return null;
    }

    const normalized = normalizeUser(user);
    setSessionUser(normalized);
    return normalized;
  },

  async logout() {
    // Solo se limpia la sesión. Los datos de IndexedDB se conservan.
    clearDemoSession();
    setSessionUser(null);
  },

  async listUsers() {
    await ensureInitialized();
    return (await listUserRecords()).map(normalizeUser);
  },

  async listShareableUsers() {
    await ensureInitialized();
    const current = getSessionUser();
    const users = await listUserRecords();
    return users
      .filter((user) => user.id !== current?.id)
      .map((user) => ({
        id: user.id,
        name: user.name,
        area_id: user.area_id,
        role: user.role,
      }));
  },

  async createUser(input) {
    await ensureInitialized();
    return normalizeUser(await createUserRecord(input));
  },

  async deleteUser(id) {
    await ensureInitialized();
    const current = getSessionUser();
    if (!current) throw new Error('No hay una sesión activa en la demostración.');
    await deleteUserRecord(id, current.id);
  },

  async updateAccess(id, role, area_id) {
    await ensureInitialized();
    const updated = normalizeUser(await updateUserAccess(id, role, area_id));

    if (getSessionUser()?.id === updated.id) {
      setSessionUser(updated);
    }

    return updated;
  },
};
