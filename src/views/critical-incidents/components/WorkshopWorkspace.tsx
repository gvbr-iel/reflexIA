import { useEffect } from 'react'

import { useWorkshops } from '../hooks/useWorkshops'
import { useWorkshopResultSimulator } from '../dev/useWorkshopResultSimulator'
import WorkshopSelector from './WorkshopSelector'
import DevWorkshopResultToggle from './DevWorkshopResultToggle'
import WorkshopResultBanner from './WorkshopResultBanner'
import IncidentWizard from './IncidentWizard'

/* ------------------------------------------------
   WorkshopWorkspace — selector de talleres + asistente
   El asistente es por taller (1 a 4): muestra el selector
   y monta el asistente del taller elegido. Solo se monta
   cuando el marco teórico está aprobado.
   Un taller con resultado, aprobado o reprobado, muestra
   su aviso y desbloquea el siguiente.
   ------------------------------------------------ */
export default function WorkshopWorkspace() {
  const {
    workshops,
    isLoading,
    error,
    selectedWorkshopId,
    selectWorkshop,
    retry,
    refresh,
  } = useWorkshops()

  /* Solo desarrollo: simula la notificación del resultado del taller. */
  const simulator = useWorkshopResultSimulator(refresh)

  const selectedWorkshop =
    workshops.find((w) => w.id === selectedWorkshopId) ?? null

  /* Al cambiar de taller se actualizan los estados del selector. Se hace
     en un efecto para que corra después de que el asistente anterior se
     desmonte y guarde lo escrito, y así el estado "en curso" sea el real. */
  useEffect(() => {
    refresh()
  }, [selectedWorkshopId, refresh])

  return (
    <div className="space-y-6">
      <WorkshopSelector
        workshops={workshops}
        selectedWorkshopId={selectedWorkshopId}
        isLoading={isLoading}
        error={error}
        onSelect={selectWorkshop}
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
