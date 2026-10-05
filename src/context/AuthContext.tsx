import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'

import type { WhitelistRole } from '../models/whitelist'
import { whitelistService } from '../services/whitelistService'
import { firebaseAuth, isFirebaseConfigured } from '../services/firebase'
import { signInUser, signOutStudent, verifyUserAccess } from '../services/authService'

interface AuthContextValue {
  user: User | null
  role: WhitelistRole | null
  status: 'loading' | 'authenticated' | 'unauthenticated' | 'error'
  signIn: (email: string, password: string) => Promise<WhitelistRole>
  signOut: () => Promise<void>
  retryAuthorization: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<WhitelistRole | null>(null)
  const [status, setStatus] = useState<AuthContextValue['status']>('loading')
  const [authorizationAttempt, setAuthorizationAttempt] = useState(0)
  const latestAttempt = useRef(0)

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseAuth) {
      setStatus('error')
      return
    }

    let isMounted = true
    let unsubscribeAuthorization: (() => void) | null = null
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      const attempt = ++latestAttempt.current
      unsubscribeAuthorization?.()
      unsubscribeAuthorization = null
      if (!firebaseUser) {
        if (isMounted) {
          setUser(null)
          setRole(null)
          setStatus('unauthenticated')
        }
        return
      }

      setStatus('loading')
      try {
        const access = await verifyUserAccess(firebaseUser.email ?? '')
        if (!isMounted || attempt !== latestAttempt.current) return

        if (!access.authorized || !access.role) {
          await signOutStudent()
          return
        }

        setUser(firebaseUser)
        setRole(access.role)
        setStatus('authenticated')
        unsubscribeAuthorization = whitelistService.watchAccess(
          firebaseUser.email ?? '',
          (currentAccess) => {
            if (!isMounted || attempt !== latestAttempt.current) return
            if (currentAccess.allowed) {
              setRole(currentAccess.role)
              return
            }

            void signOutStudent().catch((error: unknown) => {
              if (!isMounted || attempt !== latestAttempt.current) return
              console.error('No se pudo cerrar una sesión revocada:', error)
              setUser(null)
              setRole(null)
              setStatus('error')
            })
          },
          (error) => {
            if (!isMounted || attempt !== latestAttempt.current) return
            console.error('No se pudo monitorear la autorización:', error)
            setUser(null)
            setRole(null)
            setStatus('error')
          },
        )
      } catch (error) {
        if (!isMounted || attempt !== latestAttempt.current) return
        console.error('No se pudo verificar el acceso institucional:', error)
        setUser(null)
        setRole(null)
        setStatus('error')
      }
    })

    return () => {
      isMounted = false
      unsubscribeAuthorization?.()
      unsubscribe()
    }
  }, [authorizationAttempt])

  const signIn = useCallback(async (email: string, password: string): Promise<WhitelistRole> => {
    const result = await signInUser(email, password)
    setUser(result.user)
    setRole(result.role)
    setStatus('authenticated')
    return result.role
  }, [])

  const signOut = useCallback(async () => {
    await signOutStudent()
    setUser(null)
    setRole(null)
    setStatus('unauthenticated')
  }, [])

  const retryAuthorization = useCallback(() => {
    setStatus('loading')
    setAuthorizationAttempt((attempt) => attempt + 1)
  }, [])

  const value = useMemo(
    () => ({ user, role, status, signIn, signOut, retryAuthorization }),
    [user, role, status, signIn, signOut, retryAuthorization],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

