import { firebaseAuth } from '../services/firebase'

export function getUserStorageKey(key: string): string {
  const uid = firebaseAuth?.currentUser?.uid
  if (!uid) {
    throw new Error('Se requiere una sesión activa para acceder a los datos del estudiante.')
  }
  return `${key}:${uid}`
}
