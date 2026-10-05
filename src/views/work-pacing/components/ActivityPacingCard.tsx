import { CircleAlert, ClipboardCheck, Minus, Plus, X } from 'lucide-react'

import Button from '../../../components/Button'
import {
  PACING_LIMITS,
  type ActivityPacing,
  type PacingActivity,
} from '../../../models/workPacing'
import { formatDeadline } from '../../../utils/workPacingDates'
import DeadlineBadge from './DeadlineBadge'
import { fieldClassName, labelClassName } from './fieldStyles'

/* ------------------------------------------------
   ActivityPacingCard — HU-06 / RF-06

   Tarjeta de una actividad (el marco teórico o un taller).
   Aquí el profesor configura dos cosas:
     - la fecha límite
     - el máximo de intentos

   Además muestra una vista previa de cómo lo verá el
   estudiante.

   La tarjeta no guarda nada por sí sola: avisa los cambios
   con onDeadlineChange y onAttemptsChange, y el hook
   useWorkPacing se encarga del resto.
   ------------------------------------------------ */

interface ActivityPacingCardProps {
  /** La actividad: su título, tema y valores por defecto. */
  activity: PacingActivity
  /** Los valores que se están editando ahora. */
  value: ActivityPacing
  /** true si lo guardado es distinto a los valores originales. */
  isCustomized: boolean
  /** Mensaje de validación de esta actividad (undefined si no hay problema). */
  error?: string
  /** true mientras se guarda o restablece: bloquea los controles. */
  disabled: boolean
  /** Se llama al elegir otra fecha (null = quitar el plazo). */
  onDeadlineChange: (deadline: string | null) => void
  /** Se llama al subir o bajar los intentos. */
  onAttemptsChange: (maxAttempts: number) => void
}

export default function ActivityPacingCard({
  activity,
  value,
  isCustomized,
  error,
  disabled,
  onDeadlineChange,
  onAttemptsChange,
}: ActivityPacingCardProps) {
  // Ids únicos por actividad: unen cada etiqueta con su campo (accesibilidad).
  const deadlineId = `deadline-${activity.id}`
  const attemptsId = `attempts-${activity.id}`
  const errorId = `error-${activity.id}`

  // Valores originales de la actividad (los de antes de que el profesor cambiara algo).
  const { defaultPacing } = activity

  return (
    // article = una unidad de contenido; aria-labelledby le da el título como nombre.
    <article
      aria-labelledby={`title-${activity.id}`}
      className="rounded-xl border border-border bg-surface p-4 md:p-5"
    >
      {/* En pantallas angostas todo va en columna; desde "xl" va en dos lados. */}
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        {/* ---- Lado izquierdo: qué actividad es ---- */}
        <div className="flex min-w-0 items-start gap-3">
          {/* Círculo con el número del taller, o un ícono para el marco teórico. */}
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-heading font-bold text-primary"
            aria-hidden="true"
          >
            {activity.kind === 'theory' ? <ClipboardCheck size={20} /> : activity.order}
          </span>

          <div className="min-w-0 space-y-2">
            <div>
              <h3 id={`title-${activity.id}`} className="font-heading text-lg font-semibold text-texto">
                {activity.title}
              </h3>
              <p className="text-sm text-texto/70">{activity.topic}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Estado del plazo: vence en N días, hoy, vencido o sin plazo. */}
              <DeadlineBadge deadline={value.deadline} />

              {/* Etiqueta que avisa que esta actividad ya no tiene sus valores originales. */}
              {isCustomized && (
                <span className="inline-flex items-center rounded-full border border-primary/40 px-2.5 py-0.5 text-xs font-medium text-primary">
                  Modificado
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ---- Lado derecho: los controles ---- */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start xl:shrink-0">
          {/* Fecha límite */}
          <div className="sm:w-56">
            <label htmlFor={deadlineId} className={labelClassName}>
              Fecha límite
            </label>
            <input
              id={deadlineId}
              type="date"
              // Si no hay plazo, el campo queda vacío.
              value={value.deadline ?? ''}
              // Un campo vacío significa "sin plazo" (null).
              onChange={(e) => onDeadlineChange(e.target.value || null)}
              disabled={disabled}
              // Avisa a los lectores de pantalla que el campo tiene un error.
              aria-invalid={error !== undefined}
              aria-describedby={error ? errorId : undefined}
              className={`${fieldClassName} h-11`}
            />

            {/* Solo se ofrece quitar el plazo si hay uno. */}
            {value.deadline && (
              <Button
                variant="ghost"
                size="sm"
                icon={<X size={14} />}
                onClick={() => onDeadlineChange(null)}
                disabled={disabled}
                className="mt-1 -ml-3"
              >
                Quitar plazo
              </Button>
            )}
          </div>

          {/* Intentos máximos: botones − y + con el número en medio. */}
          <div>
            <span id={attemptsId} className={labelClassName}>
              Intentos máximos
            </span>
            <div role="group" aria-labelledby={attemptsId} className="flex items-center gap-2">
              {/* Botón "−": se desactiva al llegar al mínimo permitido. */}
              <Button
                variant="outline"
                icon={<Minus size={18} />}
                onClick={() => onAttemptsChange(value.maxAttempts - 1)}
                disabled={disabled || value.maxAttempts <= PACING_LIMITS.minAttempts}
                aria-label={`Reducir los intentos de ${activity.title}`}
                className="h-11 w-11 px-0"
              >
                {/* Texto solo para lectores de pantalla (el botón muestra un ícono). */}
                <span className="sr-only">Reducir</span>
              </Button>

              {/* El número actual; aria-live anuncia el cambio a los lectores de pantalla. */}
              <output
                aria-live="polite"
                className="flex h-11 w-14 items-center justify-center rounded-lg border border-border bg-bg font-heading text-lg font-bold text-texto"
              >
                {value.maxAttempts}
              </output>

              {/* Botón "+": se desactiva al llegar al máximo permitido. */}
              <Button
                variant="outline"
                icon={<Plus size={18} />}
                onClick={() => onAttemptsChange(value.maxAttempts + 1)}
                disabled={disabled || value.maxAttempts >= PACING_LIMITS.maxAttempts}
                aria-label={`Aumentar los intentos de ${activity.title}`}
                className="h-11 w-11 px-0"
              >
                <span className="sr-only">Aumentar</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Error de validación (por ejemplo, un plazo fuera de orden) ---- */}
      {error && (
        // role="alert" hace que el lector de pantalla lo anuncie de inmediato.
        <p id={errorId} role="alert" className="mt-4 flex items-start gap-1.5 text-sm text-texto">
          <CircleAlert size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          {error}
        </p>
      )}

      {/* ---- Vista previa: cómo lo verá el estudiante ---- */}
      <div className="mt-4 rounded-lg bg-bg p-3 text-sm text-texto/80">
        <p>
          <span className="font-medium text-texto">Así lo verá el estudiante:</span>{' '}
          Intentos de revisión: 0 de {value.maxAttempts}
          {' · '}
          {value.deadline ? `Plazo: ${formatDeadline(value.deadline)}` : 'Sin fecha límite'}
        </p>

        {/* Si el profesor cambió algo, recuerda cuáles eran los valores originales. */}
        {isCustomized && (
          <p className="mt-1 text-xs text-texto/60">
            Valores originales: {defaultPacing.maxAttempts}{' '}
            {defaultPacing.maxAttempts === 1 ? 'intento' : 'intentos'}
            {' · '}
            {defaultPacing.deadline ? formatDeadline(defaultPacing.deadline) : 'sin plazo'}
          </p>
        )}
      </div>
    </article>
  )
}
