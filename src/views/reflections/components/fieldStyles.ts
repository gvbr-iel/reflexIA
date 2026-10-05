/* ------------------------------------------------
   Estilos compartidos de los campos de formulario
   de la revisión de reflexiones (HU-02).

   Se guardan aquí para no repetir las mismas clases
   de Tailwind en cada campo.

   Nota: son una copia de los de
   admin-whitelist/components/fieldStyles.ts y
   work-pacing/components/fieldStyles.ts. Cuando el
   equipo cree un campo de formulario global (o se
   muevan a src/components/, regla R2), se reemplazan.
   ------------------------------------------------ */

// Estilo del campo (input, select o textarea):
//  - texto de 16 px (text-base), para que iOS no haga zoom al escribir
//    (AI_GUIDELINES §5)
//  - borde que se marca en azul al pasar el mouse o al enfocarlo con el teclado
//  - se ve atenuado y sin cursor de clic cuando está deshabilitado
export const fieldClassName = `
  w-full rounded-lg border border-border bg-surface
  px-3 text-base text-texto placeholder:text-texto/50
  transition-colors
  hover:border-primary/40
  focus-visible:outline-none focus-visible:border-primary
  focus-visible:ring-2 focus-visible:ring-primary/30
  disabled:cursor-not-allowed disabled:opacity-60
`

// Estilo de la etiqueta que va sobre cada campo.
export const labelClassName = 'block text-sm font-medium text-texto/80 mb-1.5'
