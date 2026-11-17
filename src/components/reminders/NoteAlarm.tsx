import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, CalendarClock, X } from 'lucide-react';
import type { Note } from '../../types/note';
import { useNotes } from '../../hooks/useNotes';
import { useAuth } from '../../hooks/useAuth';
import { usePrefs } from '../../hooks/usePrefs';
import { dueAt, fmtTime, toISODate } from '../../utils/dates';
import { departmentLabel } from '../../pages/DepartmentFilters';
import { isAlarmHandled, markAlarmHandled } from '../../services/reminders/reminders';

/** Alarma dentro de la app para notas vigentes de hoy (con hora exacta o durante todo el día). */
export default function NoteAlarm() {
  const { notes, now } = useNotes();
  const { user } = useAuth();
  const [prefs] = usePrefs();
  const [dismissTick, setDismissTick] = useState(0);
  const hour12 = prefs.hourFormat === '12';

  const alarms = useMemo(() => {
    if (!user) return [] as Note[];
    const today = toISODate(now);
    const current = now.getTime();
    return notes
      .filter((note) => note.status === 'pending' && !note.deletedAt)
      .filter((note) => note.date === today)
      .filter((note) => !note.time || dueAt(note).getTime() <= current)
      .filter((note) => !isAlarmHandled(note, user.id))
      .sort((a, b) => dueAt(a).getTime() - dueAt(b).getTime());
  }, [notes, now, user, dismissTick]);

  if (!alarms.length) return null;

  function dismiss(note: Note) {
    if (!user) return;
    markAlarmHandled(note, user.id);
    setDismissTick((value) => value + 1);
  }

  return (
    <section aria-label="Recordatorios de notas" aria-live="assertive" className="space-y-2">
      {alarms.map((note) => (
        <div key={note.id} role="alert" className="flex flex-wrap items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
          <BellRing size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Recordatorio: {note.title}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-amber-800">
              <span className="inline-flex items-center gap-1">
                <CalendarClock size={13} />
                {note.time ? `Hoy a las ${fmtTime(note.time, hour12)}` : 'Hoy · todo el día'}
              </span>
              <span>· {departmentLabel(note.area_id)}</span>
              {note.category && <span>· {note.category}</span>}
            </p>
          </div>
          <Link to="/history" className="btn-outline !px-3 !py-1.5">Ver nota</Link>
          <button
            type="button"
            aria-label={`Descartar recordatorio de ${note.title}`}
            title="Descartar recordatorio"
            onClick={() => dismiss(note)}
            className="btn-ghost !p-2 text-amber-700 hover:bg-amber-100"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </section>
  );
}
