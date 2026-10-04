import { GraduationCap, Presentation, RotateCcw, UserX } from 'lucide-react'

import Button from '../../../components/Button'
import Table, { type Column } from '../../../components/Table'
import {
  ROLE_LABELS,
  STATUS_LABELS,
  type WhitelistEntry,
  type WhitelistRole,
  type WhitelistStatus,
} from '../../../models/whitelist'

/* ------------------------------------------------
   WhitelistTable — HU-01 / RF-01
   Correos autorizados con su perfil, estado y
   acciones para revocar o restablecer el acceso.
   Usa la tabla global (tarjetas en móvil).
   ------------------------------------------------ */

interface WhitelistTableProps {
  entries: WhitelistEntry[]
  isLoading: boolean
  emptyMessage: string
  isPending: (id: string) => boolean
  onRevoke: (entry: WhitelistEntry) => void
  onRestore: (entry: WhitelistEntry) => void
}

const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso))
}

function RoleBadge({ role }: { role: WhitelistRole }) {
  const Icon = role === 'student' ? GraduationCap : Presentation
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-texto">
      <Icon size={16} className="text-primary" aria-hidden="true" />
      {ROLE_LABELS[role]}
    </span>
  )
}

/* El estado se distingue por texto y forma (punto lleno o vacío), no solo por color. */
function StatusBadge({ status, revokedAt }: { status: WhitelistStatus; revokedAt: string | null }) {
  const isActive = status === 'active'
  return (
    <span className="inline-flex flex-col items-end gap-0.5 md:items-start">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
          isActive
            ? 'bg-primary/10 text-primary'
            : 'border border-border bg-bg text-texto/70'
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            isActive ? 'bg-primary' : 'border-2 border-texto/50'
          }`}
          aria-hidden="true"
        />
        {STATUS_LABELS[status]}
      </span>
      {!isActive && revokedAt && (
        <span className="text-xs text-texto/60">desde {formatDate(revokedAt)}</span>
      )}
    </span>
  )
}

export default function WhitelistTable({
  entries,
  isLoading,
  emptyMessage,
  isPending,
  onRevoke,
  onRestore,
}: WhitelistTableProps) {
  const columns: Column<WhitelistEntry>[] = [
    {
      key: 'email',
      label: 'Correo',
      render: (_, row) => (
        <span className="break-all font-medium text-texto">{row.email}</span>
      ),
    },
    {
      key: 'role',
      label: 'Perfil',
      render: (_, row) => <RoleBadge role={row.role} />,
    },
    {
      key: 'status',
      label: 'Estado',
      render: (_, row) => <StatusBadge status={row.status} revokedAt={row.revokedAt} />,
    },
    {
      key: 'addedAt',
      label: 'Fecha de alta',
      render: (_, row) => (
        <span className="whitespace-nowrap text-texto/70">{formatDate(row.addedAt)}</span>
      ),
    },
    {
      key: 'id',
      label: 'Acciones',
      render: (_, row) =>
        row.status === 'active' ? (
          <Button
            variant="outline"
            size="sm"
            icon={<UserX size={16} />}
            isLoading={isPending(row.id)}
            onClick={() => onRevoke(row)}
            aria-label={`Revocar acceso de ${row.email}`}
          >
            Revocar
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            icon={<RotateCcw size={16} />}
            isLoading={isPending(row.id)}
            onClick={() => onRestore(row)}
            aria-label={`Restablecer acceso de ${row.email}`}
          >
            Restablecer
          </Button>
        ),
    },
  ]

  return (
    <Table
      columns={columns}
      data={entries}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      rowKey="id"
    />
  )
}
