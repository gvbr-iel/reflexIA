import { Navigate, useLocation } from 'react-router-dom'

import Button from './Button'
import { useAuth } from '../hooks/useAuth'
import type { WhitelistRole } from '../models/whitelist'

interface RequireAuthProps {
  children: React.ReactNode
  allowedRoles?: WhitelistRole[]
}

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
  const location = useLocation()

  if (status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p role="status" className="text-base text-texto/70">
          Verificando tu acceso…
        </p>
      </main>
    )
  }

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

  if (status !== 'authenticated') {
    return <Navigate to="/iniciar-sesion" replace state={{ from: location.pathname }} />
  }

  if (role && !allowedRoles.includes(role)) {
    return <Navigate to={getRoleHome(role)} replace />
  }

  return children
}

export const RequireAuth = RequireStudent

