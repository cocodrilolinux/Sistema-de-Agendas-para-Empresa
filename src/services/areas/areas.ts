export interface Area {
  id: string;
  label: string;
  active: boolean;
  builtin: boolean;
  createdAt: string;
}

const FALLBACK_LABELS: Record<string, string> = {
  gerencia: 'Gerencia',
  administracion: 'Administración',
  contabilidad: 'Contabilidad',
  ventas: 'Ventas',
  soporte: 'Soporte Técnico',
  otros: 'Otros',
};

let labelCache: Record<string, string> = { ...FALLBACK_LABELS };

export function setAreaLabelCache(areas: Area[]): void {
  const next: Record<string, string> = { ...FALLBACK_LABELS };
  for (const area of areas) {
    next[area.id] = area.label;
  }
  labelCache = next;
}

export function areaLabel(id: string | null | undefined): string {
  if (!id) return 'Sin área';
  return labelCache[id] ?? id;
}
