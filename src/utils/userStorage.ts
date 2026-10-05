import { firebaseAuth } from '../services/firebase'

export function getUserStorageKey(key: string): string {
  const uid = firebaseAuth?.currentUser?.uid
  if (!uid) {
    throw new Error('Se requiere una sesión activa para acceder a los datos del estudiante.')
  }
  return `${key}:${uid}`
}

export function readUserStorage<T>(key: string): T | null {
  const scopedKey = getUserStorageKey(key)
  try {
    const raw = localStorage.getItem(scopedKey)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeUserStorage<T>(key: string, value: T): void {
  localStorage.setItem(getUserStorageKey(key), JSON.stringify(value))
}
