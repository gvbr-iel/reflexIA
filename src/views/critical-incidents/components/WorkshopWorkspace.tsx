import { useEffect } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'

import { useWorkshops } from '../../../hooks/useWorkshops'
import type { Workshop } from '../../../models/criticalIncident'
import { workshopRoute } from '../../../utils/routes'
import { useWorkshopResultSimulator } from '../dev/useWorkshopResultSimulator'
import WorkshopSelector from './WorkshopSelector'
import DevWorkshopResultToggle from './DevWorkshopResultToggle'
import WorkshopResultBanner from './WorkshopResultBanner'
import IncidentWizard from './IncidentWizard'

/* ------------------------------------------------
   WorkshopWorkspace — selector de talleres + asistente
   El asistente es por taller (1 a 4) y el taller elegido
   vive en la URL (/estudiante/innovaciones/:workshopId):
   así la lista de talleres puede abrir uno concreto, al
   recargar no se pierde y el botón "atrás" funciona.
   Solo se monta cuando el marco teórico está aprobado.
   Un taller con resultado, aprobado o reprobado, muestra
   su aviso y desbloquea el siguiente.
   ------------------------------------------------ */

/** Taller al que se entra cuando la URL no indica ninguno: el que tiene un
    borrador en curso, si no el primero disponible y, si no, el primero. */
function pickDefaultWorkshopId(workshops: Workshop[]): string | null {
  const preferred =
    workshops.find((w) => w.status === 'in-progress') ??
    workshops.find((w) => w.status === 'available') ??
    workshops[0]

  return preferred ? preferred.id : null
}

export default function WorkshopWorkspace() {
  const { workshopId: requestedWorkshopId } = useParams<{ workshopId: string }>()
  const navigate = useNavigate()

  const { workshops, isLoading, error, retry, refresh } = useWorkshops()

  /* Solo desarrollo: simula la notificación del resultado del taller. */
  const simulator = useWorkshopResultSimulator(refresh)

  const selectedWorkshop =
    workshops.find((w) => w.id === requestedWorkshopId) ?? null
  const selectedWorkshopId = selectedWorkshop ? selectedWorkshop.id : null

  /* Al cambiar de taller se actualizan los estados del selector. Se hace
     en un efecto para que corra después de que el asistente anterior se
     desmonte y guarde lo escrito, y así el estado "en curso" sea el real. */
  useEffect(() => {
    refresh()
  }, [selectedWorkshopId, refresh])

  /* Sin taller en la URL, o con uno que no existe, se redirige al que
     corresponde. Se hace una sola vez: después la URL fija el taller y no
     salta cuando cambian los estados (por ejemplo, al aprobar uno). */
  if (!isLoading && !error && !selectedWorkshop) {
    const defaultWorkshopId = pickDefaultWorkshopId(workshops)
    if (defaultWorkshopId) {
      return <Navigate to={workshopRoute(defaultWorkshopId)} replace />
    }
  }

  return (
    <div className="space-y-6">
      <WorkshopSelector
        workshops={workshops}
        selectedWorkshopId={selectedWorkshopId}
        isLoading={isLoading}
        error={error}
        onSelect={(workshopId) => navigate(workshopRoute(workshopId))}
        onRetry={retry}
      />

      {!error && (
        <DevWorkshopResultToggle
          workshop={selectedWorkshop}
          isBusy={simulator.isBusy}
          error={simulator.error}
          onSimulate={(outcome) => {
            if (selectedWorkshop) simulator.simulate(selectedWorkshop.id, outcome)
          }}
          onReset={() => {
            if (selectedWorkshop) simulator.reset(selectedWorkshop.id)
          }}
        />
      )}

      {selectedWorkshop?.status === 'completed' && selectedWorkshop.outcome && (
        <WorkshopResultBanner
          outcome={selectedWorkshop.outcome}
          hasNext={selectedWorkshop.number < workshops.length}
        />
      )}

      {selectedWorkshopId && !error && (
        <IncidentWizard
          key={selectedWorkshopId}
          workshopId={selectedWorkshopId}
          onDraftChange={refresh}
        />
      )}
    </div>
  )
}
