import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';
export type WeekStart = 0 | 1;
export type HourFormat = '12' | '24';

export interface Prefs {
  weekStart: WeekStart;
  hourFormat: HourFormat;
  theme: Theme;
}

const KEY = 'agenda-empresarial:prefs';
export const DEFAULT_PREFS: Prefs = { weekStart: 1, hourFormat: '24', theme: 'light' };

function read(): Prefs {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Prefs>;
    return {
      weekStart: raw.weekStart === 0 ? 0 : 1,
      hourFormat: raw.hourFormat === '12' ? '12' : '24',
      theme: raw.theme === 'dark' ? 'dark' : 'light',
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

interface Ctx {
  prefs: Prefs;
  update(patch: Partial<Prefs>): void;
}

const PrefsCtx = createContext<Ctx | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(read);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', prefs.theme === 'dark');
    root.style.colorScheme = prefs.theme;
    localStorage.setItem(KEY, JSON.stringify(prefs));
  }, [prefs]);

  const update = useCallback((patch: Partial<Prefs>) => setPrefs((current) => ({ ...current, ...patch })), []);
  const value = useMemo<Ctx>(() => ({ prefs, update }), [prefs, update]);

  return <PrefsCtx.Provider value={value}>{children}</PrefsCtx.Provider>;
}

export function usePrefs() {
  const context = useContext(PrefsCtx);
  if (!context) throw new Error('PrefsProvider ausente');
  return [context.prefs, context.update] as const;
}
