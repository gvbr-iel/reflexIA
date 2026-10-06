import { useState } from 'react'
import { ShieldCheck, Upload, UserPlus } from 'lucide-react'

import Button from '../../components/Button'
import { INSTITUTIONAL_DOMAIN, type WhitelistEntry } from '../../models/whitelist'
import ActionNotice from './components/ActionNotice'
import AddEmailModal from './components/AddEmailModal'
import FilterBar from './components/FilterBar'
import RevokeAccessModal from './components/RevokeAccessModal'
import UploadModal from './components/UploadModal'
import WhitelistStats from './components/WhitelistStats'
import WhitelistTable from './components/WhitelistTable'
import { useWhitelist } from './hooks/useWhitelist'

/* ------------------------------------------------
   WhiteListView — HU-01 / RF-01, RNF-02
   Gestión de los correos institucionales autorizados:
   carga masiva, revisión de estado, filtros y
   revocación inmediata de accesos.
   Se monta dentro de AdminLayout (R6).

   Flujo de capas: WhiteListView → useWhitelist (lógica)
   → whitelistService (Firestore). La vista solo conecta
   los datos del hook con los componentes; el único
   estado propio es qué ventana (modal) está abierta.
   ------------------------------------------------ */
export default function WhiteListView() {
  // Toda la lógica y los datos de la pantalla.
  const whitelist = useWhitelist()
  // Qué ventana está abierta: carga masiva, autorizar correo o revocar.
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  // Correo que se quiere revocar (null = ventana de revocar cerrada).
  const [entryToRevoke, setEntryToRevoke] = useState<WhitelistEntry | null>(null)

  /** Cierra la ventana de confirmación y revoca el acceso. */
  function handleConfirmRevoke(entry: WhitelistEntry) {
    setEntryToRevoke(null)
    whitelist.revokeAccess(entry)
  }

  // Mensaje de la tabla vacía: distinto si hay filtros o si la lista está vacía de verdad.
  const emptyMessage = whitelist.hasActiveFilters
    ? 'Ningún correo coincide con los filtros. Prueba con otra búsqueda o limpia los filtros.'
    : 'Aún no hay correos autorizados. Usa "Carga masiva" para agregarlos.'

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* ---- Encabezado ---- */}
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="mb-2 font-heading text-2xl font-bold text-texto md:text-3xl">
            Whitelist de acceso
          </h1>
          <p className="max-w-2xl text-texto/70">
            Administra los correos institucionales autorizados para ingresar a ReflexIA.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            icon={<UserPlus size={18} />}
            onClick={() => setIsAddOpen(true)}
            disabled={whitelist.isLoading || whitelist.error !== null}
          >
            Autorizar correo
          </Button>
          <Button
            icon={<Upload size={18} />}
            onClick={() => setIsUploadOpen(true)}
            disabled={whitelist.isLoading || whitelist.error !== null}
          >
            Carga masiva
          </Button>
        </div>
      </header>

      {/* ---- Regla de acceso (RNF-02) ---- */}
      <div className="flex items-start gap-3 rounded-xl border border-secondary/30 bg-secondary/5 p-4">
        <ShieldCheck size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-sm text-texto md:text-base">
          Solo pueden ingresar <strong className="font-medium">estudiantes, profesores guía y administradores</strong>{' '}
          con un correo institucional{' '}
          <strong className="font-medium">{INSTITUTIONAL_DOMAIN}</strong> que esté activo en esta
          lista. Al revocar un acceso, el cambio es inmediato.
        </p>
      </div>

      <ActionNotice notice={whitelist.notice} onDismiss={whitelist.dismissNotice} />

      {whitelist.error ? (
        /* ---- Estado de error ---- */
        <div role="alert" className="space-y-4 rounded-xl border border-border bg-surface p-6">
          <p className="text-texto">{whitelist.error}</p>
          <Button variant="outline" onClick={whitelist.retry}>
            Reintentar
          </Button>
        </div>
      ) : (
        <>
          <WhitelistStats stats={whitelist.stats} isLoading={whitelist.isLoading} />

          {/* ---- Lista ---- */}
          <section
            aria-labelledby="whitelist-list-title"
            className="space-y-4 rounded-xl border border-border bg-surface p-4 md:p-6"
          >
            <h2 id="whitelist-list-title" className="font-heading text-lg font-semibold text-texto">
              Correos autorizados
            </h2>

            <FilterBar
              filters={whitelist.filters}
              onQueryChange={whitelist.setQuery}
              onStatusChange={whitelist.setStatusFilter}
              onRoleChange={whitelist.setRoleFilter}
              onClear={whitelist.clearFilters}
              hasActiveFilters={whitelist.hasActiveFilters}
              resultCount={whitelist.filteredEntries.length}
              totalCount={whitelist.entries.length}
              isLoading={whitelist.isLoading}
            />

            <WhitelistTable
              entries={whitelist.filteredEntries}
              isLoading={whitelist.isLoading}
              emptyMessage={emptyMessage}
              isPending={whitelist.isPending}
              onRevoke={setEntryToRevoke}
              onRestore={whitelist.restoreAccess}
            />
          </section>
        </>
      )}

      {/* ---- Modales ---- */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        entries={whitelist.entries}
        onImport={whitelist.importEntries}
      />
      <AddEmailModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={(email, role) => whitelist.addEntry({ email, role })}
      />
      <RevokeAccessModal
        entry={entryToRevoke}
        onCancel={() => setEntryToRevoke(null)}
        onConfirm={handleConfirmRevoke}
      />
    </div>
  )
}
