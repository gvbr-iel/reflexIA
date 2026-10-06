/**
 * @module utils/userStorage
 *
 * Almacenamiento local (`localStorage`) separado por usuario.
 *
 * Problema que resuelve: si dos personas usan el mismo navegador, no deben
 * ver los borradores ni los intentos de la otra. Para eso, cada clave se
 * guarda junto al UID de Firebase del usuario con sesión abierta:
 *
 *   "reflexia_incident_drafts"  →  "reflexia_incident_drafts:<uid>"
 *
 * La usan los servicios de talleres (HU-03), marco teórico (HU-04) y
 * reflexiones (HU-02). Todas las funciones toleran errores (cuota llena,
 * JSON dañado o sin sesión) sin romper la app.
 */

import { firebaseAuth } from '../services/firebase'

/**
 * Devuelve la clave completa para el usuario actual, o null si no hay sesión.
 *
 * @param key - Clave base (por ejemplo, "reflexia_theory_attempts").
 */
export function getUserStorageKey(key: string): string | null {
  // El "?." evita un error si Firebase no está configurado o no hay usuario.
  const uid = firebaseAuth?.currentUser?.uid
  if (!uid) {
    return null
  }
  return `${key}:${uid}`
}

/**
 * Lee y convierte desde JSON un valor guardado para el usuario actual.
 * Devuelve null si no hay sesión, si no existe o si el JSON está dañado.
 *
 * @typeParam T - Tipo del valor guardado (lo indica quien llama a la función).
 */
export function readUserStorage<T>(key: string): T | null {
  try {
    const scopedKey = getUserStorageKey(key)
    if (!scopedKey) return null
    const raw = localStorage.getItem(scopedKey)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    // JSON inválido o localStorage bloqueado: se trata como "no hay datos".
    return null
  }
}

/**
 * Guarda un valor (convertido a JSON) para el usuario actual.
 * Si no hay sesión, no guarda nada.
 */
export function writeUserStorage<T>(key: string, value: T): void {
  try {
    const scopedKey = getUserStorageKey(key)
    if (!scopedKey) return
    localStorage.setItem(scopedKey, JSON.stringify(value))
  } catch {
    // Se ignoran errores como exceder la cuota de almacenamiento del navegador.
  }
}
