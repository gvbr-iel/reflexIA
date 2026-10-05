import { firebaseAuth } from '../services/firebase'

export function getUserStorageKey(key: string): string | null {
  const uid = firebaseAuth?.currentUser?.uid
  if (!uid) {
    return null
  }
  return `${key}:${uid}`
}

export function readUserStorage<T>(key: string): T | null {
  try {
    const scopedKey = getUserStorageKey(key)
    if (!scopedKey) return null
    const raw = localStorage.getItem(scopedKey)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeUserStorage<T>(key: string, value: T): void {
  try {
    const scopedKey = getUserStorageKey(key)
    if (!scopedKey) return
    localStorage.setItem(scopedKey, JSON.stringify(value))
  } catch {
    // Ignorar posibles errores al exceder cuota de almacenamiento
  }
}

