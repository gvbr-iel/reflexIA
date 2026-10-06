/**
 * @module services/whitelistService
 *
 * Capa de servicio de la whitelist (HU-01 / RF-01 y RNF-02).
 *
 * La whitelist es la lista de correos autorizados a entrar a ReflexIA. Vive
 * en Cloud Firestore, en la colección `whitelist`, con un documento por
 * correo (el id del documento es el mismo correo en minúsculas).
 *
 * Dos tipos de uso:
 * - Administración (solo rol admin): listar, agregar, cargar masivamente,
 *   revocar y restablecer accesos.
 * - Verificación (cualquier usuario autenticado): `checkAccess` y
 *   `watchAccess` consultan solo el documento del propio correo.
 *
 * Los permisos los aplican las reglas de seguridad de Firestore, no este archivo.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  writeBatch,
} from 'firebase/firestore'

import type {
  AccessCheckResult,
  AddEntryPayload,
  BulkImportPayload,
  BulkImportResult,
  WhitelistEntry,
  WhitelistRole,
} from '../models/whitelist'
import { firestoreDb } from './firebase'
import { normalizeEmail, validateInstitutionalEmail } from '../utils/institutionalEmail'

/** Nombre de la colección de Firestore. */
const COLLECTION_NAME = 'whitelist'
/**
 * Escrituras por lote en la carga masiva. Firestore permite hasta 500 por
 * lote; se usa 450 para tener margen.
 */
const MAX_BATCH_SIZE = 450

/**
 * Motivos de error que el hook traduce a mensajes en español:
 * - `invalid-format` / `invalid-domain`: el correo no es válido o no es @ucen.cl.
 * - `already-active`: el correo ya tiene acceso.
 * - `not-found`: no existe el registro que se quiere modificar.
 */
export type WhitelistErrorCode =
  | 'invalid-format'
  | 'invalid-domain'
  | 'already-active'
  | 'not-found'

/** Error de la whitelist con un código que indica qué falló. */
export class WhitelistError extends Error {
  readonly code: WhitelistErrorCode

  constructor(code: WhitelistErrorCode) {
    super(code)
    this.name = 'WhitelistError'
    this.code = code
  }
}

// ─────────────────────────────────────────────
// Funciones auxiliares (privadas de este archivo)
// ─────────────────────────────────────────────

/** Devuelve la base de datos o lanza un error si Firebase no está configurado. */
function getDatabase() {
  if (!firestoreDb) {
    throw new Error('Firebase no está configurado. Revisa las variables VITE_FIREBASE_*.')
  }
  return firestoreDb
}

/**
 * Indica si un valor es un rol válido. Es un "type guard": si devuelve true,
 * TypeScript sabe que `value` es de tipo `WhitelistRole`.
 */
function isWhitelistRole(value: unknown): value is WhitelistRole {
  return value === 'student' || value === 'teacher' || value === 'admin'
}

/**
 * Convierte un documento de Firestore en un `WhitelistEntry`, revisando que
 * cada campo tenga el tipo correcto. Si algo no cuadra, lanza un error en vez
 * de dejar pasar datos corruptos a la interfaz.
 */
function parseEntry(id: string, value: Record<string, unknown>): WhitelistEntry {
  if (
    typeof value.email !== 'string' ||
    !isWhitelistRole(value.role) ||
    (value.status !== 'active' && value.status !== 'revoked') ||
    typeof value.addedAt !== 'string' ||
    (value.revokedAt !== null && typeof value.revokedAt !== 'string')
  ) {
    throw new Error(`El registro de whitelist "${id}" tiene un formato inválido.`)
  }

  return {
    id,
    email: value.email,
    role: value.role,
    status: value.status,
    addedAt: value.addedAt,
    revokedAt: value.revokedAt,
  }
}

/** Crea un registro nuevo, activo y con la fecha de hoy. */
function createEntry(email: string, role: WhitelistRole): WhitelistEntry {
  return {
    id: email,
    email,
    role,
    status: 'active',
    addedAt: new Date().toISOString(),
    revokedAt: null,
  }
}

/**
 * Deja solo los campos que se guardan en Firestore. El `id` no se guarda
 * dentro del documento porque ya es el nombre del documento.
 */
