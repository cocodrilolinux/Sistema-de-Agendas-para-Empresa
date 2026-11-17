import { useMemo } from 'react';
import type { Department, Note } from '../../types/note';
import { useNotes } from '../../hooks/useNotes';
import { classify, monthGrid, toISODate, type Bucket } from '../../utils/dates';
import { filterByArea } from '../../pages/DepartmentFilters';

const DOT: Record<Bucket, string> = { overdue: 'bg-red-500', upcoming: 'bg-brand-500', future: 'bg-brand-500', done: 'bg-emerald-500', missed: 'bg-slate-400' };

function CalendarDay({ date, inMonth, today, selected, notes, onSelect }: { date: Date; inMonth: boolean; today: boolean; selected: boolean; notes: Note[]; onSelect: () => void }) {
  const { now } = useNotes();
  const label = `${date.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}${notes.length ? `, ${notes.length} ${notes.length === 1 ? 'nota' : 'notas'}` : ''}`;
  return (
    <button onClick={onSelect} aria-label={label} aria-pressed={selected}
      className={`flex aspect-square flex-col items-center justify-between rounded-lg border p-1 text-sm transition sm:aspect-auto sm:h-20 sm:items-start sm:p-2
      ${selected ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600' : 'border-transparent hover:bg-slate-50'} ${inMonth ? 'text-slate-800' : 'text-slate-300'}`}>
      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold sm:h-7 sm:w-7 sm:text-sm ${today ? 'bg-ink text-white' : ''}`}>{date.getDate()}</span>
      <span className="flex items-center gap-0.5">
        {notes.slice(0, 3).map((n) => <span key={n.id} className={`h-1.5 w-1.5 rounded-full ${DOT[classify(n, now)]}`} />)}
        {notes.length > 3 && <span className="text-[10px] text-slate-500">+{notes.length - 3}</span>}
      </span>
    </button>
  );
}

export default function CalendarGrid({ year, month, selected, onSelect, weekStart, areaId = null }: { year: number; month: number; selected: string; onSelect: (d: string) => void; weekStart: 0 | 1; areaId?: Department | null }) {
  const { notes, now } = useNotes();
  const byDate = useMemo(() => { const m = new Map<string, Note[]>(); for (const n of filterByArea(notes, areaId)) m.set(n.date, [...(m.get(n.date) ?? []), n]); return m; }, [notes, areaId]);
  const heads = weekStart === 1 ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] : ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const today = toISODate(now);
  return (
    <div>
      <div className="mb-1 grid grid-cols-7 text-center text-xs font-semibold text-slate-500">{heads.map((h) => <div key={h} className="py-1">{h}</div>)}</div>
      <div className="grid grid-cols-7 gap-0.5">
        {monthGrid(year, month, weekStart).map((d) => { const iso = toISODate(d); return (
          <CalendarDay key={iso} date={d} inMonth={d.getMonth() === month} today={iso === today} selected={iso === selected} notes={byDate.get(iso) ?? []} onSelect={() => onSelect(iso)} />
        ); })}
      </div>
    </div>
  );
}
