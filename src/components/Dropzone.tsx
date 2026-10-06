import { type DragEvent, type ChangeEvent, useRef, useState } from 'react'
import { Upload } from 'lucide-react'

/* ------------------------------------------------
   Dropzone — componente reutilizable global
   Arrastrar y soltar archivos o clic para seleccionar.
   Validación de tipos y tamaño máximo.
   ------------------------------------------------ */

interface DropzoneProps {
  /** Recibe los archivos válidos que eligió el usuario. */
  onFilesSelected: (files: File[]) => void
  /** Tipos aceptados, por ejemplo ".csv,.xlsx" (por defecto, cualquiera). */
  accept?: string
  /** Tamaño máximo por archivo, en megabytes. */
  maxSizeMB?: number
  /** true permite elegir varios archivos a la vez. */
  multiple?: boolean
  /** Texto principal de la zona. */
  label?: string
  /** Texto de ayuda pequeño (opcional). */
  hint?: string
}

export default function Dropzone({
  onFilesSelected,
  accept = '*',
  maxSizeMB = 10,
  multiple = false,
  label = 'Arrastra tu archivo aquí o haz clic para seleccionar',
  hint,
}: DropzoneProps) {
  // true mientras el usuario arrastra un archivo encima (cambia el color del borde).
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Referencia al <input type="file"> oculto: se "clickea" por código al tocar la zona.
  const inputRef = useRef<HTMLInputElement>(null)

  // Megabytes → bytes (1 MB = 1024 × 1024 bytes).
  const maxSizeBytes = maxSizeMB * 1024 * 1024

  /** Revisa el tamaño de cada archivo. Si uno se pasa, muestra el error y no acepta ninguno. */
  function validateFiles(files: FileList | File[]): File[] {
    const valid: File[] = []
    setError(null)

    for (const file of Array.from(files)) {
      if (file.size > maxSizeBytes) {
        setError(`"${file.name}" supera el tamaño máximo de ${maxSizeMB} MB.`)
        return []
      }
      valid.push(file)
    }

    return valid
  }

  /** El usuario soltó archivos sobre la zona. */
  function handleDrop(e: DragEvent<HTMLDivElement>) {
    // Evita que el navegador abra el archivo en la pestaña.
    e.preventDefault()
    setIsDragging(false)
    const files = validateFiles(e.dataTransfer.files)
    if (files.length > 0) onFilesSelected(files)
  }

  /** El usuario eligió archivos con el selector del sistema. */
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    const files = validateFiles(e.target.files)
    if (files.length > 0) onFilesSelected(files)
    // Se vacía el input para que elegir el mismo archivo otra vez vuelva a funcionar.
    e.target.value = ''
  }

  return (
    <div>
      {/* Zona visible: funciona con clic, con teclado (Enter/Espacio) y arrastrando. */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        aria-label={label}
        className={`
          flex flex-col items-center justify-center gap-3
          p-8 rounded-xl border-2 border-dashed cursor-pointer
          transition-colors duration-150
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
          ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-bg'
          }
        `}
      >
        <Upload
          size={32}
          className={isDragging ? 'text-primary' : 'text-texto/40'}
        />
        <p className="text-sm text-texto/70 text-center">{label}</p>
        {hint && (
          <p className="text-xs text-texto/50 text-center">{hint}</p>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-perf-fail" role="alert">
          {error}
        </p>
      )}

      {/* Input real de archivos, oculto: lo activa la zona de arriba. */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  )
}