function serializeEntry(entry: WhitelistEntry) {
  return {
    email: entry.email,
    role: entry.role,
    status: entry.status,
    addedAt: entry.addedAt,
    revokedAt: entry.revokedAt,
  }
}

/** Valida el correo (formato y dominio @ucen.cl) y lo devuelve normalizado. */
function validateEmail(email: string): string {
  const validation = validateInstitutionalEmail(email)
  if (validation !== 'valid') throw new WhitelistError(validation)
  return normalizeEmail(email)
}

/**
 * Revoca (`revoke = true`) o restablece (`revoke = false`) un acceso.
 *
 * Usa una transacción: lee y escribe el documento como una sola operación,
 * así dos administradores no se pisan si cambian el mismo correo a la vez.
 */
async function setAccessStatus(id: string, revoke: boolean): Promise<WhitelistEntry> {
  const database = getDatabase()
  const reference = doc(database, COLLECTION_NAME, id)

  return runTransaction(database, async (transaction) => {
    const snapshot = await transaction.get(reference)
    if (!snapshot.exists()) throw new WhitelistError('not-found')

    const current = parseEntry(snapshot.id, snapshot.data())
    const updated: WhitelistEntry = {
      ...current,
      status: revoke ? 'revoked' : 'active',
      revokedAt: revoke ? new Date().toISOString() : null,
    }
    transaction.set(reference, serializeEntry(updated))
    return updated
  })
}

// ─────────────────────────────────────────────
// Servicio público
// ─────────────────────────────────────────────

