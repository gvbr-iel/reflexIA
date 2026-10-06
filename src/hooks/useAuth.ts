/**
 * @module hooks/useAuth
 *
 * Hook global para leer la sesión desde cualquier componente.
 *
 * Ejemplo de uso:
 * ```tsx
 * const { user, role, signOut } = useAuth()
 * ```
 */

import { useContext } from 'react'

import { AuthContext } from '../context/AuthContext'

/**
 * Devuelve el usuario, su rol, el estado de la sesión y las acciones
 * `signIn`, `signOut` y `retryAuthorization`.
 *
 * @throws {Error} Si se usa fuera de `<AuthProvider>`, porque ahí el contexto no existe.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  // Fuera del proveedor el contexto vale null: se avisa con un error claro.
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider.')
  }
  return context
}
