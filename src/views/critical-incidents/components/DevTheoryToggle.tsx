import Button from '../../../components/Button'

/* ------------------------------------------------
   DevTheoryToggle — SOLO DESARROLLO
   Permite simular que el marco teórico (HU-04) está
   aprobado o no, mientras esa vista no esté integrada.
   No se renderiza fuera de `npm run dev`.
   ------------------------------------------------ */

interface DevTheoryToggleProps {
  /** Estado de aprobación actual (el que ve el feature). */
  isApproved: boolean
  /** Alterna la aprobación simulada. */
  onToggle: () => void
}

export default function DevTheoryToggle({ isApproved, onToggle }: DevTheoryToggleProps) {
  if (!import.meta.env.DEV) return null

  return (
    <div
      role="note"
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-secondary bg-secondary/5 px-4 py-3"
    >
      <p className="text-sm text-texto">
        <strong className="font-heading font-semibold">Modo desarrollo:</strong>{' '}
        marco teórico {isApproved ? 'aprobado' : 'no aprobado'} (simulado).
      </p>
      <Button variant="outline" size="sm" onClick={onToggle}>
        {isApproved ? 'Simular no aprobado' : 'Simular aprobado'}
      </Button>
    </div>
  )
}