/** Operaciones de la whitelist. Los hooks llaman a este objeto; las vistas no (regla R4). */
export const whitelistService = {
  /** Lista todos los registros, del más reciente al más antiguo. Solo admin. */
  async fetchEntries(): Promise<WhitelistEntry[]> {
    const entriesQuery = query(
      collection(getDatabase(), COLLECTION_NAME),
      orderBy('addedAt', 'desc'),
    )
    const snapshot = await getDocs(entriesQuery)
    return snapshot.docs.map((item) => parseEntry(item.id, item.data()))
  },

  /**
   * Agrega un correo con un rol. Si el correo existía pero estaba revocado,
   * se reactiva (`reactivated: true`) en vez de crear un registro nuevo.
   *
   * @throws {WhitelistError} `invalid-format`, `invalid-domain` o `already-active`.
   */
  async addEntry(
    payload: AddEntryPayload,
  ): Promise<{ entry: WhitelistEntry; reactivated: boolean }> {
    const email = validateEmail(payload.email)
    const database = getDatabase()
    const reference = doc(database, COLLECTION_NAME, email)
    const existingSnapshot = await getDoc(reference)

    // Caso 1: el correo ya existe → error si está activo, reactivar si estaba revocado.
    if (existingSnapshot.exists()) {
      const existing = parseEntry(existingSnapshot.id, existingSnapshot.data())
      if (existing.status === 'active') throw new WhitelistError('already-active')

      const entry: WhitelistEntry = {
        ...existing,
        role: payload.role,
        status: 'active',
        revokedAt: null,
      }
      await setDoc(reference, serializeEntry(entry))
      return { entry, reactivated: true }
    }

    // Caso 2: el correo es nuevo → se crea el registro.
    const entry = createEntry(email, payload.role)
    await setDoc(reference, serializeEntry(entry))
    return { entry, reactivated: false }
  },

  /**
   * Carga masiva: agrega o reactiva varios correos con el mismo rol.
   * Devuelve cuántos se agregaron, cuántos se reactivaron y cuántos se
   * omitieron (inválidos, repetidos en la lista o que ya estaban activos).
   */
  async importEntries(payload: BulkImportPayload): Promise<BulkImportResult> {
    const database = getDatabase()
    // Se leen todos los registros una sola vez y se guardan en un Map (correo → registro)
    // para consultar rápido si cada correo ya existe.
    const snapshot = await getDocs(collection(database, COLLECTION_NAME))
    const entries = new Map(
      snapshot.docs.map((item) => [item.id, parseEntry(item.id, item.data())]),
    )
    const result: BulkImportResult = { added: 0, reactivated: 0, skipped: 0 }
    // Registros que hay que escribir en Firestore.
    const writes: WhitelistEntry[] = []
    // Correos ya procesados, para omitir los repetidos dentro de la misma carga.
    const seen = new Set<string>()
    const now = new Date().toISOString()

    // Se clasifica cada correo de la carga.
    for (const rawEmail of payload.emails) {
      // Inválido o de otro dominio → se omite.
      if (validateInstitutionalEmail(rawEmail) !== 'valid') {
        result.skipped++
        continue
      }

      // Repetido dentro de la misma carga → se omite.
      const email = normalizeEmail(rawEmail)
      if (seen.has(email)) {
        result.skipped++
        continue
      }
      seen.add(email)

      // Ya tiene acceso activo → se omite.
      const existing = entries.get(email)
      if (existing?.status === 'active') {
        result.skipped++
        continue
      }

      // Existía revocado → se reactiva; si no existía → se crea.
      if (existing) {
        writes.push({
          ...existing,
          role: payload.role,
          status: 'active',
          revokedAt: null,
        })
        result.reactivated++
      } else {
        writes.push({
          ...createEntry(email, payload.role),
          addedAt: now,
        })
        result.added++
      }
    }

    // Se escriben los cambios en lotes de MAX_BATCH_SIZE (límite de Firestore).
    for (let start = 0; start < writes.length; start += MAX_BATCH_SIZE) {
      const batch = writeBatch(database)
      writes.slice(start, start + MAX_BATCH_SIZE).forEach((entry) => {
        batch.set(doc(database, COLLECTION_NAME, entry.id), serializeEntry(entry))
      })
      await batch.commit()
    }

    return result
  },

  /** Revoca el acceso de un correo (deja de poder entrar de inmediato). */
  async revokeAccess(id: string): Promise<WhitelistEntry> {
    return setAccessStatus(id, true)
  },

  /** Restablece el acceso de un correo revocado. */
  async restoreAccess(id: string): Promise<WhitelistEntry> {
    return setAccessStatus(id, false)
  },

  /**
   * Consulta UNA vez si un correo puede entrar y con qué rol.
   * La usan el login (`authService`) y la recarga de la app (`AuthContext`).
   */
  async checkAccess(email: string): Promise<AccessCheckResult> {
    const validation = validateInstitutionalEmail(email)
    if (validation !== 'valid') return { allowed: false, reason: 'invalid-domain' }

    const normalizedEmail = normalizeEmail(email)
    const snapshot = await getDoc(doc(getDatabase(), COLLECTION_NAME, normalizedEmail))
    if (!snapshot.exists()) return { allowed: false, reason: 'not-registered' }

    const entry = parseEntry(snapshot.id, snapshot.data())
    if (entry.status === 'revoked') return { allowed: false, reason: 'revoked' }
    return { allowed: true, role: entry.role }
  },

  /**
   * Escucha en TIEMPO REAL el registro de un correo. Cada vez que cambia en
   * Firestore (por ejemplo, un admin lo revoca), llama a `onChange`.
   *
   * @returns Una función que deja de escuchar (se llama al cerrar sesión).
   */
  watchAccess(
    email: string,
    onChange: (result: AccessCheckResult) => void,
    onError: (error: Error) => void,
  ): () => void {
    const validation = validateInstitutionalEmail(email)
    if (validation !== 'valid') {
      onChange({ allowed: false, reason: 'invalid-domain' })
      return () => undefined
    }

    const normalizedEmail = normalizeEmail(email)
    // onSnapshot se ejecuta al inicio y después en cada cambio del documento.
    return onSnapshot(
      doc(getDatabase(), COLLECTION_NAME, normalizedEmail),
      (snapshot) => {
        if (!snapshot.exists()) {
          onChange({ allowed: false, reason: 'not-registered' })
          return
        }

        const entry = parseEntry(snapshot.id, snapshot.data())
        if (entry.status === 'revoked') {
          onChange({ allowed: false, reason: 'revoked' })
          return
        }
        onChange({ allowed: true, role: entry.role })
      },
      onError,
    )
  },
}
