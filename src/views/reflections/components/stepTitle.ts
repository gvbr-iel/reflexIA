import { INCIDENT_STEPS, type IncidentStep } from '../../../models/criticalIncident'

/* ------------------------------------------------
   getStepTitle — HU-02 / RF-02

   Nombre visible de un paso del incidente (por ejemplo,
   "Contexto"), tomado de la misma lista que usa el
   asistente del estudiante (HU-03). Lo usan el relato,
   la propuesta de la IA y el editor del profesor, para
   que siempre se llamen igual.
   ------------------------------------------------ */

export function getStepTitle(step: IncidentStep): string {
  return INCIDENT_STEPS.find((info) => info.id === step)?.title ?? step
}
