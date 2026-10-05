import { Info } from 'lucide-react'

/* ------------------------------------------------
   PrototypeNotice — HU-06 / RF-06

   Aviso fijo que aclara que los datos de este panel
   son simulados: la configuración se guarda solo en
   este navegador y todavía no cambia los plazos ni los
   intentos que ven los estudiantes.

   No recibe datos: siempre muestra el mismo mensaje.
   ------------------------------------------------ */
export default function PrototypeNotice() {
  return (
    // Caja con borde y fondo celeste suave (color secundario del proyecto).
    <div className="flex items-start gap-3 rounded-xl border border-secondary/30 bg-secondary/5 p-4">
      {/* Ícono decorativo: aria-hidden evita que el lector de pantalla lo lea. */}
      <Info size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
      <p className="text-sm text-texto md:text-base">
        <strong className="font-medium">Datos simulados.</strong> Esta configuración se guarda solo
        en este navegador y todavía no modifica los plazos ni los intentos que ven los estudiantes.
      </p>
    </div>
  )
}
