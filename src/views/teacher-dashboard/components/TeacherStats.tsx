import { type ReactNode } from 'react'
import { CalendarX, ClipboardCheck, GraduationCap, Users } from 'lucide-react'

import type { TeacherDashboardSummary } from '../../../models/teacherDashboard'

/* ------------------------------------------------
   TeacherStats — panel docente

   Tarjetas de resumen que van arriba del panel:
     - Estudiantes: cuántos están en seguimiento
     - Marco teórico: cuántos ya lo aprobaron
     - Talleres entregados: entre todos los estudiantes
     - Plazos vencidos: estudiantes con una entrega atrasada

   Nota: la tarjeta (StatCard) es una copia de la de
   admin-whitelist y work-pacing. Cuando el equipo lo acuerde,
   conviene moverla a src/components/ (regla R2).
   ------------------------------------------------ */

interface TeacherStatsProps {
  /** Los números ya calculados por el hook useTeacherDashboard. */
  summary: TeacherDashboardSummary
  /** true mientras se cargan los datos: se muestran bloques animados. */
  isLoading: boolean
}

interface StatCardProps {
  /** Ícono de la tarjeta. */
  icon: ReactNode
  /** Título pequeño de la tarjeta (e.g. "Estudiantes"). */
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
            <div className="my-1 h-7 w-16 animate-pulse rounded-md bg-border/50" />
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

export default function TeacherStats({ summary, isLoading }: TeacherStatsProps) {
  const { totalStudents, theoryApprovedCount, submittedWorkshopsCount, overdueStudentsCount } =
    summary

  return (
    // En móvil van de a dos para ocupar menos alto; en escritorio, en cuatro.
    <section
      aria-label="Resumen del seguimiento de estudiantes"
      className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4"
    >
      {/* 1. Estudiantes en seguimiento. */}
      <StatCard
        icon={<Users size={20} />}
        label="Estudiantes"
        value={String(totalStudents)}
        detail="en seguimiento"
        isLoading={isLoading}
      />

      {/* 2. Cuántos aprobaron el marco teórico (requisito para los talleres). */}
      <StatCard
        icon={<GraduationCap size={20} />}
        label="Marco teórico"
        value={`${theoryApprovedCount} de ${totalStudents}`}
        detail="aprobado"
        isLoading={isLoading}
      />

      {/* 3. Talleres entregados entre todos los estudiantes (4 por estudiante). */}
      <StatCard
        icon={<ClipboardCheck size={20} />}
        label="Talleres"
        value={`${submittedWorkshopsCount} de ${totalStudents * 4}`}
        detail="entregados en total"
        isLoading={isLoading}
      />

      {/* 4. Estudiantes con alguna entrega atrasada. */}
      <StatCard
        icon={<CalendarX size={20} />}
        label="Plazos vencidos"
        value={String(overdueStudentsCount)}
        // Singular o plural según la cantidad.
        detail={overdueStudentsCount === 1 ? 'estudiante atrasado' : 'estudiantes atrasados'}
        isLoading={isLoading}
      />
    </section>
  )
}
