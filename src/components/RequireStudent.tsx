import { Navigate, useLocation } from 'react-router-dom'

import Button from './Button'
import { useAuth } from '../hooks/useAuth'
import type { WhitelistRole } from '../models/whitelist'

/* ------------------------------------------------
   RequireStudent (alias RequireAuth) — guarda de ruta

   Envuelve a las secciones privadas en App.tsx y decide
   qué mostrar según la sesión (HU-08, RNF-02):
     - verificando la sesión → texto "Verificando tu acceso…"
     - error al verificar    → mensaje y botón "Reintentar"
     - sin sesión            → redirige a /iniciar-sesion
     - rol no permitido      → redirige al inicio de SU rol
     - todo bien             → muestra la sección (children)

   El nombre viene de cuando solo protegía /estudiante;
   hoy sirve para los tres roles mediante `allowedRoles`.
   ------------------------------------------------ */

interface RequireAuthProps {
  /** La sección protegida (normalmente el layout de un rol). */
  children: React.ReactNode
  /** Roles que pueden entrar. Por defecto, solo estudiantes. */
  allowedRoles?: WhitelistRole[]
}

/** Ruta de inicio de cada rol: a dónde se manda a alguien que entró a una sección ajena. */
function getRoleHome(role: WhitelistRole | null): string {
  switch (role) {
    case 'teacher':
      return '/docente'
    case 'admin':
      return '/admin'
    case 'student':
    default:
      return '/estudiante'
  }
}

export default function RequireStudent({
  children,
  allowedRoles = ['student'],
}: RequireAuthProps) {
  const { status, role, retryAuthorization } = useAuth()
  // Ruta actual: se guarda para poder volver a ella después del login.
  const location = useLocation()

  // 1. Todavía se está verificando la sesión.
  if (status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p role="status" className="text-base text-texto/70">
          Verificando tu acceso…
        </p>
      </main>
    )
  }

  // 2. No se pudo verificar (sin conexión, Firestore caído, etc.).
  if (status === 'error') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p role="alert" className="max-w-lg text-base text-texto">
          No pudimos verificar tu autorización. Revisa tu conexión e inténtalo
          nuevamente.
        </p>
        <Button onClick={retryAuthorization}>Reintentar</Button>
      </main>
    )
  }

  // 3. No hay sesión: al login. "replace" evita que "Atrás" vuelva a esta ruta.
  if (status !== 'authenticated') {
    return <Navigate to="/iniciar-sesion" replace state={{ from: location.pathname }} />
  }

  // 4. Hay sesión, pero el rol no corresponde a esta sección: a su propio inicio.
  if (role && !allowedRoles.includes(role)) {
    return <Navigate to={getRoleHome(role)} replace />
  }

  // 5. Sesión válida y rol permitido: se muestra la sección.
  return children
}

/** Alias con un nombre más general (protege rutas de cualquier rol). */
export const RequireAuth = RequireStudent
