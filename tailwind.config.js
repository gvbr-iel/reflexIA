/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Base (AI_GUIDELINES sección 4) */
        primary:      '#1E5AA8',  /* azul institucional */
        secondary:    '#2BA3B8',  /* celeste / verde agua */
        'accent-ia':  '#059669',  /* esmeralda: IA del logo */
        bg:           '#F7FAFC',
        surface:      '#FFFFFF',
        texto:        '#1F2937',  /* "texto" para no colisionar con text-* de Tailwind */
        border:       '#D6E0EA',

        /* Desempeño - rueda (AI_GUIDELINES sección 4) */
        'perf-none':      '#9CA3AF',  /* gris */
        'perf-fail':      '#DC2626',  /* rojo: SOLO semántico */
        'perf-pass':      '#0F8FA8',  /* azul verdoso */
        'perf-excellent': '#059669',  /* esmeralda */
      },
      fontFamily: {
        /* Tipografía (AI_GUIDELINES sección 5) */
        heading: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
