import { useState } from 'react'
import { RotateCcw } from 'lucide-react'

import Button from '../../components/Button'
import ActivityPacingCard from './components/ActivityPacingCard'
import PacingNotice from './components/PacingNotice'
import PacingSaveBar from './components/PacingSaveBar'
import PacingStats from './components/PacingStats'
import PrototypeNotice from './components/PrototypeNotice'
import ResetDefaultsModal from './components/ResetDefaultsModal'
import { useWorkPacing } from './hooks/useWorkPacing'

/* ------------------------------------------------
   DeadlinesView — HU-06 / RF-06

   Panel de control de plazos e intentos. Aquí el profesor
   guía decide, para cada actividad (el marco teórico y los
   talleres 1 a 4):
     - hasta cuándo se puede entregar (fecha límite)
     - cuántos intentos de revisión tiene el estudiante

   Esta vista no tiene lógica propia: toda la lógica vive en el
   hook useWorkPacing y aquí solo se conectan sus datos con los
   componentes.

   Se muestra dentro de TeacherLayout (regla R6) y se llega con
   un solo clic desde el menú lateral ("Plazos e intentos"),
   así cumple el criterio de máximo 2 clics de la HU-06.
   ------------------------------------------------ */
export default function DeadlinesView() {
  // Toda la lógica y los datos del panel.
  const pacing = useWorkPacing()

  // Controla si la ventana de "Restablecer" está abierta.
  const [isResetOpen, setIsResetOpen] = useState(false)

  /** Confirma el restablecimiento y, cuando termina, cierra la ventana. */
  async function handleConfirmReset() {
    await pacing.resetDefaults()
    setIsResetOpen(false)
  }

  // Mientras se guarda o restablece se bloquean los controles de las tarjetas.
  const isBusy = pacing.isSaving || pacing.isResetting

  return (
    // Si hay cambios sin guardar aparece la barra fija de abajo; el espacio
    // extra (pb-28) evita que tape el final de la página.
    <div className={`mx-auto w-full max-w-5xl space-y-6 ${pacing.isDirty ? 'pb-28' : ''}`}>
      {/* ---- Encabezado: título, explicación y botón de restablecer ---- */}
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="mb-2 font-heading text-2xl font-bold text-texto md:text-3xl">
            Plazos e intentos
          </h1>
          <p className="max-w-2xl text-texto/70">
            Regula el ritmo de trabajo: define hasta cuándo se puede entregar cada actividad y
            cuántos intentos de revisión tiene el estudiante.
          </p>
        </div>

        {/* Solo se puede restablecer si hay algo personalizado y ya cargó todo bien. */}
        <Button
          variant="outline"
          icon={<RotateCcw size={18} />}
          onClick={() => setIsResetOpen(true)}
          disabled={pacing.isLoading || pacing.error !== null || pacing.summary.customizedCount === 0}
        >
          Restablecer valores por defecto
        </Button>
      </header>

      {/* Aclara que los datos son simulados (prototipo). */}
      <PrototypeNotice />

      {/* Aviso del resultado de guardar o restablecer. */}
      <PacingNotice notice={pacing.notice} onDismiss={pacing.dismissNotice} />

      {pacing.error ? (
        /* ---- Estado de error: no se pudo cargar la configuración ---- */
        <div role="alert" className="space-y-4 rounded-xl border border-border bg-surface p-6">
          <p className="text-texto">{pacing.error}</p>
          <Button variant="outline" onClick={pacing.retry}>
            Reintentar
          </Button>
        </div>
      ) : (
        <>
          {/* Tarjetas de resumen: próximo cierre, vencidos y personalizadas. */}
          <PacingStats
            summary={pacing.summary}
            activityCount={pacing.activities.length}
            isLoading={pacing.isLoading}
          />

          {/* ---- Lista de actividades ---- */}
          <section aria-labelledby="pacing-list-title" className="space-y-4">
            <div>
              <h2 id="pacing-list-title" className="font-heading text-lg font-semibold text-texto">
                Actividades
              </h2>
              <p className="text-sm text-texto/70">
                Las actividades se desbloquean en orden, así que cada plazo debe ser igual o
                posterior al de la actividad anterior.
              </p>
            </div>

            {pacing.isLoading ? (
              /* Mientras carga: bloques grises animados con la forma de las tarjetas. */
              <div className="space-y-4" role="status" aria-busy="true" aria-label="Cargando actividades">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-44 animate-pulse rounded-xl bg-border/50" />
                ))}
              </div>
            ) : (
              /* Ya cargó: una tarjeta por actividad. */
              <div className="space-y-4">
                {pacing.activities.map((activity) => (
                  <ActivityPacingCard
                    key={activity.id}
                    activity={activity}
                    // Valores que se están editando para esta actividad.
                    value={pacing.draft[activity.id]}
                    isCustomized={pacing.isCustomized(activity.id)}
                    // Mensaje de error de esta actividad (si lo hay).
                    error={pacing.errors[activity.id]}
                    disabled={isBusy}
                    // Cada cambio se envía al hook, que actualiza el borrador.
                    onDeadlineChange={(deadline) => pacing.setDeadline(activity.id, deadline)}
                    onAttemptsChange={(attempts) => pacing.setMaxAttempts(activity.id, attempts)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* ---- Barra de guardado: solo aparece si hay cambios sin guardar ---- */}
      {pacing.isDirty && (
        <PacingSaveBar
          hasErrors={pacing.hasErrors}
          isSaving={pacing.isSaving}
          onSave={pacing.save}
          onDiscard={pacing.discard}
        />
      )}

      {/* ---- Ventana de confirmación para restablecer ---- */}
      <ResetDefaultsModal
        isOpen={isResetOpen}
        isResetting={pacing.isResetting}
        hasUnsavedChanges={pacing.isDirty}
        onCancel={() => setIsResetOpen(false)}
        onConfirm={handleConfirmReset}
      />
    </div>
  )
}
