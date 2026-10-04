import { useState } from 'react'
import {
  CircleAlert,
  CircleCheck,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Info,
  RotateCcw,
  X,
} from 'lucide-react'

import Button from '../../../components/Button'
import Dropzone from '../../../components/Dropzone'
import Modal from '../../../components/Modal'
import type {
  BulkImportPayload,
  BulkPreviewRow,
  BulkRowStatus,
  WhitelistEntry,
} from '../../../models/whitelist'
import { useBulkUpload, type BulkSourceMode } from '../hooks/useBulkUpload'
import type { ActionResult } from '../hooks/useWhitelist'
import { fieldClassName, labelClassName } from './fieldStyles'
import RoleSelector from './RoleSelector'

/* ------------------------------------------------
   UploadModal — HU-01 / RF-01
   Carga masiva de correos desde un CSV/TXT o texto
   pegado, con vista previa de lo que se importará
   antes de confirmar.
   ------------------------------------------------ */

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  /** Whitelist actual, para detectar correos ya registrados. */
  entries: WhitelistEntry[]
  onImport: (payload: BulkImportPayload) => Promise<ActionResult>
}

const SOURCE_OPTIONS: Array<{ mode: BulkSourceMode; label: string; icon: typeof FileSpreadsheet }> = [
  { mode: 'file', label: 'Subir archivo', icon: FileSpreadsheet },
  { mode: 'paste', label: 'Pegar correos', icon: ClipboardList },
]

/* Texto e ícono de cada resultado de la vista previa. */
const ROW_STATUS: Record<BulkRowStatus, { label: string; icon: typeof Info; importable: boolean }> = {
  new: { label: 'Se agregará', icon: CircleCheck, importable: true },
  reactivate: { label: 'Se reactivará', icon: RotateCcw, importable: true },
  existing: { label: 'Ya está activo', icon: Info, importable: false },
  duplicate: { label: 'Repetido en la lista', icon: Info, importable: false },
  'invalid-format': { label: 'Formato no válido', icon: CircleAlert, importable: false },
  'invalid-domain': { label: 'No es @ucen.cl', icon: CircleAlert, importable: false },
}

function SummaryItem({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg px-3 py-2">
      <p className="font-heading text-xl font-bold text-texto">{value}</p>
      <p className="text-xs text-texto/70">{label}</p>
    </div>
  )
}

