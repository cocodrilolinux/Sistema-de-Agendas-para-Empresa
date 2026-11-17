import type { Note } from '../../types/note';
import type { User } from '../../types/user';
import type { Area } from '../areas/areas';
import { toISODate } from '../../utils/dates';
import {
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
  DEMO_SEED_VERSION,
  DEMO_USER_ID,
} from './constants';
import {
  getMediaBlob,
  getMeta,
  putMediaBlob,
  putNote,
  putSeedArea,
  putSeedUser,
  setMeta,
} from './repository';

const SEED_FLAG = 'seed:initialized';
const SEED_VERSION_KEY = 'seed:version';
const SEED_COMPLETED_KEY = 'seed:completedAt';

const DEMO_PASSWORD = 'Demo2026#';

function isoDaysAgo(days: number, hour = 9, minute = 0): string {
  const value = new Date();
  value.setDate(value.getDate() - days);
  value.setHours(hour, minute, 0, 0);
  return value.toISOString();
}

function dateOffset(days: number): string {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return toISODate(value);
}

const AREAS: Area[] = [
  { id: 'gerencia', label: 'Gerencia', active: true, builtin: true, createdAt: isoDaysAgo(240) },
  { id: 'administracion', label: 'Administración', active: true, builtin: true, createdAt: isoDaysAgo(240) },
  { id: 'contabilidad', label: 'Contabilidad', active: true, builtin: true, createdAt: isoDaysAgo(240) },
  { id: 'ventas', label: 'Ventas', active: true, builtin: true, createdAt: isoDaysAgo(240) },
  { id: 'soporte', label: 'Soporte Técnico', active: true, builtin: true, createdAt: isoDaysAgo(240) },
  { id: 'marketing', label: 'Marketing', active: true, builtin: true, createdAt: isoDaysAgo(210) },
];

const USERS: User[] = [
  {
    id: DEMO_USER_ID,
    name: 'Administrador Demo',
    email: DEMO_ADMIN_EMAIL,
    password: DEMO_ADMIN_PASSWORD,
    role: 'manager',
    area_id: 'gerencia',
  },
  {
    id: 'user-ana-demo',
    name: 'Ana Demo',
    email: 'ana.demo@demo.local',
    password: DEMO_PASSWORD,
    role: 'employee',
    area_id: 'administracion',
  },
  {
    id: 'user-carlos-demo',
    name: 'Carlos Demo',
    email: 'carlos.demo@demo.local',
    password: DEMO_PASSWORD,
    role: 'employee',
    area_id: 'contabilidad',
  },
  {
    id: 'user-maria-demo',
    name: 'María Demo',
    email: 'maria.demo@demo.local',
    password: DEMO_PASSWORD,
    role: 'employee',
    area_id: 'ventas',
  },
  {
    id: 'user-javier-demo',
    name: 'Javier Demo',
    email: 'javier.demo@demo.local',
    password: DEMO_PASSWORD,
    role: 'employee',
    area_id: 'soporte',
  },
  {
    id: 'user-sofia-demo',
    name: 'Sofía Demo',
    email: 'sofia.demo@demo.local',
    password: DEMO_PASSWORD,
    role: 'employee',
    area_id: 'marketing',
  },
];

const ACTA_IMAGE_ID = 'seed-media-acta';
const VOICE_AUDIO_ID = 'seed-media-voz';

