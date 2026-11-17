import { useState } from 'react';
import type { Note } from '../../types/note';
import { useNotes } from '../../hooks/useNotes';
import { usePrefs } from '../../hooks/usePrefs';
import { Modal, useToast } from '../ui/ui';
import { dueAt, fmtDate, fmtTime, toISODate, toTime } from '../../utils/dates';

export default function PostponeModal({ note, onClose }: { note: Note; onClose: () => void }) {
  const { postpone } = useNotes(); const [prefs] = usePrefs(); const toast = useToast();
  const [date, setDate] = useState(note.date); const [time, setTime] = useState(note.time ?? '09:00'); const [err, setErr] = useState('');
  function quick(k: 'h' | 'd' | 'w') {
    const d = new Date();
    if (k === 'h') d.setHours(d.getHours() + 1); else if (k === 'd') { d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); } else d.setDate(d.getDate() + 7);
    setDate(toISODate(d)); setTime(toTime(d)); setErr('');
  }
  async function confirm() {
    if (!date || !time) { setErr('Elige fecha y hora.'); return; }
    if (dueAt({ date, time }).getTime() <= Date.now()) { setErr('Elige una fecha y hora futuras.'); return; }
    if (await postpone(note, date, time)) { toast(`Nota pospuesta al ${fmtDate(date)} a las ${fmtTime(time, prefs.hourFormat === '12')}`); onClose(); }
  }
  return (
    <Modal title="Posponer nota" onClose={onClose}>
      <p className="mb-3 text-sm text-slate-600">«{note.title}»</p>
      <div className="mb-4 flex flex-wrap gap-2">
        <button className="btn-outline" onClick={() => quick('h')}>Una hora</button>
        <button className="btn-outline" onClick={() => quick('d')}>Hasta mañana</button>
        <button className="btn-outline" onClick={() => quick('w')}>Una semana</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label" htmlFor="pd">Nueva fecha</label><input id="pd" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div><label className="label" htmlFor="ph">Nueva hora</label><input id="ph" type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} /></div>
      </div>
      {err && <p role="alert" className="mt-2 text-sm text-red-600">{err}</p>}
      <div className="mt-5 flex justify-end gap-2"><button className="btn-ghost" onClick={onClose}>Cancelar</button><button className="btn-primary" onClick={confirm}>Posponer</button></div>
    </Modal>
  );
}
