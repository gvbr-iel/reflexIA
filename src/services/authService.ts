/**
 * @module services/authService
 *
 * Capa de servicio de la autenticación (HU-08 / RF-08).
 *
 * Iniciar sesión tiene dos pasos, y ambos deben cumplirse (RNF-02):
 *   1. Firebase Authentication confirma que el correo y la contraseña son correctos.
 *   2. La whitelist de Firestore confirma que el correo está autorizado y
 *      entrega su rol (`student`, `teacher` o `admin`).
 * Si el paso 2 falla, se cierra la sesión del paso 1: nadie queda conectado
 * sin estar en la whitelist.
 *
 * Los errores se lanzan como `StudentAuthError` con un código corto; la vista
 * de login traduce ese código a un mensaje en español.
 */

import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'

import type { WhitelistRole } from '../models/whitelist'
import { validateInstitutionalEmail } from '../utils/institutionalEmail'
import { firebaseAuth } from './firebase'
import { whitelistService } from './whitelistService'

/**
 * Error de autenticación con un código que indica qué pasó:
 * - `invalid-email`: el correo no es institucional (@ucen.cl).
 * - `invalid-credentials`: correo o contraseña incorrectos.
 * - `unauthorized`: la cuenta existe, pero no está activa en la whitelist.
 * - `unavailable`: Firebase no responde, está mal configurado o hubo demasiados intentos.
 */
export class StudentAuthError extends Error {
  constructor(readonly code: 'invalid-email' | 'invalid-credentials' | 'unauthorized' | 'unavailable') {
    super(code)
    this.name = 'StudentAuthError'
  }
}

/** Alias con un nombre más general (sirve para cualquier rol, no solo estudiantes). */
export const AuthError = StudentAuthError

/** Devuelve el servicio de Firebase Auth o lanza `unavailable` si no está configurado. */
function getAuth() {
  if (!firebaseAuth) {
    throw new StudentAuthError('unavailable')
  }
  return firebaseAuth
}

/**
 * Inicia sesión con correo y contraseña y devuelve el usuario y su rol.
 *
 * @param email - Correo institucional (@ucen.cl).
 * @param password - Contraseña de la cuenta en Firebase.
 * @returns El usuario de Firebase y su rol según la whitelist.
 * @throws {StudentAuthError} Si el correo, las credenciales o la autorización fallan.
 */
export async function signInUser(
  email: string,
  password: string,
): Promise<{ user: User; role: WhitelistRole }> {
  // 0. Antes de llamar a Firebase, se descarta cualquier correo que no sea @ucen.cl.
  if (validateInstitutionalEmail(email) !== 'valid') {
    throw new StudentAuthError('invalid-email')
  }

  // 1. Firebase Authentication valida el correo y la contraseña.
  const auth = getAuth()
  let user: User
  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
    user = credential.user
  } catch (error) {
    // Firebase entrega errores con un "code" (por ejemplo "auth/wrong-password").
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? error.code
        : undefined
    // Todos estos códigos significan "correo o contraseña incorrectos".
    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/user-not-found' ||
      code === 'auth/wrong-password' ||
      code === 'auth/invalid-email'
    ) {
      throw new StudentAuthError('invalid-credentials')
    }
    // Cualquier otro error (sin conexión, demasiados intentos
    // "auth/too-many-requests", etc.) se informa como servicio no disponible.
    throw new StudentAuthError('unavailable')
  }

  // 2. La whitelist de Firestore confirma que el correo está autorizado y da su rol.
  try {
    const access = await whitelistService.checkAccess(user.email ?? email)
    if (!access.allowed || !access.role) {
      // No está en la whitelist (o fue revocado): se cierra la sesión recién abierta.
      await firebaseSignOut(auth)
      throw new StudentAuthError('unauthorized')
    }
    return { user, role: access.role }
  } catch (error) {
    // Si ya es nuestro error ('unauthorized'), se deja pasar tal cual.
    if (error instanceof StudentAuthError) throw error
    // Si Firestore falló, por seguridad también se cierra la sesión.
    await firebaseSignOut(auth)
    throw new StudentAuthError('unavailable')
  }
}

/** Versión antigua de `signInUser` que solo devuelve el usuario (se mantiene por compatibilidad). */
export async function signInStudent(email: string, password: string): Promise<User> {
  const result = await signInUser(email, password)
  return result.user
}

/**
 * Consulta la whitelist para saber si un correo está autorizado y con qué rol.
 * La usa `AuthContext` cuando la app se recarga con una sesión ya abierta.
 */
export async function verifyUserAccess(
  email: string,
): Promise<{ authorized: boolean; role?: WhitelistRole }> {
  const access = await whitelistService.checkAccess(email)
  return access.allowed
    ? { authorized: true, role: access.role }
    : { authorized: false }
}

/** Alias con el nombre antiguo (se mantiene por compatibilidad). */
export const verifyStudentAccess = verifyUserAccess

/** Cierra la sesión actual en Firebase. */
export async function signOutStudent(): Promise<void> {
  await firebaseSignOut(getAuth())
}

/** Alias con un nombre más general (sirve para cualquier rol). */
export const signOutUser = signOutStudent
