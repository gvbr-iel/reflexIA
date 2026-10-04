/**
 * @module services/whitelistService
 *
 * La whitelist de acceso y la administración de HU-01 viven en Cloud
 * Firestore. La lectura de listas y escrituras requieren claims de admin;
 * cada usuario autenticado solo puede consultar el documento de su correo.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
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

const COLLECTION_NAME = 'whitelist'
const MAX_BATCH_SIZE = 450

export type WhitelistErrorCode =
  | 'invalid-format'
  | 'invalid-domain'
  | 'already-active'
  | 'not-found'

export class WhitelistError extends Error {
  readonly code: WhitelistErrorCode

  constructor(code: WhitelistErrorCode) {
    super(code)
    this.name = 'WhitelistError'
    this.code = code
  }
}

function getDatabase() {
  if (!firestoreDb) {
    throw new Error('Firebase no está configurado. Revisa las variables VITE_FIREBASE_*.')
  }
  return firestoreDb
}

function isWhitelistRole(value: unknown): value is WhitelistRole {
  return value === 'student' || value === 'teacher'
}

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

function validateEmail(email: string): string {
  const validation = validateInstitutionalEmail(email)
  if (validation !== 'valid') throw new WhitelistError(validation)
  return normalizeEmail(email)
}

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
    transaction.set(reference, updated)
    return updated
  })
}

export const whitelistService = {
  async fetchEntries(): Promise<WhitelistEntry[]> {
    const entriesQuery = query(
      collection(getDatabase(), COLLECTION_NAME),
      orderBy('addedAt', 'desc'),
    )
    const snapshot = await getDocs(entriesQuery)
    return snapshot.docs.map((item) => parseEntry(item.id, item.data()))
  },

  async addEntry(
    payload: AddEntryPayload,
  ): Promise<{ entry: WhitelistEntry; reactivated: boolean }> {
    const email = validateEmail(payload.email)
    const database = getDatabase()
    const reference = doc(database, COLLECTION_NAME, email)
    const existingSnapshot = await getDoc(reference)

    if (existingSnapshot.exists()) {
      const existing = parseEntry(existingSnapshot.id, existingSnapshot.data())
      if (existing.status === 'active') throw new WhitelistError('already-active')

      const entry: WhitelistEntry = {
        ...existing,
        role: payload.role,
        status: 'active',
        revokedAt: null,
      }
      await setDoc(reference, entry)
      return { entry, reactivated: true }
    }

    const entry = createEntry(email, payload.role)
    await setDoc(reference, entry)
    return { entry, reactivated: false }
  },

  async importEntries(payload: BulkImportPayload): Promise<BulkImportResult> {
    const database = getDatabase()
    const snapshot = await getDocs(collection(database, COLLECTION_NAME))
    const entries = new Map(
      snapshot.docs.map((item) => [item.id, parseEntry(item.id, item.data())]),
    )
    const result: BulkImportResult = { added: 0, reactivated: 0, skipped: 0 }
    const writes: WhitelistEntry[] = []
    const seen = new Set<string>()
    const now = new Date().toISOString()

    for (const rawEmail of payload.emails) {
      if (validateInstitutionalEmail(rawEmail) !== 'valid') {
        result.skipped++
        continue
      }

      const email = normalizeEmail(rawEmail)
      if (seen.has(email)) {
        result.skipped++
        continue
      }
      seen.add(email)

      const existing = entries.get(email)
      if (existing?.status === 'active') {
        result.skipped++
        continue
      }

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

    for (let start = 0; start < writes.length; start += MAX_BATCH_SIZE) {
      const batch = writeBatch(database)
      writes.slice(start, start + MAX_BATCH_SIZE).forEach((entry) => {
        batch.set(doc(database, COLLECTION_NAME, entry.id), entry)
      })
      await batch.commit()
    }

    return result
  },

  async revokeAccess(id: string): Promise<WhitelistEntry> {
    return setAccessStatus(id, true)
  },

  async restoreAccess(id: string): Promise<WhitelistEntry> {
    return setAccessStatus(id, false)
  },

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
}
