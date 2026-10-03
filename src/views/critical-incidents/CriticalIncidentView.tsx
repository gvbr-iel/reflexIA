import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'

import Button from '../../components/Button'
import DevTheoryToggle from './components/DevTheoryToggle'
import WorkshopWorkspace from './components/WorkshopWorkspace'
import { useTheoryGate } from './hooks/useTheoryGate'
import { setSimulatedTheoryApproval } from './dev/theoryApprovalSimulator'

/* ------------------------------------------------
   CriticalIncidentView — HU-03 / RF-03
   Registro estructurado de incidentes críticos.
   Condicionada a la aprobación del marco teórico
   (HU-04): sin aprobar, muestra la pantalla de bloqueo.
   Se monta dentro de StudentLayout (R6).
   ------------------------------------------------ */
export default function CriticalIncidentView() {
  const navigate = useNavigate()
  const { isApproved, isLoading, error, refresh } = useTheoryGate()

  /* Solo desarrollo: alterna la aprobación simulada y vuelve a consultar. */
  function handleToggleSimulation() {
    setSimulatedTheoryApproval(!isApproved)
    refresh()
  }

  function renderContent() {
    /* ---- Estado de carga ---- */
    if (isLoading) {
      return (
        <div
          className="space-y-3"
          role="status"
          aria-busy="true"
          aria-label="Verificando acceso"
        >
          <div className="h-8 w-2/3 rounded-lg bg-border/50 animate-pulse" />
          <div className="h-32 rounded-xl bg-border/50 animate-pulse" />
        </div>
      )
    }

    /* ---- Estado de error ---- */
    if (error) {
      return (
        <div
          role="alert"
          className="rounded-xl border border-border bg-surface p-6 space-y-4"
        >
          <p className="text-texto">{error}</p>
          <Button variant="outline" onClick={refresh}>
            Reintentar
          </Button>
        </div>
      )
    }

    /* ---- Bloqueado: marco teórico sin aprobar ---- */
    if (!isApproved) {
      return (
        <div className="rounded-xl border border-border bg-surface p-6 md:p-8 flex flex-col items-center text-center gap-4">
          <span className="rounded-full bg-primary/10 p-3 text-primary" aria-hidden="true">
            <Lock size={28} />
          </span>
          <div className="space-y-2">
            <h2 className="font-heading font-semibold text-xl text-texto">
              Aún no puedes registrar incidentes
            </h2>
            <p className="text-texto/70 max-w-md">
              Para continuar, primero debes aprobar la evaluación del marco
              teórico. Así te aseguras de partir con las bases conceptuales
              de la práctica reflexiva.
            </p>
          </div>
          <Button onClick={() => navigate('/estudiante/marco-teorico')}>
            Ir al marco teórico
          </Button>
        </div>
      )
    }

    /* ---- Desbloqueado: selector de talleres y asistente paso a paso ---- */
    return <WorkshopWorkspace />
  }

  return (
    <div className="mx-auto w-full max-w-[96rem] space-y-6">
      <header>
        <h1 className="font-heading text-[clamp(1.5rem,0.8vw+1.1rem,2.25rem)] font-bold text-texto mb-2">
          Incidentes críticos
        </h1>
        <p className="text-texto/60 text-sm">
          Registra y analiza, paso a paso, un incidente crítico de tu práctica.
        </p>
      </header>

      <DevTheoryToggle isApproved={isApproved} onToggle={handleToggleSimulation} />

      {renderContent()}
    </div>
  )
}
