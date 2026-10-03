import { useEffect } from 'react'

import { useWorkshops } from '../hooks/useWorkshops'
import WorkshopSelector from './WorkshopSelector'
import IncidentWizard from './IncidentWizard'

/* ------------------------------------------------
   WorkshopWorkspace — selector de talleres + asistente
   El asistente es por taller (1 a 4): muestra el selector
   y monta el asistente del taller elegido. Solo se monta
   cuando el marco teórico está aprobado.
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
