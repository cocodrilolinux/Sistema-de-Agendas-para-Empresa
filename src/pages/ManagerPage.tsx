import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff, FolderCog, Pencil, Plus, Power, Save, ShieldCheck, Trash2, UserCog, UserPlus, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAreas } from '../hooks/useAreas';
import { ConfirmDialog, useToast } from '../components/ui/ui';
import { departmentLabel } from './DepartmentFilters';
import type { Area } from '../services/areas/areas';
import type { Department } from '../types/note';
import type { Role, User } from '../types/user';


function AccessRow({ target, isSelf, areas, onSave, onDelete }: { target: User; isSelf: boolean; areas: Area[]; onSave: (id: string, role: Role, area_id: Department | null) => void; onDelete: (target: User) => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const employeeAreas = areas.filter((area) => area.active && area.id !== 'gerencia');
  const targetArea = target.area_id ? areas.find((area) => area.id === target.area_id) : null;
  const areaChoices = targetArea && targetArea.id !== 'gerencia' && !employeeAreas.some((area) => area.id === targetArea.id)
    ? [targetArea, ...employeeAreas]
    : employeeAreas;
  const initial = target.role === 'manager'
    ? 'manager'
    : target.area_id && target.area_id !== 'gerencia'
      ? target.area_id
      : areaChoices[0]?.id ?? '';
  const [selection, setSelection] = useState(initial);

  const current = target.role === 'manager' ? 'manager' : target.area_id ?? '';
  const dirty = selection !== current;

  function save() {
    if (selection === 'manager') onSave(target.id, 'manager', null);
    else onSave(target.id, 'employee', selection);
  }

  const assignment = target.role === 'manager'
    ? 'Gerente / Acceso global'
    : target.area_id
      ? departmentLabel(target.area_id)
      : 'Sin área';

  return (
    <li className="card p-4">
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">
          {target.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-ink">{target.name}</p>
            {isSelf && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">Tú</span>}
          </div>
          <p className="truncate text-sm text-slate-500">{target.email}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${target.role === 'manager' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>
              {assignment}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
              <span className="font-mono tracking-widest">{showPassword ? (target.password || 'No disponible') : '••••••••'}</span>
              <button
                type="button"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
                title={target.password ? (showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña') : 'Contraseña no disponible'}
                disabled={!target.password}
                onClick={() => setShowPassword((value) => !value)}
                className="rounded p-0.5 text-slate-500 hover:text-slate-800 disabled:opacity-40"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </span>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-end gap-2 sm:w-auto">
          <div>
            <label className="label !mb-1 !text-xs" htmlFor={`assignment-${target.id}`}>Área / Departamento</label>
            <select
              id={`assignment-${target.id}`}
              className="input !py-1.5"
              value={selection}
              onChange={(e) => setSelection(e.target.value)}
            >
              <option value="manager">Gerente / Acceso global</option>
              {areaChoices.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.label}{area.active ? '' : ' (inactiva)'}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="btn-primary !px-3 !py-1.5"
            disabled={!dirty}
            onClick={save}
          >
            <Save size={15} /> Guardar
          </button>
          <button
            type="button"
            className="btn-ghost !px-2 !py-1.5 text-red-600"
            disabled={isSelf}
            title={isSelf ? 'No puedes eliminar tu propia cuenta' : 'Eliminar usuario'}
            aria-label={`Eliminar a ${target.name}`}
            onClick={() => onDelete(target)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </li>
  );
}

function CreateUserForm({ areas, onCreated }: { areas: Area[]; onCreated: () => void }) {
  const { createUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [areaId, setAreaId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const employeeAreas = areas.filter((area) => area.active && area.id !== 'gerencia');

  async function submit(event: FormEvent) {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    if (!cleanName || !cleanEmail || !password || !role || (role === 'employee' && !areaId)) {
      const message = 'Todos los campos son obligatorios. Completa nombre, correo, contraseña, rol y área.';
      setError(message);
      toast(message, 'error');
      return;
    }
    setError('');
    try {
      await createUser({
        name: cleanName,
        email: cleanEmail,
        password,
        role,
        area_id: role === 'employee' ? areaId : null,
      });
      setName('');
      setEmail('');
      setPassword('');
      setRole('');
      setAreaId('');
      setShowPassword(false);
      toast('Usuario creado correctamente');
      onCreated();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo crear el usuario.';
      setError(message);
      toast(message, 'error');
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</div>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="new-user-name">Nombre de usuario / Nombre completo</label>
          <input id="new-user-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Ana Martínez" autoComplete="off" />
        </div>
        <div>
          <label className="label" htmlFor="new-user-email">Correo electrónico</label>
          <input id="new-user-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ana@empresa.com" autoComplete="off" />
        </div>
        <div>
          <label className="label" htmlFor="new-user-password">Contraseña</label>
          <div className="relative">
            <input
              id="new-user-password"
              type={showPassword ? 'text' : 'password'}
              className="input pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
            />
            <button
              type="button"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-800"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="new-user-role">Rol</label>
          <select id="new-user-role" className="input" value={role} onChange={(e) => setRole(e.target.value as Role | '')}>
            <option value="">Selecciona un rol</option>
            <option value="manager">Gerente / Acceso global</option>
            <option value="employee">Empleado</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="new-user-area">Área / Departamento</label>
          <select
            id="new-user-area"
            className="input"
            value={role === 'manager' ? 'gerencia' : areaId}
            onChange={(e) => setAreaId(e.target.value)}
            disabled={role !== 'employee'}
          >
            <option value="">Selecciona un área</option>
            {role === 'manager' && <option value="gerencia">Acceso global (todas las áreas)</option>}
            {employeeAreas.map((area) => <option key={area.id} value={area.id}>{area.label}</option>)}
          </select>
          {role === 'manager' && <p className="mt-1 text-xs text-slate-400">Los gerentes tienen acceso global; no es necesario asignarles un área operativa.</p>}
        </div>
      </div>
      <div className="flex justify-end">
        <button type="submit" className="btn-primary"><UserPlus size={16} /> Crear usuario</button>
      </div>
    </form>
  );
}



function AreaRow({ area, onDelete }: { area: Area; onDelete: (area: Area) => void }) {
  const { renameArea, setAreaActive } = useAreas();
  const toast = useToast();
  const [label, setLabel] = useState(area.label);
  const [editing, setEditing] = useState(false);
  const locked = area.id === 'gerencia';
  const dirty = label.trim() !== area.label;

  async function save() {
    try {
      await renameArea(area.id, label);
      toast('Área actualizada');
      setEditing(false);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo actualizar el área.', 'error');
    }
  }

  async function toggle() {
    try {
      await setAreaActive(area.id, !area.active);
      toast(area.active ? 'Área desactivada' : 'Área activada');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo cambiar el estado del área.', 'error');
    }
  }

  return (
    <li className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
      {editing && !locked ? (
        <input className="input !w-auto flex-1 !py-1.5" value={label} onChange={(e) => setLabel(e.target.value)} autoFocus />
      ) : (
        <span className={`flex-1 text-sm font-semibold ${area.active ? 'text-ink' : 'text-slate-400 line-through'}`}>{area.label}</span>
      )}
      {!area.active && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">Inactiva</span>}
      {locked && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">Interna</span>}
      {editing && !locked ? (
        <>
          <button type="button" className="btn-primary !px-2 !py-1" onClick={save} disabled={!dirty}><Save size={14} /> Guardar</button>
          <button type="button" className="btn-ghost !px-2 !py-1" onClick={() => { setEditing(false); setLabel(area.label); }}>Cancelar</button>
        </>
      ) : (
        <>
          {!locked && <button type="button" className="btn-ghost !px-2 !py-1" onClick={() => setEditing(true)}><Pencil size={14} /> Renombrar</button>}
          <button type="button" className="btn-ghost !px-2 !py-1" onClick={toggle} disabled={locked}>
            <Power size={14} /> {area.active ? 'Desactivar' : 'Activar'}
          </button>
          {!locked && <button type="button" className="btn-ghost !px-2 !py-1 text-red-600" onClick={() => onDelete(area)}><Trash2 size={14} /> Eliminar</button>}
        </>
      )}
    </li>
  );
}

export default function ManagerPage() {
  const { user, listUsers, deleteUser, updateAccess } = useAuth();
  const { areas, loading: areasLoading, error: areasError, createArea, deleteArea } = useAreas();
  const toast = useToast();
  const isManager = user?.role === 'manager';
  const [users, setUsers] = useState<User[]>([]);
  const [newArea, setNewArea] = useState('');
  const [deleting, setDeleting] = useState<Area | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const reload = useCallback(async () => {
    if (!isManager) return;
    try {
      setUsers(await listUsers());
    } catch (cause) {
      setUsers([]);
      toast(cause instanceof Error ? cause.message : 'No se pudieron cargar los usuarios.', 'error');
    }
  }, [isManager, listUsers, toast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (!isManager) return <Navigate to="/" replace />;

  async function save(id: string, role: Role, area_id: Department | null) {
    try {
      await updateAccess(id, role, area_id);
      toast('Acceso actualizado');
      await reload();
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : 'No se pudo actualizar el acceso.', 'error');
    }
  }

  async function addArea(e: FormEvent) {
    e.preventDefault();
    try {
      await createArea(newArea);
      setNewArea('');
      toast('Área creada');
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : 'No se pudo crear el área.', 'error');
    }
  }

  async function confirmDeleteArea() {
    if (!deleting) return;
    try {
      if (users.some((u) => u.area_id === deleting.id)) {
        throw new Error('No puedes eliminar un área asignada a usuarios. Reasigna primero esas cuentas.');
      }
      await deleteArea(deleting.id);
      toast('Área eliminada');
      setDeleting(null);
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : 'No se pudo eliminar el área.', 'error');
    }
  }

  async function confirmDeleteUser() {
    if (!deletingUser) return;
    try {
      await deleteUser(deletingUser.id);
      toast('Usuario eliminado');
      setDeletingUser(null);
      await reload();
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : 'No se pudo eliminar el usuario.', 'error');
    }
  }

  const managers = users.filter((u) => u.role === 'manager').length;
  const employees = users.length - managers;

  return (
    <>
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-ink"><ShieldCheck className="text-violet-600" /> Gestión de Usuarios y Áreas</h1>
        <p className="-mt-2 text-sm text-slate-500">Solo gerencia puede crear cuentas. Asigna roles y áreas, y administra los departamentos disponibles.</p>
        {areasError && <div role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{areasError}</div>}
      </div>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Resumen de usuarios">
        <div className="card flex items-center gap-3 p-4"><span className="rounded-lg bg-brand-50 p-2 text-brand-600"><Users size={20} /></span><div><p className="text-xl font-extrabold text-ink">{employees}</p><p className="text-xs text-slate-500">Empleados</p></div></div>
        <div className="card flex items-center gap-3 p-4"><span className="rounded-lg bg-violet-50 p-2 text-violet-600"><ShieldCheck size={20} /></span><div><p className="text-xl font-extrabold text-ink">{managers}</p><p className="text-xs text-slate-500">Gerentes</p></div></div>
        <div className="card flex items-center gap-3 p-4"><span className="rounded-lg bg-slate-100 p-2 text-slate-600"><UserCog size={20} /></span><div><p className="text-xl font-extrabold text-ink">{users.length}</p><p className="text-xs text-slate-500">Usuarios activos</p></div></div>
      </section>

      <section className="card p-4" aria-label="Crear usuario">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-ink"><UserPlus size={19} /> Crear usuario</h2>
        <p className="mb-4 text-sm text-slate-500">Completa todos los campos. El nuevo usuario aparecerá de inmediato en la lista de usuarios activos.</p>
        <CreateUserForm areas={areas} onCreated={() => { void reload(); }} />
      </section>

 

      <section className="card p-4" aria-label="Usuarios registrados">
        <h2 className="mb-1 text-lg font-bold text-ink">Usuarios activos</h2>
        <p className="mb-4 text-sm text-slate-500">Asigna «Gerente / Acceso global» o un área operativa, consulta la contraseña con el ojito o elimina cuentas con la papelera.</p>
        {users.length === 0
          ? <p className="py-6 text-center text-sm text-slate-500">Todavía no hay usuarios activos.</p>
          : <ul className="space-y-3">{users.map((u) => (
            <AccessRow
              key={`${u.id}:${u.role}:${u.area_id ?? 'none'}:${areas.length}`}
              target={u}
              isSelf={u.id === user?.id}
              areas={areas}
              onSave={save}
              onDelete={setDeletingUser}
            />
          ))}</ul>}
      </section>

      <section className="card p-4" aria-label="Áreas y departamentos">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-ink"><FolderCog size={19} /> Áreas y departamentos</h2>
        <p className="mb-4 text-sm text-slate-500">Las áreas activas aparecen al crear y asignar usuarios. Los cambios se aplican al instante.</p>
        <form onSubmit={addArea} className="mb-3 flex flex-wrap gap-2">
          <input className="input flex-1" placeholder="Nueva área, por ejemplo: Marketing" value={newArea} onChange={(e) => setNewArea(e.target.value)} />
          <button type="submit" className="btn-primary" disabled={newArea.trim().length < 2}><Plus size={16} /> Añadir área</button>
        </form>
        {areasLoading ? <p className="py-4 text-center text-sm text-slate-500">Cargando áreas…</p> : <ul className="space-y-2">{areas.map((a) => <AreaRow key={`${a.id}:${a.label}:${a.active}`} area={a} onDelete={setDeleting} />)}</ul>}
      </section>
      {deleting && (
        <ConfirmDialog
          title="Eliminar área"
          message={`Se eliminará el área «${deleting.label}». Las notas ya guardadas conservarán su referencia original.`}
          confirmLabel="Eliminar área"
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDeleteArea}
        />
      )}
      {deletingUser && (
        <ConfirmDialog
          title="Eliminar usuario"
          message={`Se eliminará la cuenta de «${deletingUser.name}» (${deletingUser.email}). Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar usuario"
          onCancel={() => setDeletingUser(null)}
          onConfirm={confirmDeleteUser}
        />
      )}
    </>
  );
}
