import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './useAuth';
import { setAreaLabelCache, type Area } from '../services/areas/areas';
import {
  createAreaRequest,
  deleteAreaRequest,
  fetchAreas,
  updateAreaRequest,
} from '../services/areas/areasLocal';
import { DEMO_DATA_EVENT } from '../services/demo/constants';

interface AreasCtx {
  areas: Area[];
  loading: boolean;
  error: string | null;
  reload(): Promise<void>;
  createArea(label: string): Promise<Area>;
  renameArea(id: string, label: string): Promise<Area>;
  setAreaActive(id: string, active: boolean): Promise<Area>;
  deleteArea(id: string): Promise<void>;
}

const AreasContext = createContext<AreasCtx | null>(null);

export function AreasProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback((next: Area[]) => {
    setAreas(next);
    setAreaLabelCache(next);
  }, []);

  const reload = useCallback(async () => {
    if (!userId) {
      apply([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      apply(await fetchAreas());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las áreas.');
    } finally {
      setLoading(false);
    }
  }, [userId, apply]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Tras «Restablecer demostración» el almacenamiento local se recrea.
  useEffect(() => {
    const onReset = () => { void reload(); };
    window.addEventListener(DEMO_DATA_EVENT, onReset);
    return () => window.removeEventListener(DEMO_DATA_EVENT, onReset);
  }, [reload]);

  const store = useCallback((area: Area) => {
    setAreas((current) => {
      const exists = current.some((item) => item.id === area.id);
      const next = exists ? current.map((item) => (item.id === area.id ? area : item)) : [...current, area];
      setAreaLabelCache(next);
      return next;
    });
  }, []);

  const createArea = useCallback(async (label: string) => {
    const area = await createAreaRequest(label);
    store(area);
    return area;
  }, [store]);

  const renameArea = useCallback(async (id: string, label: string) => {
    const area = await updateAreaRequest(id, { label });
    store(area);
    return area;
  }, [store]);

  const setAreaActive = useCallback(async (id: string, active: boolean) => {
    const area = await updateAreaRequest(id, { active });
    store(area);
    return area;
  }, [store]);

  const deleteArea = useCallback(async (id: string) => {
    await deleteAreaRequest(id);
    setAreas((current) => {
      const next = current.filter((area) => area.id !== id);
      setAreaLabelCache(next);
      return next;
    });
  }, []);

  const value = useMemo<AreasCtx>(() => ({
    areas,
    loading,
    error,
    reload,
    createArea,
    renameArea,
    setAreaActive,
    deleteArea,
  }), [areas, loading, error, reload, createArea, renameArea, setAreaActive, deleteArea]);

  return <AreasContext.Provider value={value}>{children}</AreasContext.Provider>;
}

export function useAreas() {
  const context = useContext(AreasContext);
  if (!context) throw new Error('AreasProvider ausente');
  return context;
}

export function useActiveAreas(): Area[] {
  const { areas } = useAreas();
  return useMemo(() => areas.filter((area) => area.active), [areas]);
}

export function useEmployeeAreas(): Area[] {
  const { areas } = useAreas();
  return useMemo(() => areas.filter((area) => area.active && area.id !== 'gerencia'), [areas]);
}
