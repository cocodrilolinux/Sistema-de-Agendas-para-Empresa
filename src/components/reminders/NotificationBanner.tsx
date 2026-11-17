import { Link } from 'react-router-dom';
import { BellRing } from 'lucide-react';
import { useNotes } from '../../hooks/useNotes';
import { classify } from '../../utils/dates';

/** Aviso dentro de la app. No son notificaciones push reales (requieren backend). */
export default function NotificationBanner() {
  const { notes, now } = useNotes();
  const over = notes.filter((n) => classify(n, now) === 'overdue').length;
  const soon = notes.filter((n) => classify(n, now) === 'upcoming').length;
  if (!over && !soon) return null;
  return (
    <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700">
      <BellRing size={18} />
      <span>{over > 0 && <Link to="/history" className="font-semibold underline">{over} {over === 1 ? 'nota vencida' : 'notas vencidas'}</Link>}{over > 0 && soon > 0 && ' y '}{soon > 0 && <Link to="/upcoming" className="font-semibold underline">{soon} {soon === 1 ? 'nota' : 'notas'} en los próximos 7 días</Link>}</span>
    </div>
  );
}
