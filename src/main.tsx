import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

/* Fuentes — AI_GUIDELINES sección 5 (alojadas localmente, sin CDN) */
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/plus-jakarta-sans/600.css'
import '@fontsource/plus-jakarta-sans/700.css'

import './assets/styles/tokens.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
