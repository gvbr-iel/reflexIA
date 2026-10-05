import { type ReactNode } from 'react'
import { CalendarClock, CalendarX, SlidersHorizontal } from 'lucide-react'

import type { PacingSummary } from '../hooks/useWorkPacing'
import { formatDeadline } from '../../../utils/workPacingDates'

/* ------------------------------------------------
   PacingStats — HU-06 / RF-06

   Tarjetas de resumen que van arriba del panel. Se
   calculan con lo que está guardado (no con lo que se
   está editando):
     - Próximo cierre: la actividad con el plazo más cercano
     - Plazos vencidos: cuántas actividades ya pasaron su fecha
     - Personalizadas: cuántas tienen valores distintos a los
       originales

   Nota: la tarjeta (StatCard) es una copia de la de
   admin-whitelist. Cuando el equipo lo acuerde, conviene
   moverla a src/components/ (regla R2) para compartirla.
   ------------------------------------------------ */

interface PacingStatsProps {
  /** Los números ya calculados por el hook useWorkPacing. */
  summary: PacingSummary
  /** true mientras se cargan los datos: se muestran bloques animados. */
  isLoading: boolean
}

interface StatCardProps {
  /** Ícono de la tarjeta. */
  icon: ReactNode
  /** Título pequeño de la tarjeta (e.g. "Próximo cierre"). */
  label: string
  /** Dato principal, en letra grande. */
  value: string
  /** Texto pequeño que aclara el dato. */
  detail: string
  isLoading: boolean
}

/** Una tarjeta individual: ícono, título, dato principal y aclaración. */
function StatCard({ icon, label, value, detail, isLoading }: StatCardProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 md:p-5">
      {/* El ícono se oculta en pantallas muy angostas (móvil) para ganar espacio. */}
      <span
        className="hidden shrink-0 rounded-lg bg-primary/10 p-2.5 text-primary sm:block"
        aria-hidden="true"
      >
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-sm text-texto/70">{label}</p>

        {isLoading ? (
          // Mientras carga: bloques grises animados en vez de los datos.
          <>
            <div className="my-1 h-7 w-24 animate-pulse rounded-md bg-border/50" />
            <div className="h-3 w-28 animate-pulse rounded bg-border/50" />
          </>
        ) : (
          // Ya cargó: el dato principal y su aclaración.
          <>
            <p className="font-heading text-xl font-bold text-texto md:text-2xl">{value}</p>
            <p className="text-xs text-texto/60">{detail}</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function PacingStats({ summary, isLoading }: PacingStatsProps) {
  // Saca del resumen los datos que usan las tres tarjetas.
  const { nextDeadline, overdueCount, customizedCount, totalActivities } = summary

  return (
    // En móvil las tarjetas van una bajo otra; desde "sm" van en tres columnas.
    <section
      aria-label="Resumen de plazos e intentos"
      className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:gap-4"
    >
      {/* 1. Próximo cierre: la fecha y la actividad a la que pertenece. */}
      <StatCard
        icon={<CalendarClock size={20} />}
        label="Próximo cierre"
        value={nextDeadline ? formatDeadline(nextDeadline.deadline) : 'Sin plazos'}
        detail={nextDeadline ? nextDeadline.title : 'No hay plazos próximos'}
        isLoading={isLoading}
      />

      {/* 2. Plazos vencidos: cuántas actividades ya pasaron su fecha. */}
      <StatCard
        icon={<CalendarX size={20} />}
        label="Plazos vencidos"
        value={String(overdueCount)}
        // Singular o plural según la cantidad.
        detail={overdueCount === 1 ? 'actividad con plazo cumplido' : 'actividades con plazo cumplido'}
        isLoading={isLoading}
      />

      {/* 3. Personalizadas: cuántas actividades el profesor modificó. */}
      <StatCard
        icon={<SlidersHorizontal size={20} />}
        label="Personalizadas"
        value={`${customizedCount} de ${totalActivities}`}
        detail="con valores distintos de los originales"
        isLoading={isLoading}
      />
    </section>
  )
}
