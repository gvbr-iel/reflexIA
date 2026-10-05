/**
 * @module services/workPacingService
 *
 * Capa de servicio para la Historia de Usuario 6:
 * Regulación del ritmo de trabajo y límites de intentos (RF-06).
 *
 * Responsabilidades:
 * - Leer la configuración de plazos e intentos que fijó el profesor guía.
 * - Guardarla y restablecerla a los valores por defecto.
 *
 * Estado actual: **mock local con localStorage**.
 * Cuando el backend esté disponible, se reemplazan las funciones
 * internas por llamadas Axios/Fetch sin cambiar la firma pública.
 *
 * Regla R4 (AI_GUIDELINES §9): las vistas y componentes NO llaman
 * a la API directamente; lo hacen a través de este servicio.
 *
 * Este servicio NO conoce HU-03 ni HU-04: solo guarda lo configurado, y
 * por actividad. Los valores por defecto los resuelve el hook
 * `useWorkPacing`. Hoy los servicios de talleres y de marco teórico todavía
 * no leen esta configuración (ver HU06_GUIA.md, "Modificaciones futuras").
 */

import type { PacingValues, WorkPacingConfig } from '../models/workPacing';
import { PACING_LIMITS } from '../models/workPacing';
import { isValidDateString } from '../utils/workPacingDates';

// ─────────────────────────────────────────────
// Claves de localStorage (mock temporal)
// ─────────────────────────────────────────────

const STORAGE_KEYS = {
  CONFIG: 'reflexia_work_pacing',
} as const;

/** Latencia simulada para que se vean los estados de carga. */
const MOCK_LATENCY_MS = 400;

// ─────────────────────────────────────────────
// Errores
// ─────────────────────────────────────────────

/** Motivo de un error; el hook lo traduce a un mensaje para el usuario. */
export type WorkPacingErrorCode = 'invalid-attempts' | 'invalid-deadline';

export class WorkPacingError extends Error {
  readonly code: WorkPacingErrorCode;

  constructor(code: WorkPacingErrorCode) {
    super(code);
    this.name = 'WorkPacingError';
    this.code = code;
  }
}

// ─────────────────────────────────────────────
// Funciones auxiliares
// ─────────────────────────────────────────────

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const EMPTY_CONFIG: WorkPacingConfig = { overrides: {}, updatedAt: null };

/** Lee la configuración; si no existe o el JSON está dañado, devuelve una vacía. */
function readConfig(): WorkPacingConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!raw) return { ...EMPTY_CONFIG, overrides: {} };

    const parsed = JSON.parse(raw) as Partial<WorkPacingConfig>;
    if (parsed && typeof parsed.overrides === 'object' && parsed.overrides !== null) {
      return { overrides: parsed.overrides, updatedAt: parsed.updatedAt ?? null };
    }
  } catch {
    // JSON inválido: se parte de una configuración vacía.
  }
  return { ...EMPTY_CONFIG, overrides: {} };
}

function writeConfig(config: WorkPacingConfig): void {
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
}

/** Valida cada actividad como lo haría el backend. */
function validate(overrides: PacingValues): void {
  for (const pacing of Object.values(overrides)) {
    const { minAttempts, maxAttempts } = PACING_LIMITS;
    if (
      !Number.isInteger(pacing.maxAttempts) ||
      pacing.maxAttempts < minAttempts ||
      pacing.maxAttempts > maxAttempts
    ) {
      throw new WorkPacingError('invalid-attempts');
    }
    if (pacing.deadline !== null && !isValidDateString(pacing.deadline)) {
      throw new WorkPacingError('invalid-deadline');
    }
  }
}

// ─────────────────────────────────────────────
// Servicio público
// ─────────────────────────────────────────────

/**
 * Servicio de plazos e intentos.
 *
 * Firma estable: cuando el backend esté listo, se reemplazan
 * los cuerpos de cada método sin cambiar la interfaz pública.
 */
export const workPacingService = {

  /**
   * Devuelve la configuración guardada (solo las actividades modificadas).
   *
   * Producción: GET /api/work-pacing
   */
  async fetchConfig(): Promise<WorkPacingConfig> {
    // TODO: Reemplazar por llamada Axios al backend
    // return axios.get<WorkPacingConfig>('/api/work-pacing');
    await wait(MOCK_LATENCY_MS);
    return readConfig();
  },

  /**
   * Guarda la configuración, reemplazando la anterior.
   *
   * Lanza `WorkPacingError` si algún valor no es válido.
   * Producción: PUT /api/work-pacing
   */
  async saveConfig(overrides: PacingValues): Promise<WorkPacingConfig> {
    // TODO: Reemplazar por llamada Axios al backend
    // return axios.put<WorkPacingConfig>('/api/work-pacing', { overrides });
    await wait(MOCK_LATENCY_MS);

    validate(overrides);
    const config: WorkPacingConfig = { overrides, updatedAt: new Date().toISOString() };
    writeConfig(config);
    return config;
  },

  /**
   * Elimina la configuración del profesor: todo vuelve a los valores por defecto.
   *
   * Producción: DELETE /api/work-pacing
   */
  async resetConfig(): Promise<WorkPacingConfig> {
    // TODO: Reemplazar por llamada Axios al backend
    // return axios.delete<WorkPacingConfig>('/api/work-pacing');
    await wait(MOCK_LATENCY_MS);

    localStorage.removeItem(STORAGE_KEYS.CONFIG);
    return { overrides: {}, updatedAt: null };
  },
};
