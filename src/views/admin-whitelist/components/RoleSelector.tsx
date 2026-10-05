import { GraduationCap, Presentation, ShieldCheck } from 'lucide-react'

import { ROLE_LABELS, WHITELIST_ROLES, type WhitelistRole } from '../../../models/whitelist'

/* ------------------------------------------------
   RoleSelector — HU-01 / RF-01
   Elige el perfil de los correos que se autorizan.
   Estudiantes, profesores guía y administradores.
   ------------------------------------------------ */

interface RoleSelectorProps {
  /** Identificador único del grupo de opciones. */
  name: string
  legend: string
  value: WhitelistRole
  onChange: (role: WhitelistRole) => void
}

const ROLE_ICONS = {
  student: GraduationCap,
  teacher: Presentation,
  admin: ShieldCheck,
} as const

const ROLE_HINTS: Record<WhitelistRole, string> = {
  student: 'Estudiante en práctica profesional',
  teacher: 'Docente de la asignatura',
  admin: 'Administrador del sistema',
}

export default function RoleSelector({ name, legend, value, onChange }: RoleSelectorProps) {
  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-medium text-texto/80">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {WHITELIST_ROLES.map((role) => {
          const Icon = ROLE_ICONS[role]
          const isSelected = value === role
          return (
            <label
              key={role}
              className={`
                flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors
                has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/30
                ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}
              `}
            >
              <input
                type="radio"
                name={name}
                value={role}
                checked={isSelected}
                onChange={() => onChange(role)}
                className="sr-only"
              />
              <span
                className={`rounded-lg p-2 ${isSelected ? 'bg-primary text-white' : 'bg-bg text-primary'}`}
                aria-hidden="true"
              >
                <Icon size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-texto">{ROLE_LABELS[role]}</span>
                <span className="block text-xs text-texto/60">{ROLE_HINTS[role]}</span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