function buildActaImage(): Blob {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="620" viewBox="0 0 900 620">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f8fafc"/>
      <stop offset="1" stop-color="#eef2ff"/>
    </linearGradient>
  </defs>
  <rect width="900" height="620" fill="url(#bg)"/>
  <rect x="60" y="50" width="780" height="520" rx="18" fill="#ffffff" stroke="#c7d2fe" stroke-width="3"/>
  <rect x="60" y="50" width="780" height="74" rx="18" fill="#5b49bb"/>
  <text x="100" y="97" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="bold" fill="#ffffff">Acta de reunión · Demostración</text>
  <text x="100" y="176" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="bold" fill="#161a3d">Objetivo</text>
  <text x="100" y="210" font-family="Arial, Helvetica, sans-serif" font-size="19" fill="#475569">Revisar el avance del presupuesto y acordar los próximos pasos.</text>
  <text x="100" y="278" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="bold" fill="#161a3d">Acuerdos</text>
  <circle cx="116" cy="315" r="7" fill="#6d5bd0"/>
  <text x="138" y="322" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#475569">Validar las partidas de gasto operativo del trimestre.</text>
  <circle cx="116" cy="355" r="7" fill="#6d5bd0"/>
  <text x="138" y="362" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#475569">Solicitar tres cotizaciones adicionales antes del viernes.</text>
  <circle cx="116" cy="395" r="7" fill="#6d5bd0"/>
  <text x="138" y="402" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#475569">Compartir el informe final con Gerencia y Administración.</text>
  <rect x="100" y="452" width="700" height="76" rx="12" fill="#f1efff"/>
  <text x="124" y="482" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="bold" fill="#4a3a9c">Documento ficticio</text>
  <text x="124" y="508" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="#5b49bb">Generado automáticamente para explorar los adjuntos de la agenda.</text>
</svg>`;
  return new Blob([svg], { type: 'image/svg+xml' });
}

function writeAscii(view: DataView, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

/** Genera un tono WAV corto para demostrar la reproducción de audio local. */
function buildVoiceSample(): Blob {
  const sampleRate = 8000;
  const seconds = 1.4;
  const totalSamples = Math.floor(sampleRate * seconds);
  const buffer = new ArrayBuffer(44 + totalSamples * 2);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + totalSamples * 2, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, totalSamples * 2, true);

  for (let index = 0; index < totalSamples; index += 1) {
    const time = index / sampleRate;
    const envelope = Math.min(1, index / 900) * Math.max(0, 1 - index / totalSamples);
    const sample = Math.sin(2 * Math.PI * 440 * time) * 0.22 * envelope;
    view.setInt16(44 + index * 2, Math.round(sample * 32767), true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function baseNote(overrides: Partial<Note> & Pick<Note, 'id' | 'title' | 'date' | 'area_id' | 'createdBy'>): Note {
  return {
    content: '',
    time: null,
    priority: 'normal',
    category: '',
    status: 'pending',
    shareType: null,
    sharedAreas: [],
    sharedUsers: [],
    audio: null,
    images: [],
    resolvedAt: null,
    changes: [],
    createdAt: isoDaysAgo(20),
    updatedAt: isoDaysAgo(1),
    deletedAt: null,
    ...overrides,
  };
}

function buildNotes(): Note[] {
  return [
    baseNote({
      id: 'demo-note-recordatorio',
      title: 'Revisar recordatorios del día',
      content: 'Comprobar la agenda de hoy y confirmar las reuniones con el equipo de ejemplo.',
      date: dateOffset(0),
      time: '08:00',
      priority: 'urgent',
      category: 'Organización',
      area_id: 'gerencia',
      createdBy: DEMO_USER_ID,
      sharedAreas: ['administracion'],
      shareType: 'area',
      createdAt: isoDaysAgo(2),
      updatedAt: isoDaysAgo(0, 7, 30),
    }),
    baseNote({
      id: 'demo-note-presupuesto',
      title: 'Revisar presupuesto trimestral',
      content: 'Validar las partidas de gasto operativo y preparar el resumen para la reunión de coordinación.',
      date: dateOffset(0),
      time: '09:30',
      priority: 'high',
      category: 'Finanzas',
      area_id: 'contabilidad',
      createdBy: 'user-carlos-demo',
      sharedAreas: ['gerencia'],
      sharedUsers: [DEMO_USER_ID],
      audio: { id: VOICE_AUDIO_ID, name: 'Nota de voz de ejemplo', type: 'audio/wav' },
      images: [{ id: ACTA_IMAGE_ID, name: 'acta-reunion-demo.svg', type: 'image/svg+xml' }],
      createdAt: isoDaysAgo(6),
      updatedAt: isoDaysAgo(0, 8, 10),
    }),
    baseNote({
      id: 'demo-note-proveedor',
      title: 'Llamada con proveedor de licencias',
      content: 'Confirmar precios, condiciones de renovación y fecha de facturación para el siguiente periodo.',
      date: dateOffset(0),
      time: '15:00',
      priority: 'normal',
      category: 'Compras',
      area_id: 'ventas',
      createdBy: 'user-maria-demo',
      sharedAreas: ['administracion'],
      shareType: 'area',
      createdAt: isoDaysAgo(4),
      updatedAt: isoDaysAgo(1),
    }),
    baseNote({
      id: 'demo-note-onboarding',
      title: 'Actualizar plantilla de onboarding',
      content: 'Incluir el nuevo circuito de bienvenida y los accesos a las herramientas internas de ejemplo.',
      date: dateOffset(-2),
      time: null,
      priority: 'high',
      category: 'Procesos',
      area_id: 'administracion',
      createdBy: 'user-ana-demo',
      sharedAreas: ['gerencia'],
      shareType: 'area',
      changes: [
        {
          at: isoDaysAgo(5, 11, 20),
          fromDate: dateOffset(-5),
          fromTime: '10:00',
          toDate: dateOffset(-2),
          toTime: null,
        },
      ],
      createdAt: isoDaysAgo(9),
      updatedAt: isoDaysAgo(5, 11, 20),
    }),
    baseNote({
      id: 'demo-note-incidencias',
      title: 'Informe de incidencias semanal',
      content: 'Cerrar el informe con las incidencias atendidas y las acciones preventivas propuestas.',
      date: dateOffset(-3),
      time: '17:00',
      priority: 'normal',
      category: 'Soporte',
      area_id: 'soporte',
      createdBy: 'user-javier-demo',
      status: 'missed',
      resolvedAt: isoDaysAgo(2, 9, 0),
      sharedAreas: ['gerencia'],
      shareType: 'area',
      createdAt: isoDaysAgo(12),
      updatedAt: isoDaysAgo(2, 9, 0),
    }),
    baseNote({
      id: 'demo-note-campana',
      title: 'Plan de campaña de septiembre',
      content: 'Definir públicos, mensajes y presupuesto de la campaña de captación de clientes de ejemplo.',
      date: dateOffset(5),
      time: '10:00',
      priority: 'normal',
      category: 'Marketing',
      area_id: 'marketing',
      createdBy: 'user-sofia-demo',
      sharedUsers: [DEMO_USER_ID],
      shareType: 'users',
      createdAt: isoDaysAgo(3),
      updatedAt: isoDaysAgo(1),
    }),
    baseNote({
      id: 'demo-note-cierre',
      title: 'Cierre contable mensual',
      content: 'Conciliar cuentas, revisar asientos pendientes y emitir el reporte de cierre.',
      date: dateOffset(12),
      time: null,
      priority: 'high',
      category: 'Contabilidad',
      area_id: 'contabilidad',
      createdBy: 'user-carlos-demo',
      sharedAreas: ['gerencia', 'administracion'],
      shareType: 'area',
      createdAt: isoDaysAgo(8),
      updatedAt: isoDaysAgo(2),
    }),
    baseNote({
      id: 'demo-note-entrevista',
      title: 'Entrevista de práctica profesional',
      content: 'Coordinar la entrevista, preparar la sala y enviar el formulario de evaluación al candidato.',
      date: dateOffset(-1),
      time: '11:00',
      priority: 'normal',
      category: 'Personas',
      area_id: 'administracion',
      createdBy: 'user-ana-demo',
      status: 'completed',
      resolvedAt: isoDaysAgo(1, 12, 15),
      sharedUsers: [DEMO_USER_ID],
      shareType: 'users',
      createdAt: isoDaysAgo(7),
      updatedAt: isoDaysAgo(1, 12, 15),
    }),
    baseNote({
      id: 'demo-note-coordinacion',
      title: 'Reunión de coordinación general',
      content: 'Puntos tratados: avance por áreas, prioridades del mes y acuerdos de seguimiento.',
      date: dateOffset(-1),
      time: '08:00',
      priority: 'normal',
      category: 'Reuniones',
      area_id: 'gerencia',
      createdBy: DEMO_USER_ID,
      status: 'completed',
      resolvedAt: isoDaysAgo(1, 9, 10),
      sharedAreas: ['administracion', 'ventas', 'soporte'],
      shareType: 'area',
      createdAt: isoDaysAgo(10),
      updatedAt: isoDaysAgo(1, 9, 10),
    }),
    baseNote({
      id: 'demo-note-vacaciones',
      title: 'Solicitud de vacaciones de ejemplo',
      content: 'Registrar la solicitud y confirmar la cobertura de tareas durante la ausencia.',
      date: dateOffset(3),
      time: null,
      priority: 'low',
      category: 'Personas',
      area_id: 'administracion',
      createdBy: 'user-ana-demo',
      sharedUsers: [DEMO_USER_ID],
      shareType: 'users',
      createdAt: isoDaysAgo(5),
      updatedAt: isoDaysAgo(5),
    }),
    baseNote({
      id: 'demo-note-demo-cliente',
      title: 'Preparar demostración para cliente',
      content: 'Repasar el guion, comprobar los accesos de prueba y preparar el material de apoyo.',
      date: dateOffset(2),
      time: '16:30',
      priority: 'urgent',
      category: 'Ventas',
      area_id: 'ventas',
      createdBy: 'user-maria-demo',
      sharedAreas: ['soporte'],
      sharedUsers: [DEMO_USER_ID, 'user-javier-demo'],
      changes: [
        {
          at: isoDaysAgo(1, 16, 5),
          fromDate: dateOffset(-2),
          fromTime: '11:00',
          toDate: dateOffset(2),
          toTime: '16:30',
        },
      ],
      createdAt: isoDaysAgo(6),
      updatedAt: isoDaysAgo(1, 16, 5),
    }),
    baseNote({
      id: 'demo-note-borrador',
      title: 'Borrador de propuesta comercial',
      content: 'Versión descartada de la propuesta. Se conserva en la papelera para probar la restauración.',
      date: dateOffset(-5),
      time: '14:00',
      priority: 'normal',
      category: 'Ventas',
      area_id: 'ventas',
      createdBy: 'user-maria-demo',
      sharedAreas: ['gerencia'],
      shareType: 'area',
      createdAt: isoDaysAgo(15),
      updatedAt: isoDaysAgo(1, 10, 0),
      deletedAt: isoDaysAgo(1, 10, 0),
    }),
  ];
}

/**
 * Inicializa los datos de ejemplo una única vez.
 * Si el visitante ya tiene datos (o los modificó), no se sobrescribe nada.
 */
export async function seedDemoData(): Promise<void> {
  const initialized = await getMeta<boolean>(SEED_FLAG);
  if (initialized) return;

  for (const area of AREAS) await putSeedArea(area);
  for (const user of USERS) await putSeedUser(user);

  if (!(await getMediaBlob(ACTA_IMAGE_ID))) {
    await putMediaBlob(ACTA_IMAGE_ID, buildActaImage());
  }
  if (!(await getMediaBlob(VOICE_AUDIO_ID))) {
    await putMediaBlob(VOICE_AUDIO_ID, buildVoiceSample());
  }

  for (const note of buildNotes()) await putNote(note);

  await setMeta(SEED_VERSION_KEY, DEMO_SEED_VERSION);
  await setMeta(SEED_COMPLETED_KEY, new Date().toISOString());
  await setMeta(SEED_FLAG, true);
}
