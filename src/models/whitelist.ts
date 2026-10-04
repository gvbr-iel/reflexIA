/**
 * @module models/whitelist
 *
 * Tipos y constantes para la Historia de Usuario 1:
 * Gestión de la whitelist de correos autorizados (RF-01 / RNF-02).
 *
 * Centralizado en src/models/ para que el inicio de sesión (RF-08)
 * pueda consultar el acceso sin depender del feature admin-whitelist/.
 */

// ─────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────

/** Único dominio institucional permitido (RNF-02). */
export const INSTITUTIONAL_DOMAIN = '@ucen.cl';

/**
 * Perfiles que pueden estar en la whitelist: solo estudiantes y
 * profesores de la asignatura de práctica profesional.
 */
export const WHITELIST_ROLES = ['student', 'teacher'] as const;

export const WHITELIST_STATUSES = ['active', 'revoked'] as const;

// ─────────────────────────────────────────────
// Entradas de la whitelist
// ─────────────────────────────────────────────

/** Perfil del usuario autorizado. */
export type WhitelistRole = (typeof WHITELIST_ROLES)[number];

/** `active` puede ingresar; `revoked` tiene el acceso revocado. */
export type WhitelistStatus = (typeof WHITELIST_STATUSES)[number];

/** Textos de la interfaz para cada perfil. */
export const ROLE_LABELS: Record<WhitelistRole, string> = {
  student: 'Estudiante',
  teacher: 'Profesor guía',
};

/** Textos de la interfaz para cada estado. */
export const STATUS_LABELS: Record<WhitelistStatus, string> = {
  active: 'Activo',
  revoked: 'Revocado',
};

/**
 * Correo autorizado.
 *
 * Es un `type` (no `interface`) para que sea compatible con el
 * componente global `Table`, que exige `Record<string, unknown>`.
 */
export type WhitelistEntry = {
  /** Identificador único de la entrada. */
  id: string;
  /** Correo institucional en minúsculas (e.g. "usuario@ucen.cl"). */
  email: string;
  role: WhitelistRole;
  status: WhitelistStatus;
  /** Fecha de alta (ISO 8601). */
  addedAt: string;
  /** Fecha de revocación (ISO 8601) o null si está activo. */
  revokedAt: string | null;
};

/** Resumen de la whitelist para las tarjetas de la vista. */
export interface WhitelistStats {
  total: number;
  active: number;
  revoked: number;
  students: number;
  teachers: number;
}

// ─────────────────────────────────────────────
// Altas individuales y cargas masivas
// ─────────────────────────────────────────────

/** Datos para autorizar un correo. */
export interface AddEntryPayload {
  email: string;
  role: WhitelistRole;
}

/** Datos de una carga masiva: todos los correos con el mismo perfil. */
export interface BulkImportPayload {
  emails: string[];
  role: WhitelistRole;
}

/**
 * Resultado de revisar una línea de la carga masiva antes de importarla.
 *
 * - `new`: se agregará.
 * - `reactivate`: estaba revocado; se reactivará con el perfil elegido.
 * - `existing`: ya está activo; se omite.
 * - `duplicate`: se repite dentro del mismo archivo; se omite.
 * - `invalid-format`: no es un correo válido.
 * - `invalid-domain`: no es un correo `@ucen.cl`.
 */
export type BulkRowStatus =
  | 'new'
  | 'reactivate'
  | 'existing'
  | 'duplicate'
  | 'invalid-format'
  | 'invalid-domain';

/** Línea de la vista previa de la carga masiva. */
export interface BulkPreviewRow {
  /** Posición en el archivo (desde 1), para ubicar el error. */
  line: number;
  /** Valor tal como venía en el archivo. */
  value: string;
  status: BulkRowStatus;
}

/** Totales que devuelve el servicio tras una carga masiva. */
export interface BulkImportResult {
  added: number;
  reactivated: number;
  skipped: number;
}

// ─────────────────────────────────────────────
// Verificación de acceso (para RF-08)
// ─────────────────────────────────────────────

/** Motivo por el que se niega el acceso. */
export type AccessDeniedReason = 'invalid-domain' | 'not-registered' | 'revoked';

/** Respuesta de `whitelistService.checkAccess`. */
export type AccessCheckResult =
  | { allowed: true; role: WhitelistRole }
  | { allowed: false; reason: AccessDeniedReason };
