import { type DragEvent, type ChangeEvent, useRef, useState } from 'react'
import { Upload } from 'lucide-react'

/* ------------------------------------------------
   Dropzone — componente reutilizable global
   Arrastrar y soltar archivos o clic para seleccionar.
   Validación de tipos y tamaño máximo.
   ------------------------------------------------ */

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void
  accept?: string          /* ej: ".csv,.xlsx" */
  maxSizeMB?: number       /* tamaño máximo por archivo */
  multiple?: boolean
  label?: string
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
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const maxSizeBytes = maxSizeMB * 1024 * 1024

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

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const files = validateFiles(e.dataTransfer.files)
    if (files.length > 0) onFilesSelected(files)
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    const files = validateFiles(e.target.files)
    if (files.length > 0) onFilesSelected(files)
    e.target.value = ''
  }

  return (
    <div>
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
