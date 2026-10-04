/* ------------------------------------------------
   Clases compartidas por los campos de formulario
   de la whitelist. Texto de 16 px para evitar el
   zoom automático de iOS (AI_GUIDELINES §5).
   ------------------------------------------------ */

export const fieldClassName = `
  w-full rounded-lg border border-border bg-surface
  px-3 text-base text-texto placeholder:text-texto/50
  transition-colors
  hover:border-primary/40
  focus-visible:outline-none focus-visible:border-primary
  focus-visible:ring-2 focus-visible:ring-primary/30
`

export const labelClassName = 'block text-sm font-medium text-texto/80 mb-1.5'
