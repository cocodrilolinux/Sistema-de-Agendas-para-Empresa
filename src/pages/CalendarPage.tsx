import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CalendarGrid from '../components/calendar/CalendarGrid';
import DayNotesPanel from '../components/calendar/DayNotesPanel';
import NotificationBanner from '../components/reminders/NotificationBanner';
import { UpcomingNotes } from '../components/notes/NoteLists';
import { usePrefs } from '../hooks/usePrefs';
import { useAuth } from '../hooks/useAuth';
import { toISODate } from '../utils/dates';
import { useNoteModals } from './NotesFlow';
import type { Department } from '../types/note';
import { AreaFilterButton } from './DepartmentFilters';
import { useActiveAreas } from '../hooks/useAreas';

export default function CalendarPage() {
  const [prefs] = usePrefs();
  const { user } = useAuth();
  const activeAreas = useActiveAreas();
  const isManager = user?.role === 'manager';
  const today = new Date();
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selected, setSelected] = useState(toISODate(today));
  const [areaFilter, setAreaFilter] = useState<Department | null>(null);
  const { modals, open, edit, create } = useNoteModals(selected);
  const visibleArea = isManager ? areaFilter : null;
  const areaOptions = isManager ? activeAreas : [];
  const toggle = (d: Department) => setAreaFilter((cur) => (cur === d ? null : d));
  const shift = (d: number) => setCursor((c) => { const x = new Date(c.y, c.m + d, 1); return { y: x.getFullYear(), m: x.getMonth() }; });
  const title = new Date(cursor.y, cursor.m, 1).toLocaleDateString('es', { month: 'long', year: 'numeric' });
  return (
    <>
      <NotificationBanner />
      {isManager && (
        <section className="card flex flex-wrap items-center gap-2 p-3" aria-label="Filtrar notas por área">
          <span className="mr-1 text-sm font-semibold text-slate-500">Filtrar notas:</span>
          {areaOptions.map((area) => (
            <AreaFilterButton key={area.id} area={area} active={areaFilter === area.id} onToggle={() => toggle(area.id)} />
          ))}
          {areaFilter && <button type="button" className="btn-ghost" onClick={() => setAreaFilter(null)}>Ver todas</button>}
        </section>
      )}
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-4" aria-label="Calendario">
          <div className="mb-3 flex items-center gap-2">
            <h1 className="mr-auto text-xl font-extrabold capitalize text-ink">{title}</h1>
            <button className="btn-outline" onClick={() => { setCursor({ y: today.getFullYear(), m: today.getMonth() }); setSelected(toISODate(new Date())); }}>Hoy</button>
            <button className="btn-outline !px-2" aria-label="Mes anterior" onClick={() => shift(-1)}><ChevronLeft size={18} /></button>
            <button className="btn-outline !px-2" aria-label="Mes siguiente" onClick={() => shift(1)}><ChevronRight size={18} /></button>
          </div>
          <CalendarGrid year={cursor.y} month={cursor.m} selected={selected} onSelect={setSelected} weekStart={prefs.weekStart} areaId={visibleArea} />
        </section>
        <DayNotesPanel date={selected} areaId={visibleArea} onNew={create} onOpen={open} onEdit={edit} />
      </div>
      <section aria-label="Notas próximas">
        <h2 className="mb-3 text-lg font-bold text-ink">Se acerca la fecha de estas notas</h2>
        <UpcomingNotes onOpen={open} onEdit={edit} areaId={visibleArea} />
      </section>
      {modals}
    </>
  );
}
