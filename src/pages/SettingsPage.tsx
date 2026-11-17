import { useState } from 'react';
import { BellRing, CalendarDays, Clock, Database, HardDrive, Moon, RotateCcw, Sun } from 'lucide-react';
import { DEFAULT_PREFS, usePrefs } from '../hooks/usePrefs';
import { usePush } from '../hooks/usePush';
import { ConfirmDialog, useToast } from '../components/ui/ui';
import { resetDemoData } from '../services/demo/reset';

export default function SettingsPage() {
  const [prefs, setPrefs] = usePrefs();
  const toast = useToast();
  const push = usePush();
  const [confirm, setConfirm] = useState(false);
  const [confirmResetDemo, setConfirmResetDemo] = useState(false);
  const [resettingDemo, setResettingDemo] = useState(false);

  const handleResetDemo = async () => {
    setResettingDemo(true);
    try {
      await resetDemoData();
      toast('Demostración restablecida con los datos de ejemplo');
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : 'No se pudo restablecer la demostración.', 'error');
    } finally {
      setResettingDemo(false);
      setConfirmResetDemo(false);
    }
  };

  const togglePush = async () => {
    try {
      if (push.subscribed) {
        await push.disable();
        toast('Notificaciones desactivadas');
      } else {
        await push.enable();
        toast('Notificaciones activadas');
      }
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : 'No se pudo cambiar la configuración de notificaciones.', 'error');
    }
  };

  return (
    <>
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Configuración</h1>
        <p className="-mt-2 text-sm text-slate-500">Personaliza la apariencia y cómo se muestran las fechas y horas.</p>
      </div>

      <section className="card space-y-4 p-5" aria-labelledby="appearance-title">
        <div>
          <h2 id="appearance-title" className="flex items-center gap-2 font-bold text-ink"><Sun size={18} /> Apariencia</h2>
          <p className="mt-1 text-sm text-slate-500">Elige el tema de la interfaz.</p>
        </div>
        <div className="grid max-w-md gap-2 sm:grid-cols-2" role="group" aria-label="Tema de la interfaz">
          <button
            type="button"
            aria-pressed={prefs.theme === 'light'}
            onClick={() => setPrefs({ theme: 'light' })}
            className={`flex items-center gap-3 rounded-xl border p-3 text-left text-sm font-semibold transition ${prefs.theme === 'light' ? 'border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-600' : 'border-slate-200 hover:bg-slate-50'}`}
          >
            <span className="rounded-lg bg-white p-2 text-amber-500 shadow-sm"><Sun size={20} /></span>
            <span>Modo claro</span>
          </button>
          <button
            type="button"
            aria-pressed={prefs.theme === 'dark'}
            onClick={() => setPrefs({ theme: 'dark' })}
            className={`flex items-center gap-3 rounded-xl border p-3 text-left text-sm font-semibold transition ${prefs.theme === 'dark' ? 'border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-600' : 'border-slate-200 hover:bg-slate-50'}`}
          >
            <span className="rounded-lg bg-slate-900 p-2 text-slate-100 shadow-sm"><Moon size={20} /></span>
            <span>Modo oscuro</span>
          </button>
        </div>
      </section>

      <section className="card space-y-4 p-5" aria-labelledby="calendar-title">
        <div>
          <h2 id="calendar-title" className="flex items-center gap-2 font-bold text-ink"><CalendarDays size={18} /> Calendario y horarios</h2>
          <p className="mt-1 text-sm text-slate-500">Ajusta la semana y el formato de hora en toda la agenda.</p>
        </div>
        <div className="grid max-w-xl gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="ws">Primer día de la semana</label>
            <select id="ws" className="input" value={prefs.weekStart} onChange={(e) => setPrefs({ weekStart: Number(e.target.value) as 0 | 1 })}>
              <option value={1}>Lunes</option>
              <option value={0}>Domingo</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="hf"><Clock size={14} className="mr-1 inline" />Formato de hora</label>
            <select id="hf" className="input" value={prefs.hourFormat} onChange={(e) => setPrefs({ hourFormat: e.target.value as '12' | '24' })}>
              <option value="24">24 horas (14:30)</option>
              <option value="12">12 horas AM/PM (2:30 PM)</option>
            </select>
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-5" aria-labelledby="push-title">
        <div>
          <h2 id="push-title" className="flex items-center gap-2 font-bold text-ink"><BellRing size={18} /> Notificaciones externas</h2>
          <p className="mt-1 text-sm text-slate-500">
            Las alarmas internas de la agenda (avisos de notas del día y de fechas próximas) siguen activas.
            Las notificaciones Web Push reales necesitan un servidor y están desactivadas en esta demostración.
          </p>
        </div>

        {!push.supported ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-semibold">Notificaciones push no disponibles en la DEMO</p>
            <p className="mt-1 leading-relaxed">{push.unavailableReason}</p>
          </div>
        ) : push.permission === 'denied' ? (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            Las notificaciones están bloqueadas para este sitio. Habilítalas desde la configuración del navegador
            y vuelve a intentarlo.
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
            <div>
              <p className="text-sm font-semibold text-ink">
                {push.subscribed ? 'Notificaciones activadas' : 'Notificaciones desactivadas'}
              </p>
              <p className="text-xs text-slate-500">
                {push.activeCount > 0
                  ? `${push.activeCount} dispositivo(s) registrado(s)`
                  : 'Sin dispositivos registrados'}
              </p>
            </div>
            <button
              type="button"
              className={push.subscribed ? 'btn-outline' : 'btn-primary'}
              disabled={push.busy}
              onClick={() => void togglePush()}
            >
              {push.busy ? 'Procesando…' : push.subscribed ? 'Desactivar' : 'Activar notificaciones'}
            </button>
          </div>
        )}

        {push.error && <p role="alert" className="text-sm text-red-600">{push.error}</p>}
      </section>

      <section className="card space-y-3 p-5" aria-labelledby="demo-data-title">
        <div>
          <h2 id="demo-data-title" className="flex items-center gap-2 font-bold text-ink"><Database size={18} /> Datos de la demostración</h2>
          <p className="mt-1 text-sm text-slate-500">
            Las notas, usuarios, áreas, adjuntos, imágenes y audios se guardan en IndexedDB, dentro de este navegador.
            No se envían a ningún servidor. Si borras los datos del sitio desde el navegador, la demostración se perderá.
          </p>
        </div>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>Los cambios se conservan al cerrar y volver a abrir el navegador.</li>
          <li>Al cerrar sesión no se borran los datos: puedes volver a entrar y encontrarlos.</li>
          <li>Restablecer la demostración borra solo la base local de esta aplicación y vuelve a crear los ejemplos.</li>
        </ul>
        <div>
          <button
            type="button"
            className="btn-danger"
            disabled={resettingDemo}
            onClick={() => setConfirmResetDemo(true)}
          >
            <RotateCcw size={16} /> {resettingDemo ? 'Restableciendo…' : 'Restablecer demostración'}
          </button>
        </div>
      </section>

      <section className="card p-5 text-sm text-slate-600" aria-labelledby="local-title">
        <h2 id="local-title" className="mb-2 flex items-center gap-2 font-bold text-ink"><HardDrive size={18} /> Configuración local del sistema</h2>
        <p>Volver a la configuración predeterminada del sistema</p>
        
        <div className="mt-4">
          <button type="button" className="btn-outline" onClick={() => setConfirm(true)}><RotateCcw size={16} /> Restablecer configuración predeterminada</button>
        </div>
      </section>

      {confirm && (
        <ConfirmDialog
          title="Restablecer configuración"
          message="Se restaurarán los valores predeterminados del tema, el formato de hora y el primer día de la semana. Tus notas no se modificarán."
          confirmLabel="Restablecer"
          onCancel={() => setConfirm(false)}
          onConfirm={() => { setPrefs(DEFAULT_PREFS); toast('Configuración restablecida'); setConfirm(false); }}
        />
      )}

      {confirmResetDemo && (
        <ConfirmDialog
          title="Restablecer demostración"
          message="Se borrarán todas las notas, usuarios, áreas y archivos multimedia creados en esta demostración. Después se generarán de nuevo los datos de ejemplo. Tu sesión de demostración se mantendrá abierta. Esta acción no se puede deshacer."
          confirmLabel={resettingDemo ? 'Restableciendo…' : 'Borrar y restablecer'}
          onCancel={() => { if (!resettingDemo) setConfirmResetDemo(false); }}
          onConfirm={() => { void handleResetDemo(); }}
        />
      )}
    </>
  );
}
