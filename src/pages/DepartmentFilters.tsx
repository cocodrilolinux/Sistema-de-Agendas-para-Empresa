import { Briefcase, Calculator, ClipboardList, FolderOpen, Headphones, ShoppingBag, type LucideIcon } from 'lucide-react';
import type { Department, Note } from '../types/note';
import { areaLabel, type Area } from '../services/areas/areas';

const CHIP: Record<string, string> = {
  gerencia: 'bg-violet-100 text-violet-700',
  administracion: 'bg-amber-100 text-amber-800',
  contabilidad: 'bg-teal-100 text-teal-700',
  ventas: 'bg-blue-100 text-blue-700',
  soporte: 'bg-rose-100 text-rose-700',
  otros: 'bg-slate-100 text-slate-600',
};

const ACCENT: Record<string, string> = {
  gerencia: 'border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100',
  administracion: 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100',
  contabilidad: 'border-teal-300 bg-teal-50 text-teal-700 hover:bg-teal-100',
  ventas: 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100',
  soporte: 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100',
  otros: 'border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100',
};

const ACTIVE: Record<string, string> = {
  gerencia: 'bg-violet-600 text-white hover:bg-violet-700 border-violet-600',
  administracion: 'bg-amber-500 text-white hover:bg-amber-600 border-amber-500',
  contabilidad: 'bg-teal-600 text-white hover:bg-teal-700 border-teal-600',
  ventas: 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600',
  soporte: 'bg-rose-600 text-white hover:bg-rose-700 border-rose-600',
  otros: 'bg-slate-600 text-white hover:bg-slate-700 border-slate-600',
};

const ICON: Record<string, LucideIcon> = {
  gerencia: Briefcase,
  administracion: ClipboardList,
  contabilidad: Calculator,
  ventas: ShoppingBag,
  soporte: Headphones,
  otros: FolderOpen,
};

export const DEPARTMENT_LABEL: Record<string, string> = {
  gerencia: 'Gerencia',
  administracion: 'Administración',
  contabilidad: 'Contabilidad',
  ventas: 'Ventas',
  soporte: 'Soporte Técnico',
  otros: 'Otros',
};

export const DEPARTMENT_CHIP: Record<string, string> = CHIP;

export function departmentLabel(id: string | null | undefined): string {
  return areaLabel(id);
}

export function departmentChip(id: string | null | undefined): string {
  return CHIP[id ?? 'otros'] ?? CHIP.otros;
}

export function departmentAccent(id: string): string {
  return ACCENT[id] ?? ACCENT.otros;
}

export function departmentActive(id: string): string {
  return ACTIVE[id] ?? ACTIVE.otros;
}

export function departmentIcon(id: string): LucideIcon {
  return ICON[id] ?? FolderOpen;
}

export function filterByArea(notes: Note[], area_id: Department | null): Note[] {
  if (!area_id) return notes;
  return notes.filter((n) => (n.area_id ?? 'otros') === area_id);
}

export function AreaFilterButton({ area, active, onToggle }: { area: Area; active: boolean; onToggle: () => void }) {
  const Icon = departmentIcon(area.id);
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      className={`btn border ${active ? departmentActive(area.id) : departmentAccent(area.id)}`}
    >
      <Icon size={16} /> {area.label}
    </button>
  );
}

