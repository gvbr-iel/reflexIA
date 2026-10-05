import { Save } from 'lucide-react'

import Button from '../../../components/Button'

/* ------------------------------------------------
   PacingSaveBar — HU-06 / RF-06

   Barra fija en la parte inferior de la pantalla. Aparece
   solo cuando hay cambios sin guardar y ofrece dos botones:
   Descartar y Guardar cambios.

   Detalles de posición:
     - fixed bottom-0: se queda pegada abajo aunque se haga scroll.
     - md:left-60: desde pantallas medianas deja libre el menú
       lateral (240 px de ancho).
     - z-20: queda debajo de los modales (z-50) y del menú móvil
       (z-30), para que no los tape.

   La vista decide cuándo mostrarla; este componente solo
   la dibuja.
   ------------------------------------------------ */

interface PacingSaveBarProps {
  /** true si hay errores en el borrador: en ese caso no se puede guardar. */
  hasErrors: boolean
  /** true mientras se está guardando: el botón muestra un indicador de carga. */
  isSaving: boolean
  /** Se llama al presionar "Guardar cambios". */
  onSave: () => void
  /** Se llama al presionar "Descartar". */
  onDiscard: () => void
}

export default function PacingSaveBar({ hasErrors, isSaving, onSave, onDiscard }: PacingSaveBarProps) {
  return (
    // role="region" con nombre: los lectores de pantalla la anuncian como una zona aparte.
    <div
      role="region"
      aria-label="Cambios sin guardar"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface px-4 py-3 shadow-lg md:left-60"
    >
      {/* Contenedor centrado que sigue el mismo ancho máximo que la página. */}
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* El mensaje cambia si hay errores que corregir antes de guardar. */}
        <p className="text-sm text-texto">
          {hasErrors
            ? 'Corrige las fechas marcadas para poder guardar.'
            : 'Tienes cambios sin guardar.'}
        </p>

        <div className="flex gap-2">
          {/* Descartar: vuelve a lo último guardado. Se bloquea mientras se guarda. */}
          <Button variant="outline" onClick={onDiscard} disabled={isSaving} className="flex-1 sm:flex-none">
            Descartar
          </Button>

          {/* Guardar: se bloquea si hay errores. isLoading muestra el indicador de carga. */}
          <Button
            icon={<Save size={18} />}
            onClick={onSave}
            disabled={hasErrors}
            isLoading={isSaving}
            className="flex-1 sm:flex-none"
          >
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  )
}
