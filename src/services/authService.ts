import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'

import type { WhitelistRole } from '../models/whitelist'
import { validateInstitutionalEmail } from '../utils/institutionalEmail'
import { firebaseAuth } from './firebase'
import { whitelistService } from './whitelistService'

export class StudentAuthError extends Error {
  constructor(readonly code: 'invalid-email' | 'invalid-credentials' | 'unauthorized' | 'unavailable') {
    super(code)
    this.name = 'StudentAuthError'
  }
}

function getAuth() {
  if (!firebaseAuth) {
    throw new StudentAuthError('unavailable')
  }
  return firebaseAuth
}

export async function signInStudent(email: string, password: string): Promise<User> {
  if (validateInstitutionalEmail(email) !== 'valid') {
    throw new StudentAuthError('invalid-email')
  }

  const auth = getAuth()
  let user: User
  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
    user = credential.user
  } catch (error) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? error.code
        : undefined
    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/user-not-found' ||
      code === 'auth/wrong-password' ||
      code === 'auth/invalid-email'
    ) {
      throw new StudentAuthError('invalid-credentials')
    }
    if (code === 'auth/too-many-requests') {
      throw new StudentAuthError('unavailable')
    }
    throw new StudentAuthError('unavailable')
  }

  try {
    const access = await whitelistService.checkAccess(user.email ?? email)
    if (!access.allowed || access.role !== 'student') {
      await firebaseSignOut(auth)
      throw new StudentAuthError('unauthorized')
    }
  } catch (error) {
    if (error instanceof StudentAuthError) throw error
    await firebaseSignOut(auth)
    throw new StudentAuthError('unavailable')
  }

  return user
}

export async function verifyStudentAccess(
  email: string,
): Promise<{ authorized: boolean; role?: WhitelistRole }> {
  const access = await whitelistService.checkAccess(email)
  return access.allowed && access.role === 'student'
    ? { authorized: true, role: access.role }
    : { authorized: false }
}

export async function signOutStudent(): Promise<void> {
  await firebaseSignOut(getAuth())
}
