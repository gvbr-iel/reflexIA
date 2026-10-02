import { type ReactNode } from 'react'

/* ------------------------------------------------
   Table — componente reutilizable global
   Responsive: tabla en desktop, tarjetas en móvil.
   Estados de carga (skeleton) y vacío.
   ------------------------------------------------ */

export interface Column<T> {
  key: keyof T & string
  label: string
  render?: (value: T[keyof T], row: T) => ReactNode
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  emptyMessage?: string
  rowKey: keyof T & string
}

export default function Table<T extends Record<string, unknown>>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No hay datos para mostrar.',
  rowKey,
}: TableProps<T>) {
  /* ---- Estado de carga (skeleton) ---- */
  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Cargando datos">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-12 bg-bg rounded-lg animate-pulse"
          />
        ))}
      </div>
    )
  }

  /* ---- Estado vacío ---- */
  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-texto/60">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <>
      {/* ===== Vista desktop (tabla) ===== */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 font-heading font-semibold text-sm text-texto/80"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={String(row[rowKey])}
                className="border-b border-border/50 hover:bg-bg/60 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm">
                    {col.render
                      ? col.render(row[col.key], row)
                      : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== Vista móvil (tarjetas) ===== */}
      <div className="md:hidden space-y-3">
        {data.map((row) => (
          <div
            key={String(row[rowKey])}
            className="bg-surface border border-border rounded-lg p-4 space-y-2"
          >
            {columns.map((col) => (
              <div key={col.key} className="flex justify-between text-sm">
                <span className="font-heading font-semibold text-texto/70">
                  {col.label}
                </span>
                <span className="text-right">
                  {col.render
                    ? col.render(row[col.key], row)
                    : String(row[col.key] ?? '')}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}
