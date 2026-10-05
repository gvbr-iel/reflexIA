import { type ReactNode } from 'react'
import { CheckCircle2, Clock, Files, Pencil } from 'lucide-react'

import type { ReflectionStats } from '../../../models/reflection'

/* ------------------------------------------------
   ReflectionStatsBar — HU-02 / RF-02

   Tarjetas de resumen que van arriba del panel de
   reflexiones: total y cantidad por estado de revisión
   (pendientes, editadas y validadas). Se calculan sobre
   todas las reflexiones, sin importar los filtros.

   Nota: la tarjeta (StatCard) es una copia de la de
   work-pacing y admin-whitelist. Cuando el equipo lo
   acuerde, conviene moverla a src/components/ (regla R2).
   ------------------------------------------------ */

interface ReflectionStatsBarProps {
  /** Los conteos ya calculados por el hook useReflections. */
  stats: ReflectionStats
  /** true mientras se cargan los datos: se muestran bloques animados. */
  isLoading: boolean
}

interface StatCardProps {
  /** Ícono de la tarjeta. */
  icon: ReactNode
  /** Título pequeño de la tarjeta (e.g. "Pendientes"). */
  label: string
  /** Dato principal, en letra grande. */
  value: number
  isLoading: boolean
}

/** Una tarjeta individual: ícono, título y cantidad. */
function StatCard({ icon, label, value, isLoading }: StatCardProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
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
          // Mientras carga: un bloque gris animado en vez del número.
          <div className="my-1 h-7 w-12 animate-pulse rounded-md bg-border/50" />
        ) : (
          <p className="font-heading text-xl font-bold text-texto md:text-2xl">{value}</p>
        )}
      </div>
    </div>
  )
}

export default function ReflectionStatsBar({ stats, isLoading }: ReflectionStatsBarProps) {
  return (
    // En móvil y tablet van en dos columnas; en escritorio, las cuatro en fila.
    <section
      aria-label="Resumen de reflexiones por estado"
      className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4"
    >
      <StatCard icon={<Files size={20} />} label="Total" value={stats.total} isLoading={isLoading} />
      <StatCard
        icon={<Clock size={20} />}
        label="Pendientes"
        value={stats.pending}
        isLoading={isLoading}
      />
      <StatCard
        icon={<Pencil size={20} />}
        label="Editadas"
        value={stats.edited}
        isLoading={isLoading}
      />
      <StatCard
        icon={<CheckCircle2 size={20} />}
        label="Validadas"
        value={stats.validated}
        isLoading={isLoading}
      />
    </section>
  )
}
