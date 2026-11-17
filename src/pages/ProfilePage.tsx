import { Link } from 'react-router-dom';
import { ArrowLeft, Database, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { departmentChip, departmentLabel } from './DepartmentFilters';

export default function ProfilePage() {
  const { user, isDemoMode } = useAuth();
  if (!user) return null;
  const assignment = user.role === 'manager' ? 'Gerente / Acceso global' : user.area_id ? departmentLabel(user.area_id) : 'Sin área';

  return (
    <>
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-ink"><UserRound className="text-brand-600" /> Mi perfil</h1>
        <p className="-mt-2 text-sm text-slate-500">Consulta los datos de tu cuenta y tu asignación actual.</p>
      </div>

      <section className="card p-5">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-2xl font-bold text-white">{user.name[0]}</span>
          <div className="min-w-0 flex-1">
            <p className="text-xl font-extrabold text-ink">{user.name}</p>
            <p className="flex items-center gap-1.5 text-sm text-slate-500"><Mail size={15} /> {user.email}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.role === 'manager' ? 'bg-violet-100 text-violet-700' : departmentChip(user.area_id)}`}>
            {assignment}
          </span>
        </div>

        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tipo de acceso</dt>
            <dd className="mt-0.5 flex items-center gap-1.5 font-semibold text-ink">
              {user.role === 'manager' ? <><ShieldCheck size={16} /> Gerente / Acceso global</> : <><UserRound size={16} /> Área: {departmentLabel(user.area_id)}</>}
            </dd>
          </div>
        </dl>

        {isDemoMode && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50 p-3 text-sm text-brand-700">
            <Database size={18} className="mt-0.5 shrink-0" />
            <p>
              Estás en <strong>modo demostración</strong>. Esta cuenta y todos los datos son ficticios y se
              almacenan únicamente en este navegador.
            </p>
          </div>
        )}

        <div className="mt-5">
          <Link to="/" className="btn-outline"><ArrowLeft size={16} /> Volver al calendario</Link>
        </div>
      </section>
    </>
  );
}
