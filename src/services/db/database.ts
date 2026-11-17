/**
 * Capa de acceso a IndexedDB para la versión demostrativa de Agenda Empresarial.
 *
 * IndexedDB es la ÚNICA fuente de datos de la aplicación. No hay backend,
 * ni MySQL, ni sesiones PHP: todo se guarda en el navegador del visitante.
 */

export const DEMO_DB_NAME = 'agenda-empresarial-demo';
export const DEMO_DB_VERSION = 1;

export const STORES = {
  notes: 'notes',
  media: 'media',
  areas: 'areas',
  users: 'users',
  meta: 'meta',
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

let dbPromise: Promise<IDBDatabase> | null = null;

function createSchema(db: IDBDatabase): void {
  if (!db.objectStoreNames.contains(STORES.notes)) {
    const notes = db.createObjectStore(STORES.notes, { keyPath: 'id' });
    notes.createIndex('by_date', 'date', { unique: false });
    notes.createIndex('by_area', 'area_id', { unique: false });
    notes.createIndex('by_deleted', 'deletedAt', { unique: false });
  }

  if (!db.objectStoreNames.contains(STORES.media)) {
    db.createObjectStore(STORES.media);
  }

  if (!db.objectStoreNames.contains(STORES.areas)) {
    const areas = db.createObjectStore(STORES.areas, { keyPath: 'id' });
    areas.createIndex('by_active', 'active', { unique: false });
  }

  if (!db.objectStoreNames.contains(STORES.users)) {
    const users = db.createObjectStore(STORES.users, { keyPath: 'id' });
    users.createIndex('by_email', 'email', { unique: false });
    users.createIndex('by_area', 'area_id', { unique: false });
  }

  if (!db.objectStoreNames.contains(STORES.meta)) {
    db.createObjectStore(STORES.meta, { keyPath: 'key' });
  }
}

/** Abre (o crea/actualiza) la base de datos. El esquema es idempotente. */
export function getDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('Este navegador no admite IndexedDB. La demostración necesita almacenamiento local.'));
  }

  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DEMO_DB_NAME, DEMO_DB_VERSION);

      request.onupgradeneeded = () => {
        createSchema(request.result);
      };

      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        resolve(db);
      };

      request.onerror = () => {
        dbPromise = null;
        reject(request.error ?? new Error('No se pudo abrir el almacenamiento local.'));
      };

      request.onblocked = () => {
        dbPromise = null;
        reject(new Error('Otra pestaña está bloqueando la base de datos local. Cierra las demás pestañas e inténtalo de nuevo.'));
      };
    });
  }

  return dbPromise;
}

/** Cierra la conexión actual (necesario antes de borrar la base). */
export async function closeDatabase(): Promise<void> {
  const current = dbPromise;
  dbPromise = null;
  if (!current) return;
  try {
    const db = await current;
    db.close();
  } catch {
    /* La conexión pudo fallar al abrirse; no hay nada que cerrar. */
  }
}

/** Borra por completo la base de datos de la demostración. */
export async function deleteDatabase(): Promise<void> {
  if (typeof indexedDB === 'undefined') return Promise.resolve();
  await closeDatabase();

  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DEMO_DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error('No se pudo borrar la base de datos local.'));
    request.onblocked = () => resolve();
  });
}

/**
 * Ejecuta una operación dentro de una transacción.
 * La promesa se resuelve cuando la transacción confirma (oncomplete),
 * no cuando la petición individual responde.
 */
export async function withStore<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  operation: (objectStore: IDBObjectStore) => IDBRequest | void,
): Promise<T> {
  const db = await getDatabase();

  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const objectStore = tx.objectStore(store);
    let result: T;

    try {
      const request = operation(objectStore);
      if (request) {
        request.onsuccess = () => {
          result = request.result as T;
        };
        request.onerror = () => {
          reject(request.error ?? new Error('Error de almacenamiento local.'));
        };
      }
    } catch (error) {
      try {
        tx.abort();
      } catch {
        /* La transacción ya pudo haber terminado. */
      }
      reject(error);
      return;
    }

    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error ?? new Error('No se pudo completar la operación local.'));
    tx.onabort = () => reject(tx.error ?? new Error('La operación local fue cancelada.'));
  });
}

export function requestAll<T>(store: StoreName): Promise<T[]> {
  return withStore<T[]>(store, 'readonly', (objectStore) => objectStore.getAll());
}
