import type { Area } from './areas';
import {
  createArea as createAreaRecord,
  deleteArea as deleteAreaRecord,
  listAreas,
  updateArea as updateAreaRecord,
} from '../demo/repository';

/**
 * Servicio de áreas de la demostración. Todo se resuelve en IndexedDB:
 * ninguna operación sale del navegador.
 */

export async function fetchAreas(): Promise<Area[]> {
  return listAreas();
}

export async function createAreaRequest(label: string): Promise<Area> {
  return createAreaRecord(label);
}

export async function updateAreaRequest(
  id: string,
  changes: { label?: string; active?: boolean },
): Promise<Area> {
  return updateAreaRecord(id, changes);
}

export async function deleteAreaRequest(id: string): Promise<void> {
  await deleteAreaRecord(id);
}
