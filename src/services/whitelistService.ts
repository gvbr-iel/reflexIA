/**
 * @module services/whitelistService
 *
 * Capa de servicio para la Historia de Usuario 1:
 * Gestión de la whitelist de correos autorizados (RF-01 / RNF-02).
 *
 * Responsabilidades:
 * - Listar los correos autorizados.
 * - Autorizar un correo o importar una carga masiva.
 * - Revocar y restablecer accesos de forma inmediata.
 * - Verificar si un correo puede ingresar (lo usará RF-08).
 *
 * Estado actual: **mock local con localStorage**.
 * Cuando el backend esté disponible, se reemplazan las funciones
 * internas por llamadas Axios/Fetch sin cambiar la firma pública.
 *
 * Regla R4 (AI_GUIDELINES §9): las vistas y componentes NO llaman
 * a la API directamente; lo hacen a través de este servicio.
 */

import type {
  WhitelistEntry,
  WhitelistRole,
  AddEntryPayload,
  BulkImportPayload,
  BulkImportResult,
  AccessCheckResult,
} from '../models/whitelist';

import {
  normalizeEmail,
  validateInstitutionalEmail,
} from '../utils/institutionalEmail';

// ─────────────────────────────────────────────
// Claves de localStorage (mock temporal)
// ─────────────────────────────────────────────

const STORAGE_KEYS = {
  ENTRIES: 'reflexia_whitelist',
} as const;

/** Latencia simulada para que se vean los estados de carga. */
const MOCK_LATENCY_MS = 400;

// ─────────────────────────────────────────────
// Errores
// ─────────────────────────────────────────────

/** Motivo de un error de la whitelist; el hook lo traduce a un mensaje. */
export type WhitelistErrorCode =
  | 'invalid-format'
  | 'invalid-domain'
  | 'already-active'
  | 'not-found';

export class WhitelistError extends Error {
  readonly code: WhitelistErrorCode;

  constructor(code: WhitelistErrorCode) {
    super(code);
    this.name = 'WhitelistError';
    this.code = code;
  }
}

// ─────────────────────────────────────────────
// Datos iniciales (mock)
// ─────────────────────────────────────────────
// TODO: Eliminar cuando exista GET /api/whitelist.
// Correos ficticios: no corresponden a personas reales.

const SEED: Array<[string, WhitelistRole, string, string | null]> = [
  ['coordinacion.practica@ucen.cl', 'teacher', '2026-08-03T13:00:00.000Z', null],
  ['profesor.guia01@ucen.cl', 'teacher', '2026-08-03T13:05:00.000Z', null],
  ['profesor.guia02@ucen.cl', 'teacher', '2026-08-03T13:06:00.000Z', null],
  ['profesor.guia03@ucen.cl', 'teacher', '2026-08-04T14:20:00.000Z', '2026-09-15T12:00:00.000Z'],
  ['estudiante.practica01@ucen.cl', 'student', '2026-08-10T15:00:00.000Z', null],
  ['estudiante.practica02@ucen.cl', 'student', '2026-08-10T15:00:00.000Z', null],
  ['estudiante.practica03@ucen.cl', 'student', '2026-08-10T15:00:00.000Z', null],
  ['estudiante.practica04@ucen.cl', 'student', '2026-08-10T15:00:00.000Z', null],
  ['estudiante.practica05@ucen.cl', 'student', '2026-08-10T15:00:00.000Z', '2026-09-01T18:30:00.000Z'],
  ['estudiante.practica06@ucen.cl', 'student', '2026-08-10T15:00:00.000Z', null],
  ['estudiante.practica07@ucen.cl', 'student', '2026-08-10T15:00:00.000Z', null],
  ['estudiante.practica08@ucen.cl', 'student', '2026-08-12T16:40:00.000Z', null],
  ['estudiante.practica09@ucen.cl', 'student', '2026-08-12T16:40:00.000Z', null],
  ['estudiante.practica10@ucen.cl', 'student', '2026-08-12T16:40:00.000Z', '2026-09-22T14:10:00.000Z'],
  ['estudiante.practica11@ucen.cl', 'student', '2026-08-20T19:15:00.000Z', null],
  ['estudiante.practica12@ucen.cl', 'student', '2026-08-20T19:15:00.000Z', null],
];

function buildSeed(): WhitelistEntry[] {
  return SEED.map(([email, role, addedAt, revokedAt], index) => ({
    id: `wl-seed-${String(index + 1).padStart(2, '0')}`,
    email,
    role,
    status: revokedAt ? 'revoked' : 'active',
    addedAt,
    revokedAt,
  }));
}