function PreviewRow({ row }: { row: BulkPreviewRow }) {
  const { label, icon: Icon, importable } = ROW_STATUS[row.status]
  return (
    <li className="flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <span className="flex min-w-0 items-baseline gap-2">
        <span className="w-14 shrink-0 text-xs text-texto/50">Línea {row.line}</span>
        <span className={`break-all text-sm ${importable ? 'text-texto' : 'text-texto/60'}`}>
          {row.value}
        </span>
      </span>
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 pl-16 text-xs font-medium sm:pl-0 ${
          importable ? 'text-primary' : 'text-texto/70'
        }`}
      >
        <Icon size={14} aria-hidden="true" />
        {label}
      </span>
    </li>
  )
}

export default function UploadModal({ isOpen, onClose, entries, onImport }: UploadModalProps) {
  const bulk = useBulkUpload(entries)
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const toImport = bulk.emailsToImport.length
  const skipped = bulk.rows.length - toImport

  /* Las filas que se omiten van primero para que el administrador las revise. */
  const sortedRows = [...bulk.rows].sort(
    (a, b) => Number(ROW_STATUS[a.status].importable) - Number(ROW_STATUS[b.status].importable),
  )

  function handleClose() {
    if (isImporting) return
    bulk.reset()
    setImportError(null)
    onClose()
  }

  async function handleImport() {
    setImportError(null)
    setIsImporting(true)
    const result = await onImport({ emails: bulk.emailsToImport, role: bulk.role })
    setIsImporting(false)

    if (result.ok) {
      bulk.reset()
      onClose()
    } else {
      setImportError(result.message)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Carga masiva de correos"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={isImporting}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={toImport === 0} isLoading={isImporting}>
            {toImport === 1 ? 'Importar 1 correo' : `Importar ${toImport} correos`}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* ---- Paso 1: perfil ---- */}
        <RoleSelector
          name="bulk-role"
          legend="1. ¿A qué perfil corresponden los correos?"
          value={bulk.role}
          onChange={bulk.setRole}
        />

        {/* ---- Paso 2: origen ---- */}
        <fieldset className="space-y-3">
          <legend className="mb-1.5 block text-sm font-medium text-texto/80">
            2. Agrega los correos
          </legend>

          <div className="inline-flex rounded-lg border border-border bg-bg p-1">
            {SOURCE_OPTIONS.map(({ mode, label, icon: Icon }) => (
              <label
                key={mode}
                className={`
                  inline-flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors
                  has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/30
                  ${bulk.mode === mode ? 'bg-surface text-primary shadow-sm' : 'text-texto/70 hover:text-texto'}
                `}
              >
                <input
                  type="radio"
                  name="bulk-source"
                  value={mode}
                  checked={bulk.mode === mode}
                  onChange={() => bulk.setMode(mode)}
                  className="sr-only"
                />
                <Icon size={16} aria-hidden="true" />
                {label}
              </label>
            ))}
          </div>

          {bulk.mode === 'file' ? (
            <div className="space-y-3">
              {bulk.file ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-bg p-3">
                  <span className="flex min-w-0 items-center gap-2 text-sm text-texto">
                    <FileSpreadsheet size={20} className="shrink-0 text-primary" aria-hidden="true" />
                    <span className="truncate font-medium">{bulk.file.name}</span>
                  </span>
                  <Button variant="ghost" size="sm" icon={<X size={16} />} onClick={bulk.clearFile}>
                    Quitar
                  </Button>
                </div>
              ) : (
                <Dropzone
                  onFilesSelected={(files) => bulk.loadFile(files[0])}
                  accept=".csv,.txt"
                  maxSizeMB={1}
                  label={
                    bulk.isReadingFile
                      ? 'Leyendo archivo…'
                      : 'Arrastra tu archivo aquí o haz clic para seleccionarlo'
                  }
                  hint="CSV o TXT, con un correo por fila. Máximo 1 MB."
                />
              )}

              {bulk.fileError && (
                <p role="alert" className="flex items-start gap-1.5 text-sm text-texto">
                  <CircleAlert size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                  {bulk.fileError}
                </p>
              )}

              <Button
                variant="ghost"
                size="sm"
                icon={<Download size={16} />}
                onClick={bulk.downloadTemplate}
              >
                Descargar plantilla CSV
              </Button>
            </div>
          ) : (
            <div>
              <label htmlFor="bulk-paste" className={labelClassName}>
                Correos, uno por línea o separados por coma
              </label>
              <textarea
                id="bulk-paste"
                rows={6}
                value={bulk.pastedText}
                onChange={(e) => bulk.setPastedText(e.target.value)}
                placeholder={'estudiante.uno@ucen.cl\nestudiante.dos@ucen.cl'}
                className={`${fieldClassName} resize-y py-2 leading-relaxed`}
              />
            </div>
          )}
        </fieldset>

        {/* ---- Paso 3: vista previa ---- */}
        {bulk.rows.length > 0 && (
          <section aria-labelledby="bulk-preview-title" className="space-y-3">
            <h3 id="bulk-preview-title" className="text-sm font-medium text-texto/80">
              3. Revisa antes de importar
            </h3>

            <div className="grid grid-cols-3 gap-2">
              <SummaryItem value={bulk.counts.new} label="Nuevos" />
              <SummaryItem value={bulk.counts.reactivate} label="Por reactivar" />
              <SummaryItem value={skipped} label="Se omitirán" />
            </div>

            <ul
              className="max-h-64 divide-y divide-border overflow-y-auto rounded-lg border border-border"
              aria-label="Vista previa de los correos"
            >
              {sortedRows.map((row, index) => (
                <PreviewRow key={`${row.line}-${index}`} row={row} />
              ))}
            </ul>

            {skipped > 0 && (
              <p className="flex items-start gap-1.5 text-sm text-texto/70">
                <Info size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                Los correos omitidos no se importan. Corrígelos en el archivo y vuelve a subirlo si
                los necesitas.
              </p>
            )}
          </section>
        )}

        {importError && (
          <p role="alert" className="flex items-start gap-1.5 rounded-lg border border-border bg-bg p-3 text-sm text-texto">
            <CircleAlert size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
            {importError}
          </p>
        )}
      </div>
    </Modal>
  )
}
