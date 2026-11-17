import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import {
  AlertCircle, CalendarDays, CheckCircle2, Eye, EyeOff, Info, KeyRound, Loader2,
  Mail, ShieldQuestion, Sparkles, X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

type Errors = { email?: string; pw?: string };
type Notice = { kind: 'success' | 'error' | 'info'; title: string; message: string };

const NOTICE_STYLE: Record<Notice['kind'], { box: string; icon: string; Icon: typeof Info }> = {
  success: { box: 'border-emerald-200 bg-emerald-50 text-emerald-900', icon: 'text-emerald-600', Icon: CheckCircle2 },
  error: { box: 'border-red-200 bg-red-50 text-red-900', icon: 'text-red-600', Icon: AlertCircle },
  info: { box: 'border-blue-200 bg-blue-50 text-blue-900', icon: 'text-blue-600', Icon: Info },
};

export default function LoginPage() {
  const { user, loading, error: authError, login, startDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState<Errors>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
          <p className="text-sm font-medium text-slate-500">Comprobando sesión…</p>
        </div>
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const v: Errors = {};
    if (!email.trim()) v.email = 'Escribe tu correo.';
    else if (!/^\S+@\S+\.\S+$/.test(email)) v.email = 'El correo no es válido.';
    if (!pw) v.pw = 'Escribe tu contraseña.';

    setErr(v);
    if (Object.keys(v).length) return;

    setBusy(true);
    setNotice(null);
    try {
      await login(email.trim(), pw, remember);
    } catch (x) {
      const message = x instanceof Error ? x.message : 'No se pudo completar la operación.';
      setNotice({ kind: 'error', title: 'No se pudo iniciar sesión', message });
    } finally {
      setBusy(false);
    }
  }

  async function enterDemo() {
    setDemoBusy(true);
    setNotice(null);
    try {
      await startDemo();
    } catch (x) {
      const message = x instanceof Error ? x.message : 'No se pudo iniciar la demostración.';
      setNotice({ kind: 'error', title: 'No se pudo entrar en modo demostración', message });
    } finally {
      setDemoBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-slate-50 md:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-12 text-white md:flex">
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />

        <div className="relative z-10 flex items-center justify-center">
          <span className="text-center text-5xl font-bold tracking-tight text-white">
            AGENDA <span className="text-brand-400">EMPRESARIAL</span>
          </span>
        </div>

        <div className="relative z-10 my-auto flex justify-center py-10">
          <div className="group relative flex min-h-[360px] w-full max-w-md flex-col items-center justify-center gap-6 rounded-[2.5rem] border border-white/20 bg-white/5 p-12 text-center backdrop-blur-md shadow-2xl transition-all hover:border-white/50">
            <span className="rounded-3xl bg-brand-500/20 p-8 text-brand-300 ring-1 ring-white/10 transition-transform duration-500 group-hover:scale-105">
              <CalendarDays size={96} strokeWidth={1.2} />
            </span>
            <div>
              <p className="text-2xl font-extrabold tracking-tight text-white">Panel de Gestión</p>
              <p className="mt-2 text-sm font-medium text-slate-400">
                Calendario, notas y recordatorios en un solo lugar.
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-md space-y-2">
          <p className="text-3xl font-extrabold leading-snug tracking-tight text-slate-100">
            "Lo estás haciendo mucho mejor de lo que crees."
          </p>
          <p className="text-sm font-medium text-slate-400">
            Organiza tus tareas y proyectos con eficiencia total.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <form onSubmit={submit} noValidate className="w-full max-w-md space-y-5 rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-center gap-2 md:hidden">
            <span className="rounded-lg bg-brand-500 p-2 text-white"><CalendarDays size={20} /></span>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">Agenda Empresarial</span>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Iniciar sesión</h1>
            <p className="mt-1 text-sm text-slate-500">
              Usa una cuenta ficticia o entra directamente en modo demostración.
            </p>
          </div>

          {(() => {
            const current = notice ?? (authError ? { kind: 'error' as const, title: 'No se pudo comprobar la sesión', message: authError } : null);
            if (!current) return null;
            const style = NOTICE_STYLE[current.kind];
            const Icon = style.Icon;
            return (
              <div role="alert" className={`flex items-start gap-3 rounded-xl border p-3.5 text-xs leading-relaxed ${style.box}`}>
                <Icon size={18} className={`mt-0.5 shrink-0 ${style.icon}`} />
                <div className="flex-1">
                  <p className="font-semibold">{current.title}</p>
                  <p className="mt-0.5">{current.message}</p>
                </div>
              </div>
            );
          })()}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700" htmlFor="em">
              Correo electrónico
            </label>
            <input
              id="em"
              type="email"
              autoComplete="email"
              placeholder="correo@gmail.com"
              className={`w-full rounded-lg border bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-900 transition focus:bg-white focus:outline-none focus:ring-2 ${err.email
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : 'border-slate-200 focus:border-brand-500 focus:ring-brand-500/20'}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {err.email && <p role="alert" className="text-xs font-medium text-red-600">{err.email}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700" htmlFor="pw">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="pw"
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="•••••••••••"
                className={`w-full rounded-lg border bg-slate-50/50 py-2.5 pl-3.5 pr-10 text-sm font-medium text-slate-900 transition focus:bg-white focus:outline-none focus:ring-2 ${err.pw
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-slate-200 focus:border-brand-500 focus:ring-brand-500/20'}`}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
              <button
                type="button"
                aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {err.pw && <p role="alert" className="text-xs font-medium text-red-600">{err.pw}</p>}
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex cursor-pointer items-center gap-2 font-medium text-slate-600 hover:text-slate-900">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Recordar sesión
            </label>
            <button
              type="button"
              className="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
              onClick={() => setForgotOpen(true)}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-700 active:scale-[0.99] disabled:opacity-70"
              disabled={busy || demoBusy}
            >
              {busy ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Entrando…</span>
                </>
              ) : (
                <>
                  <KeyRound size={17} />
                  <span>Iniciar sesión</span>
                </>
              )}
            </button>

            <div className="relative py-1" aria-hidden>
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  o explora sin cuenta
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void enterDemo()}
              disabled={busy || demoBusy}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-brand-200 bg-gradient-to-r from-brand-50 via-white to-brand-50 py-2.5 text-sm font-semibold text-brand-700 shadow-sm transition hover:border-brand-400 hover:from-brand-100 hover:to-brand-50 active:scale-[0.99] disabled:opacity-70"
            >
              {demoBusy ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Preparando la demostración…</span>
                </>
              ) : (
                <>
                  <Sparkles size={17} />
                  <span>Entrar en modo demostración</span>
                </>
              )}
            </button>

            <p className="text-center text-[11px] leading-relaxed text-slate-400">
              Acceso inmediato como <strong className="font-semibold text-slate-500">Administrador Demo</strong> (gerencia),
              sin correo ni contraseña. Los datos se guardan únicamente en este navegador.
            </p>
          </div>
        </form>
      </div>

      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="forgot-title">
          <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-brand-50 p-2.5 text-brand-600"><ShieldQuestion size={22} /></span>
                <h2 id="forgot-title" className="text-lg font-extrabold tracking-tight text-slate-900">
                  Recuperación de contraseña
                </h2>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                onClick={() => setForgotOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-relaxed text-blue-900">
              <Mail size={18} className="mt-0.5 shrink-0 text-blue-600" />
              <p>
                En esta demostración no existe recuperación de contraseña. Puedes entrar con el botón
                «Entrar en modo demostración» o usar las cuentas ficticias incluidas.
              </p>
            </div>

            <button
              type="button"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-700 active:scale-[0.99]"
              onClick={() => setForgotOpen(false)}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
