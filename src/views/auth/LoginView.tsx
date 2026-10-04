import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import Button from '../../components/Button'
import { useAuth } from '../../hooks/useAuth'
import { StudentAuthError } from '../../services/authService'
import { INSTITUTIONAL_DOMAIN } from '../../models/whitelist'

const GENERIC_CREDENTIAL_ERROR =
  'No pudimos iniciar sesión. Verifica tus credenciales y que tu correo esté autorizado.'

export default function LoginView() {
  const { signIn, status, retryAuthorization } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (status === 'authenticated') {
    return <Navigate to="/estudiante" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await signIn(email, password)
      navigate('/estudiante', { replace: true })
    } catch (cause) {
      if (!(cause instanceof StudentAuthError)) {
        console.error('No se pudo iniciar sesión:', cause)
      }

      if (cause instanceof StudentAuthError && cause.code === 'invalid-email') {
        setError(`Ingresa un correo institucional válido que termine en ${INSTITUTIONAL_DOMAIN}.`)
      } else if (cause instanceof StudentAuthError && cause.code === 'unavailable') {
        setError('No pudimos validar tu acceso. Revisa tu conexión e inténtalo nuevamente.')
      } else {
        setError(GENERIC_CREDENTIAL_ERROR)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-md text-base font-medium text-primary hover:text-accent-ia focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Volver al inicio
        </Link>

        <section className="rounded-2xl border border-border bg-surface p-6 shadow-md sm:p-8">
          <div className="mb-7 flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <LockKeyhole size={24} aria-hidden="true" />
            </div>
            <div>
              <p className="font-heading text-xl font-bold text-primary">
                Reflex<span className="text-accent-ia">IA</span>
              </p>
              <p className="text-sm text-texto/65">Acceso de estudiante</p>
            </div>
          </div>

          <h1 className="font-heading text-2xl font-bold text-texto">
            Inicia sesión
          </h1>
          <p className="mt-2 text-base leading-relaxed text-texto/70">
            Ingresa con tu correo institucional y la contraseña de tu cuenta.
            Solo podrán acceder estudiantes autorizados de práctica profesional.
          </p>

          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="institutional-email" className="mb-2 block text-base font-medium text-texto">
                Correo institucional
              </label>
              <input
                id="institutional-email"
                name="email"
                type="email"
                autoComplete="username"
                inputMode="email"
                maxLength={254}
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={`nombre${INSTITUTIONAL_DOMAIN}`}
                aria-describedby="email-help"
                className="min-h-12 w-full rounded-lg border border-border bg-surface px-4 py-3 text-base text-texto placeholder:text-texto/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p id="email-help" className="mt-2 text-sm text-texto/60">
                Debe terminar en {INSTITUTIONAL_DOMAIN}.
              </p>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-base font-medium text-texto">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="min-h-12 w-full rounded-lg border border-border bg-surface px-4 py-3 text-base text-texto focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-base text-texto"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isSubmitting}
              icon={!isSubmitting ? <ArrowRight size={18} /> : undefined}
              disabled={status === 'error'}
            >
              Iniciar sesión
            </Button>
          </form>

          <div className="mt-6 flex items-start gap-3 rounded-xl bg-bg p-4">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-accent-ia" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-texto/70">
              El acceso se valida con Firebase y la lista institucional
              autorizada. No solicitamos RUT ni otros identificadores sensibles.
            </p>
          </div>

          {status === 'error' && (
            <div className="mt-4 space-y-3">
              <p role="status" className="text-sm text-texto/70">
                El servicio de acceso no está disponible. Revisa tu conexión o
                inténtalo nuevamente.
              </p>
              <Button variant="outline" fullWidth onClick={retryAuthorization}>
                Reintentar verificación
              </Button>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
