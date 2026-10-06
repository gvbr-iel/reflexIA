/**
 * @module context/AuthContext
 *
 * Estado global de la sesión (HU-08), compartido con toda la app mediante la
 * Context API de React.
 *
 * `AuthProvider` envuelve la aplicación (ver `main.tsx`) y guarda:
 * - `user`: el usuario de Firebase que inició sesión (o null).
 * - `role`: su rol según la whitelist (`student`, `teacher` o `admin`).
 * - `status`: en qué punto está la verificación (cargando, autenticado, etc.).
 *
 * Cualquier componente lee estos datos con el hook `useAuth()`, sin tener que
 * pasarlos como props de componente en componente.
 *
 * Además, mientras la sesión está abierta, escucha en tiempo real el registro
 * del usuario en la whitelist: si un administrador le revoca el acceso, la
 * sesión se cierra sola.
 */

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

/** Todo lo que el contexto entrega a los componentes. */
interface AuthContextValue {
  /** Usuario de Firebase con sesión abierta (null si no hay sesión). */
  user: User | null
  /** Rol del usuario según la whitelist (null si no hay sesión). */
  role: WhitelistRole | null
  /**
   * Estado de la verificación:
   * - `loading`: se está comprobando la sesión o la whitelist.
   * - `authenticated`: sesión válida y autorizada.
   * - `unauthenticated`: no hay sesión.
   * - `error`: no se pudo verificar (sin conexión o Firebase mal configurado).
   */
  status: 'loading' | 'authenticated' | 'unauthenticated' | 'error'
  /** Inicia sesión y devuelve el rol, para que el login sepa a dónde redirigir. */
  signIn: (email: string, password: string) => Promise<WhitelistRole>
  /** Cierra la sesión. */
  signOut: () => Promise<void>
  /** Vuelve a intentar la verificación cuando el estado es `error`. */
  retryAuthorization: () => void
}

/** El contexto en sí. Empieza en null: solo tiene valor dentro de AuthProvider. */
export const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

/** Proveedor de la sesión: debe envolver a todos los componentes que usan `useAuth()`. */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<WhitelistRole | null>(null)
  const [status, setStatus] = useState<AuthContextValue['status']>('loading')
  // Cambiar este número vuelve a ejecutar el useEffect de abajo (botón "Reintentar").
  const [authorizationAttempt, setAuthorizationAttempt] = useState(0)
  // Cuenta las verificaciones. Si llega la respuesta de una verificación vieja,
  // se ignora para que no pise a una más reciente.
  const latestAttempt = useRef(0)

  useEffect(() => {
    // Sin configuración de Firebase no se puede verificar nada.
    if (!isFirebaseConfigured || !firebaseAuth) {
      setStatus('error')
      return
    }

    // isMounted evita actualizar el estado si el componente ya se desmontó.
    let isMounted = true
    // Función para dejar de escuchar la whitelist (se asigna más abajo).
    let unsubscribeAuthorization: (() => void) | null = null

    // onAuthStateChanged avisa cada vez que la sesión de Firebase cambia:
    // al cargar la app, al iniciar sesión y al cerrarla.
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      const attempt = ++latestAttempt.current
      // Si escuchábamos la whitelist de un usuario anterior, se deja de escuchar.
      unsubscribeAuthorization?.()
      unsubscribeAuthorization = null

      // Caso 1: no hay sesión abierta.
      if (!firebaseUser) {
        if (isMounted) {
          setUser(null)
          setRole(null)
          setStatus('unauthenticated')
        }
        return
      }

      // Caso 2: hay sesión; falta confirmar que el correo siga en la whitelist.
      setStatus('loading')
      try {
        const access = await verifyUserAccess(firebaseUser.email ?? '')
        // Si mientras esperábamos empezó otra verificación, esta ya no sirve.
        if (!isMounted || attempt !== latestAttempt.current) return

        // No autorizado: se cierra la sesión. onAuthStateChanged volverá a
        // llamarse sin usuario y caerá en el "Caso 1".
        if (!access.authorized || !access.role) {
          await signOutStudent()
          return
        }

        // Autorizado: se guardan el usuario y su rol.
        setUser(firebaseUser)
        setRole(access.role)
        setStatus('authenticated')

        // Desde ahora se escucha en tiempo real su registro en la whitelist.
        unsubscribeAuthorization = whitelistService.watchAccess(
          firebaseUser.email ?? '',
          (currentAccess) => {
            if (!isMounted || attempt !== latestAttempt.current) return
            // Sigue autorizado: solo se actualiza el rol (pudo cambiar).
            if (currentAccess.allowed) {
              setRole(currentAccess.role)
              return
            }

            // Le revocaron el acceso: se cierra la sesión.
            void signOutStudent().catch((error: unknown) => {
              if (!isMounted || attempt !== latestAttempt.current) return
              console.error('No se pudo cerrar una sesión revocada:', error)
              setUser(null)
              setRole(null)
              setStatus('error')
            })
          },
          // Error al escuchar la whitelist: se muestra el estado de error.
          (error) => {
            if (!isMounted || attempt !== latestAttempt.current) return
            console.error('No se pudo monitorear la autorización:', error)
            setUser(null)
            setRole(null)
            setStatus('error')
          },
        )
      } catch (error) {
        // No se pudo consultar la whitelist (por ejemplo, sin conexión).
        if (!isMounted || attempt !== latestAttempt.current) return
        console.error('No se pudo verificar el acceso institucional:', error)
        setUser(null)
        setRole(null)
        setStatus('error')
      }
    })

    // Limpieza: al desmontar (o al reintentar) se dejan de escuchar
    // la sesión de Firebase y la whitelist.
    return () => {
      isMounted = false
      unsubscribeAuthorization?.()
      unsubscribe()
    }
  }, [authorizationAttempt])

  /** Inicia sesión (correo + contraseña + whitelist) y guarda el resultado. */
  const signIn = useCallback(async (email: string, password: string): Promise<WhitelistRole> => {
    const result = await signInUser(email, password)
    setUser(result.user)
    setRole(result.role)
    setStatus('authenticated')
    return result.role
  }, [])

  /** Cierra la sesión y limpia los datos del usuario. */
  const signOut = useCallback(async () => {
    await signOutStudent()
    setUser(null)
    setRole(null)
    setStatus('unauthenticated')
  }, [])

  /** Vuelve a ejecutar la verificación (sube el contador del useEffect). */
  const retryAuthorization = useCallback(() => {
    setStatus('loading')
    setAuthorizationAttempt((attempt) => attempt + 1)
  }, [])

  // useMemo evita crear un objeto nuevo en cada render: así los componentes
  // que usan useAuth() solo se vuelven a dibujar cuando algo cambia de verdad.
  const value = useMemo(
    () => ({ user, role, status, signIn, signOut, retryAuthorization }),
    [user, role, status, signIn, signOut, retryAuthorization],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
