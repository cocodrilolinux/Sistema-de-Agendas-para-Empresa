import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';

export interface PushContextValue {
  /** En la versión DEMO las notificaciones push reales no están disponibles. */
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  subscribed: boolean;
  activeCount: number;
  busy: boolean;
  error: string | null;
  unavailableReason: string | null;
  enable(): Promise<void>;
  disable(): Promise<void>;
  refresh(): Promise<void>;
}

const UNAVAILABLE_REASON =
  'Las notificaciones Web Push necesitan un servidor con claves VAPID y envío programado. '
  + 'La versión de demostración funciona sin backend, por lo que esta integración está desactivada. '
  + 'Las alarmas y los avisos internos de la agenda siguen funcionando.';

const PushContext = createContext<PushContextValue | null>(null);

export function usePush(): PushContextValue {
  const context = useContext(PushContext);
  if (!context) throw new Error('PushProvider ausente');
  return context;
}

/**
 * Proveedor de notificaciones de la DEMO.
 * No registra service workers, no pide claves VAPID y no hace peticiones HTTP.
 * Los recordatorios internos viven en `services/reminders/reminders.ts`.
 */
export function PushProvider({ children }: { children: ReactNode }) {
  const refresh = useCallback(async () => {
    /* No hay suscripciones remotas que consultar. */
  }, []);

  const enable = useCallback(async () => {
    throw new Error(UNAVAILABLE_REASON);
  }, []);

  const disable = useCallback(async () => {
    /* No hay nada remoto que desactivar. */
  }, []);

  const value = useMemo<PushContextValue>(() => ({
    supported: false,
    permission: 'unsupported',
    subscribed: false,
    activeCount: 0,
    busy: false,
    error: null,
    unavailableReason: UNAVAILABLE_REASON,
    enable,
    disable,
    refresh,
  }), [enable, disable, refresh]);

  return <PushContext.Provider value={value}>{children}</PushContext.Provider>;
}
