/**
 * @module main
 *
 * Punto de entrada de la aplicación: es el primer archivo que ejecuta Vite.
 *
 * Aquí se cargan los estilos globales y se "monta" React dentro del
 * elemento `<div id="root">` de `index.html`. Los componentes se anidan
 * como capas, de afuera hacia adentro:
 *
 *   StrictMode     → avisa en desarrollo de malas prácticas de React.
 *   ErrorBoundary  → si algo falla al dibujar, muestra un mensaje en vez de
 *                    dejar la pantalla en blanco.
 *   BrowserRouter  → permite navegar entre rutas (/docente, /estudiante…).
 *   AuthProvider   → comparte con toda la app quién inició sesión y su rol.
 *   App            → define qué pantalla corresponde a cada ruta.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

/* Fuentes (AI_GUIDELINES §5): se alojan en el proyecto con @fontsource, sin
   CDN de Google, y solo con los pesos que se usan (400, 500, 600 y 700). */
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-ext-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-ext-500.css'
import '@fontsource/plus-jakarta-sans/latin-600.css'
import '@fontsource/plus-jakarta-sans/latin-ext-600.css'
import '@fontsource/plus-jakarta-sans/latin-700.css'
import '@fontsource/plus-jakarta-sans/latin-ext-700.css'

/* Tokens de diseño (colores y tipografía) y directivas de Tailwind. */
import './assets/styles/tokens.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { AuthProvider } from './context/AuthContext'

// El "!" le indica a TypeScript que el elemento #root siempre existe en index.html.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