// ─────────────────────────────────────────────
// Funciones auxiliares
// ─────────────────────────────────────────────

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createId(): string {
  return `wl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Lee la whitelist de localStorage. La primera vez (o si el JSON está
 * dañado) la inicializa con los datos de ejemplo.
 */
function readEntries(): WhitelistEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ENTRIES);
    if (raw) return JSON.parse(raw) as WhitelistEntry[];
  } catch {
    // JSON inválido: se reinicia con los datos de ejemplo.
  }

  const seed = buildSeed();
  writeEntries(seed);
  return seed;
}

function writeEntries(entries: WhitelistEntry[]): void {
  localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
}

/** Ordena de la más reciente a la más antigua por fecha de alta. */
function sortByNewest(entries: WhitelistEntry[]): WhitelistEntry[] {
  return [...entries].sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

/** Cambia el estado de una entrada y devuelve la entrada actualizada. */
function setStatus(id: string, revoke: boolean): WhitelistEntry {
  const entries = readEntries();
  const entry = entries.find((e) => e.id === id);
  if (!entry) throw new WhitelistError('not-found');

  entry.status = revoke ? 'revoked' : 'active';
  entry.revokedAt = revoke ? new Date().toISOString() : null;
  writeEntries(entries);
  return { ...entry };
}

// ─────────────────────────────────────────────
// Servicio público
// ─────────────────────────────────────────────

/**
 * Servicio de la whitelist.
 *
 * Firma estable: cuando el backend esté listo, se reemplazan
 * los cuerpos de cada método sin cambiar la interfaz pública.
 */
export const whitelistService = {

  /**
   * Lista todos los correos autorizados, del más reciente al más antiguo.
   *
   * Producción: GET /api/whitelist
   */
  async fetchEntries(): Promise<WhitelistEntry[]> {
    // TODO: Reemplazar por llamada Axios al backend
    // return axios.get<WhitelistEntry[]>('/api/whitelist');
    await wait(MOCK_LATENCY_MS);
    return sortByNewest(readEntries());
  },

  /**
   * Autoriza un correo. Si estaba revocado, lo reactiva con el perfil indicado.
   *
   * Lanza `WhitelistError` si el correo no es válido o ya está activo.
   * Producción: POST /api/whitelist
   */
  async addEntry(
    payload: AddEntryPayload,
  ): Promise<{ entry: WhitelistEntry; reactivated: boolean }> {
    // TODO: Reemplazar por llamada Axios al backend
    // return axios.post('/api/whitelist', payload);
    await wait(MOCK_LATENCY_MS);

    const validation = validateInstitutionalEmail(payload.email);
    if (validation !== 'valid') throw new WhitelistError(validation);

    const email = normalizeEmail(payload.email);
    const entries = readEntries();
    const existing = entries.find((e) => e.email === email);

    if (existing?.status === 'active') throw new WhitelistError('already-active');

    if (existing) {
      existing.status = 'active';
      existing.role = payload.role;
      existing.revokedAt = null;
      writeEntries(entries);
      return { entry: { ...existing }, reactivated: true };
    }

    const entry: WhitelistEntry = {
      id: createId(),
      email,
      role: payload.role,
      status: 'active',
      addedAt: new Date().toISOString(),
      revokedAt: null,
    };
    writeEntries([...entries, entry]);
    return { entry, reactivated: false };
  },

  /**
   * Importa una carga masiva. Omite correos inválidos, repetidos o ya
   * activos, y reactiva los revocados con el perfil indicado.
   *
   * Producción: POST /api/whitelist/bulk
   */
  async importEntries(payload: BulkImportPayload): Promise<BulkImportResult> {
    // TODO: Reemplazar por llamada Axios al backend
    // return axios.post<BulkImportResult>('/api/whitelist/bulk', payload);
    await wait(MOCK_LATENCY_MS * 2);

    const entries = readEntries();
    const byEmail = new Map(entries.map((e) => [e.email, e]));
    const now = new Date().toISOString();
    const result: BulkImportResult = { added: 0, reactivated: 0, skipped: 0 };

    for (const raw of payload.emails) {
      const email = normalizeEmail(raw);
      const existing = byEmail.get(email);

      if (validateInstitutionalEmail(email) !== 'valid' || existing?.status === 'active') {
        result.skipped++;
        continue;
      }

      if (existing) {
        existing.status = 'active';
        existing.role = payload.role;
        existing.revokedAt = null;
        result.reactivated++;
        continue;
      }

      const entry: WhitelistEntry = {
        id: createId(),
        email,
        role: payload.role,
        status: 'active',
        addedAt: now,
        revokedAt: null,
      };
      entries.push(entry);
      byEmail.set(email, entry);
      result.added++;
    }

    writeEntries(entries);
    return result;
  },

  /**
   * Revoca el acceso de inmediato: el siguiente `checkAccess` lo rechaza.
   *
   * Producción: PATCH /api/whitelist/:id { status: 'revoked' }
   */
  async revokeAccess(id: string): Promise<WhitelistEntry> {
    // TODO: Reemplazar por llamada Axios al backend
    await wait(MOCK_LATENCY_MS);
    return setStatus(id, true);
  },

  /**
   * Restablece el acceso de un correo revocado.
   *
   * Producción: PATCH /api/whitelist/:id { status: 'active' }
   */
  async restoreAccess(id: string): Promise<WhitelistEntry> {
    // TODO: Reemplazar por llamada Axios al backend
    await wait(MOCK_LATENCY_MS);
    return setStatus(id, false);
  },

  /**
   * Verifica si un correo puede ingresar: debe ser `@ucen.cl` y estar
   * activo en la whitelist. Pensado para el inicio de sesión (RF-08).
   *
   * Producción: POST /api/auth/check-access
   */
  async checkAccess(email: string): Promise<AccessCheckResult> {
    // TODO: Reemplazar por llamada Axios al backend
    const validation = validateInstitutionalEmail(email);
    if (validation !== 'valid') return { allowed: false, reason: 'invalid-domain' };

    const entry = readEntries().find((e) => e.email === normalizeEmail(email));
    if (!entry) return { allowed: false, reason: 'not-registered' };
    if (entry.status === 'revoked') return { allowed: false, reason: 'revoked' };
    return { allowed: true, role: entry.role };
  },
};
