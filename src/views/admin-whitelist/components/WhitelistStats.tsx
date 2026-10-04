import { type ReactNode } from 'react'
import { GraduationCap, Presentation, ShieldCheck, UserX } from 'lucide-react'

import type { WhitelistStats as Stats } from '../../../models/whitelist'

/* ------------------------------------------------
   WhitelistStats — HU-01 / RF-01
   Resumen del estado de la whitelist.
   ------------------------------------------------ */

interface WhitelistStatsProps {
  stats: Stats
  isLoading: boolean
}

interface StatCardProps {
  icon: ReactNode
  label: string
  value: number
  detail: string
  isLoading: boolean
}

function StatCard({ icon, label, value, detail, isLoading }: StatCardProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 md:p-5">
      <span
        className="hidden shrink-0 rounded-lg bg-primary/10 p-2.5 text-primary sm:block"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm text-texto/70">{label}</p>
        {isLoading ? (
          <>
            <div className="my-1 h-7 w-12 animate-pulse rounded-md bg-border/50" />
            <div className="h-3 w-24 animate-pulse rounded bg-border/50" />
          </>
        ) : (
          <>
            <p className="font-heading text-2xl font-bold text-texto">{value}</p>
            <p className="text-xs text-texto/60">{detail}</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function WhitelistStats({ stats, isLoading }: WhitelistStatsProps) {
  return (
    <section
      aria-label="Resumen de la whitelist"
      className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4"
    >
      <StatCard
        icon={<ShieldCheck size={20} />}
        label="Accesos activos"
        value={stats.active}
        detail={`de ${stats.total} correos registrados`}
        isLoading={isLoading}
      />
      <StatCard
        icon={<GraduationCap size={20} />}
        label="Estudiantes"
        value={stats.students}
        detail="con acceso activo"
        isLoading={isLoading}
      />
      <StatCard
        icon={<Presentation size={20} />}
        label="Profesores guía"
        value={stats.teachers}
        detail="con acceso activo"
        isLoading={isLoading}
      />
      <StatCard
        icon={<UserX size={20} />}
        label="Accesos revocados"
        value={stats.revoked}
        detail="pueden restablecerse"
        isLoading={isLoading}
      />
    </section>
  )
}
