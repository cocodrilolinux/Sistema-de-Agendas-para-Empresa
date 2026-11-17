import type { User } from '../../types/user';

/** Claves propias de la demo. Ninguna otra aplicación del navegador se toca. */
export const DEMO_SESSION_KEY = 'agenda-empresarial:demo:session:v1';
export const DEMO_DATA_EVENT = 'agenda-empresarial:demo-data-changed';

export const DEMO_USER_ID = 'demo-admin';
export const DEMO_ADMIN_EMAIL = 'admin@demo.local';
export const DEMO_ADMIN_PASSWORD = 'demo1234';
export const DEMO_SEED_VERSION = 1;

/**
 * Usuario ficticio estable del modo demostración.
 * El botón «Entrar en modo demostración» inicia sesión directamente con él.
 */
export const DEMO_USER: User = {
  id: DEMO_USER_ID,
  name: 'Administrador Demo',
  email: DEMO_ADMIN_EMAIL,
  role: 'manager',
  area_id: 'gerencia',
  password: DEMO_ADMIN_PASSWORD,
};

export interface DemoSession {
  /** Marca explícita del modo demostración (no se deduce del correo ni del nombre). */
  isDemoMode: true;
  userId: string;
  startedAt: string;
}

function parseSession(raw: string | null): DemoSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<DemoSession> | null;
    if (!parsed || parsed.isDemoMode !== true || typeof parsed.userId !== 'string' || !parsed.userId) {
      return null;
    }
    return {
      isDemoMode: true,
      userId: parsed.userId,
      startedAt: typeof parsed.startedAt === 'string' ? parsed.startedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function readDemoSession(): DemoSession | null {
  if (typeof window === 'undefined') return null;
  try {
    return parseSession(window.localStorage.getItem(DEMO_SESSION_KEY))
      ?? parseSession(window.sessionStorage.getItem(DEMO_SESSION_KEY));
  } catch {
    return null;
  }
}

export function writeDemoSession(userId: string, remember = true): DemoSession {
  const session: DemoSession = {
    isDemoMode: true,
    userId,
    startedAt: new Date().toISOString(),
  };

  const target = remember ? window.localStorage : window.sessionStorage;
  const other = remember ? window.sessionStorage : window.localStorage;

  try {
    other.removeItem(DEMO_SESSION_KEY);
  } catch {
    /* El almacenamiento alternativo puede estar bloqueado. */
  }
  target.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
  return session;
}

/** Cierra la sesión local sin tocar las notas, usuarios, áreas ni adjuntos. */
export function clearDemoSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(DEMO_SESSION_KEY);
  } catch {
    /* localStorage puede estar bloqueado; la sesión en memoria se limpia igualmente. */
  }
  try {
    window.sessionStorage.removeItem(DEMO_SESSION_KEY);
  } catch {
    /* sessionStorage puede estar bloqueado. */
  }
}

/** Avisa a los proveedores de datos de que la demo se restableció. */
export function notifyDemoDataChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(DEMO_DATA_EVENT));
}
