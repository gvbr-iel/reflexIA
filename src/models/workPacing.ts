/**
 * @module models/workPacing
 *
 * Tipos y constantes para la Historia de Usuario 6:
 * Regulación del ritmo de trabajo y límites de intentos (RF-06).
 *
 * El profesor guía configura, por actividad (el marco teórico y los
 * talleres 1 a 4), una fecha límite y un máximo de intentos.
 *
 * Centralizado en src/models/ para que HU-03 (talleres) y HU-04 (marco
 * teórico) puedan leer esta configuración sin depender del feature
 * work-pacing/ cuando se conecten (ver HU06_GUIA.md, "Modificaciones futuras").
 */

// ─────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────

/** Identificador de la actividad del marco teórico (HU-04). */
export const THEORY_ACTIVITY_ID = 'theory-quiz';

/**
 * Límites de intentos que el profesor puede configurar.
 *
 * [POR DEFINIR] AI_GUIDELINES §11 deja abierta la cantidad de intentos
 * (¿2 o 3?): con este panel la decide el profesor dentro de este rango.
 */
export const PACING_LIMITS = {
  minAttempts: 1,
  maxAttempts: 10,
} as const;

// ─────────────────────────────────────────────
// Actividades
// ─────────────────────────────────────────────

/** Tipo de actividad: la evaluación del marco teórico o un taller. */
export type ActivityKind = 'theory' | 'workshop';

/** Configuración editable de una actividad. */
export type ActivityPacing = {
  /** Fecha límite en formato YYYY-MM-DD (null si no tiene plazo). */
  deadline: string | null;
  /** Máximo de intentos permitidos. */
  maxAttempts: number;
};

/** Actividad del flujo del estudiante con sus valores por defecto. */
export interface PacingActivity {
  /** Identificador de la actividad ("theory-quiz" o "workshop-1" a "workshop-4"). */
  id: string;
  kind: ActivityKind;
  /** Posición en el flujo lineal: 0 es el marco teórico, 1 a 4 los talleres. */
  order: number;
  /** Título corto (e.g. "Taller 1"). */
  title: string;
  /** Tema o descripción breve de la actividad. */
  topic: string;
  /** Valores vigentes en la plataforma antes de que el profesor los cambie. */
  defaultPacing: ActivityPacing;
}

/** Configuración por actividad, indexada por el id de la actividad. */
export type PacingValues = Record<string, ActivityPacing>;

// ─────────────────────────────────────────────
// Configuración guardada
// ─────────────────────────────────────────────

/**
 * Configuración que persiste el servicio.
 *
 * `overrides` guarda **solo** las actividades que el profesor cambió: así
 * los valores por defecto siguen siendo los de la plataforma.
 */
export interface WorkPacingConfig {
  overrides: PacingValues;
  /** Marca temporal ISO 8601 del último guardado (null si nunca se guardó). */
  updatedAt: string | null;
}
