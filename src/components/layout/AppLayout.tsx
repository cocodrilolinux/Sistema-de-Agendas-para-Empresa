import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BellRing, CalendarDays, ChevronUp, History, LogOut, NotebookPen,
  Settings, ShieldCheck, Trash2, UserRound, type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotes } from '../../hooks/useNotes';
import { classify } from '../../utils/dates';
import { departmentLabel } from '../../pages/DepartmentFilters';
import NoteAlarm from '../reminders/NoteAlarm';
import { useToast } from '../ui/ui';

function useNav(): { to: string; label: string; shortLabel?: string; icon: LucideIcon; badge?: number }[] {
  const { notes, now } = useNotes();
  const { user } = useAuth();
  const c = (b: string) => notes.filter((n) => classify(n, now) === b).length;
  return [
    { to: '/', label: 'Calendario', icon: CalendarDays },
    { to: '/upcoming', label: 'Próximas', icon: BellRing, badge: c('upcoming') },
    { to: '/history', label: 'Administrar notas', icon: History },
    { to: '/trash', label: 'Papelera', icon: Trash2 },
    ...(user?.role === 'manager' ? [{ to: '/manager', label: 'Gestión de Usuarios y Áreas', shortLabel: 'Usuarios/Áreas', icon: ShieldCheck }] : []),
    { to: '/settings', label: 'Ajustes', icon: Settings },
  ];
}
const Badge = ({ n }: { n?: number }) => (n ? <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{n}</span> : null);

function ProfileMenu({ compact = false }: { compact?: boolean }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const assignment = user?.role === 'manager' ? 'Gerente · acceso global' : user?.area_id ? departmentLabel(user.area_id) : 'Sin área';

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        aria-label="Abrir menú de perfil"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={compact
          ? 'flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 font-bold text-white shadow-sm ring-1 ring-brand-600/20'
          : `flex w-full items-center gap-3 rounded-lg p-3 text-left transition ${open ? 'bg-white/20' : 'bg-white/10 hover:bg-white/15'}`}
      >
        <span className={`flex shrink-0 items-center justify-center rounded-full bg-brand-500 font-bold text-white ${compact ? 'h-10 w-10' : 'h-9 w-9'}`}>{user?.name?.[0] ?? '?'}</span>
        {!compact && (
          <>
            <div className="min-w-0 flex-1 text-sm">
              <p className="truncate font-semibold text-white">{user?.name}</p>
              <p className="truncate text-xs text-brand-200">{assignment}</p>
              <p className="truncate text-[11px] text-slate-400">{user?.email}</p>
            </div>
            <ChevronUp size={16} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>
      {open && (
        <div role="menu" className={`absolute z-50 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-slate-700 shadow-2xl ${compact ? 'right-0 top-full mt-2 w-60' : 'bottom-full left-0 right-0 mb-2'}`}>
          <button role="menuitem" type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100" onClick={() => { setOpen(false); navigate('/profile'); }}>
            <UserRound size={16} /> Mi perfil
          </button>
          <button role="menuitem" type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100" onClick={async () => { setOpen(false); try { await logout(); } catch (cause) { toast(cause instanceof Error ? cause.message : 'No se pudo cerrar la sesión.', 'error'); } navigate('/login'); }}>
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

function DemoNotice() {
  const { isDemoMode } = useAuth();
  if (!isDemoMode) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-brand-100 bg-brand-50 px-3 py-2 text-xs text-brand-700">
      <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
        Modo demostración
      </span>
      <span className="font-medium">Datos ficticios guardados únicamente en este navegador.</span>
      <span className="text-brand-500">Puedes restablecerlos desde Ajustes.</span>
    </div>
  );
}

function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 md:hidden">
      <span className="flex items-center gap-2 text-sm font-extrabold text-ink">
        <span className="rounded-lg bg-brand-500 p-1.5 text-white"><NotebookPen size={16} /></span>
        Agenda Empresarial
        <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-700">Demo</span>
      </span>
      <ProfileMenu compact />
    </header>
  );
}

function Sidebar() {
  const nav = useNav();
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-ink p-4 text-slate-200 md:flex">
      <div className="mb-6 flex flex-col items-center gap-2 px-2 text-center">
        <span className="rounded-xl bg-brand-500 p-2.5 text-white shadow-sm"><NotebookPen size={22} /></span>
        <span className="text-sm font-extrabold uppercase tracking-wider text-white">Agenda Empresarial</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-brand-200">Panel de Gestión</span>
        <span className="mt-1 rounded-full border border-brand-400/30 bg-white/10 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-brand-200">
          Modo demostración
        </span>
      </div>
      <nav className="flex-1 space-y-1" aria-label="Principal">
        {nav.map((i) => (
          <NavLink key={i.to} to={i.to} end={i.to === '/'} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-white/15 text-white' : 'hover:bg-white/10'}`}>
            <i.icon size={18} />{i.label}<span className="ml-auto"><Badge n={i.badge} /></span>
          </NavLink>
        ))}
      </nav>
      <ProfileMenu />
    </aside>
  );
}
function MobileNavigation() {
  const nav = useNav();
  return (
    <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-40 grid border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}>
      {nav.map((i) => (
        <NavLink key={i.to} to={i.to} end={i.to === '/'} className={({ isActive }) => `relative flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${isActive ? 'text-brand-600' : 'text-slate-500'}`}>
          <i.icon size={20} />{i.shortLabel ?? i.label}{!!i.badge && <span className="absolute right-4 top-1"><Badge n={i.badge} /></span>}
        </NavLink>
      ))}
    </nav>
  );
}
export default function AppLayout() {
  const { loading, error } = useNotes();
  return (
    <div className="min-h-screen md:pl-64">
      <MobileHeader />
      <Sidebar />
      <main className="mx-auto max-w-6xl space-y-5 p-4 pb-24 md:p-8">
        <DemoNotice />
        {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <NoteAlarm />
        {loading ? <p className="py-20 text-center text-slate-500">Cargando el panel…</p> : <Outlet />}
      </main>
      <MobileNavigation />
    </div>
  );
}
