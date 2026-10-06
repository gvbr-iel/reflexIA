import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, Home, RotateCcw } from 'lucide-react'
import Button from './Button'

/* ------------------------------------------------
   ErrorBoundary — "barrera" de errores global

   Si un componente lanza un error mientras se dibuja,
   React normalmente deja la pantalla en blanco. Esta
   barrera atrapa el error y muestra un mensaje con
   botones para recargar o volver al inicio.

   Envuelve toda la app en main.tsx. Es un componente
   de CLASE porque React solo permite atrapar errores
   de render con los métodos de clase
   getDerivedStateFromError y componentDidCatch
   (no existe un hook equivalente).
   ------------------------------------------------ */

interface ErrorBoundaryProps {
  children: ReactNode
  /** Pantalla alternativa opcional; si no se pasa, se usa la de este archivo. */
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  /** true después de atrapar un error. */
  hasError: boolean
  /** El error atrapado (se muestra solo en modo desarrollo). */
  error: Error | null
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  /** React lo llama cuando un hijo lanza un error: cambia el estado para mostrar la pantalla de error. */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  /** Se llama después de atrapar el error: aquí solo se registra en la consola. */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error no capturado capturado por ErrorBoundary:', error, errorInfo)
  }

  /** Recarga la página completa. */
  handleReload = () => {
    window.location.reload()
  }

  /** Vuelve a la página de inicio (recarga completa, para empezar de cero). */
  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <main
          role="alert"
          aria-live="assertive"
          className="flex min-h-screen items-center justify-center bg-bg px-4 py-12 sm:px-6"
        >
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 text-center shadow-lg sm:p-8">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-perf-fail/10 text-perf-fail">
              <AlertTriangle size={28} aria-hidden="true" />
            </div>

            <p className="font-heading text-lg font-bold text-primary">
              Reflex<span className="text-accent-ia">IA</span>
            </p>

            <h1 className="mt-2 font-heading text-2xl font-bold text-texto sm:text-3xl">
              Algo no salió como esperábamos
            </h1>

            <p className="mt-3 text-base leading-relaxed text-texto/75">
              Ocurrió un error inesperado al cargar la aplicación. Tus datos no se han perdido.
              Puedes intentar recargar la página o volver a la pantalla de inicio.
            </p>

            {/* Solo en desarrollo (npm run dev) se muestran los detalles técnicos. */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-5 text-left rounded-lg border border-border bg-bg p-3.5 text-xs text-texto/80">
                <summary className="cursor-pointer font-medium text-perf-fail hover:underline">
                  Detalles técnicos del error (modo desarrollo)
                </summary>
                <pre className="mt-2.5 overflow-x-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-texto/90">
                  {this.state.error.name}: {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                variant="primary"
                icon={<RotateCcw size={18} />}
                onClick={this.handleReload}
              >
                Recargar página
              </Button>
              <Button
                variant="outline"
                icon={<Home size={18} />}
                onClick={this.handleGoHome}
              >
                Volver al inicio
              </Button>
            </div>
          </div>
        </main>
      )
    }

    // Sin errores: se dibuja la app normalmente.
    return this.props.children
  }
}
