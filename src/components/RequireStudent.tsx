import { Navigate, useLocation } from 'react-router-dom'

import Button from './Button'
import { useAuth } from '../hooks/useAuth'

export default function RequireStudent({ children }: { children: React.ReactNode }) {
  const { status, retryAuthorization } = useAuth()
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

  return children
}
