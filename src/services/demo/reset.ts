import { deleteDatabase } from '../db/database';
import { DEMO_DATA_EVENT } from './constants';
import { seedDemoData } from './seed';

const VOLATILE_KEYS = [
  'agenda-empresarial:alarms:v1',
  'agenda-empresarial:cache-owner',
];

/**
 * Restablece la demostración:
 * 1. borra SOLO la base IndexedDB de esta aplicación,
 * 2. vuelve a crear los datos de ejemplo,
 * 3. limpia avisos/alarmas locales,
 * 4. avisa a la interfaz para recargar notas y áreas.
 *
 * La sesión de demostración se conserva a propósito.
 */
export async function resetDemoData(): Promise<void> {
  await deleteDatabase();

  try {
    for (const key of VOLATILE_KEYS) window.localStorage.removeItem(key);
  } catch {
    /* localStorage puede estar bloqueado; no impide restablecer IndexedDB. */
  }

  await seedDemoData();

  window.dispatchEvent(new Event(DEMO_DATA_EVENT));
}

/** Estimación del espacio usado por la demo en el navegador (si el navegador lo permite). */
export async function demoStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (!navigator.storage?.estimate) return null;
  try {
    const estimate = await navigator.storage.estimate();
    return { usage: estimate.usage ?? 0, quota: estimate.quota ?? 0 };
  } catch {
    return null;
  }
}
