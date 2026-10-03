# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

ReflexIA es un prototipo **solo frontend** (React 18 + TypeScript + Vite + Tailwind v3) de una plataforma de práctica profesional docente. **No hay backend**: toda la persistencia es un mock sobre `localStorage`. No agregues llamadas reales a una API ni dependas de un servidor.

Contexto, requisitos (RF/RNF) y reglas del equipo, que debes respetar en todo cambio:

@AI_GUIDELINES.md

`README.md` tiene los RF/RNF completos y el mapa de rutas.

## Comandos

```bash
npm run dev            # servidor de desarrollo (Vite, puerto 5173)
npm run build          # tsc && vite build
npx tsc --noEmit       # verificación de tipos: la única comprobación automática útil
```

- **No hay tests**: no existe librería de pruebas ni forma de ejecutar un test individual.
- **`npm run lint` está roto**: el script existe pero no hay `eslint` instalado ni configuración.
- `tsconfig.json` es estricto con `noUnusedLocals` y `noUnusedParameters`: un import sin usar rompe `npm run build`.
- No hay alias `@/`. Usa rutas relativas aunque algún comentario JSDoc muestre `'@/models/...'`.

## Arquitectura

**Rutas y layouts.** `src/App.tsx` define rutas anidadas por rol (`/admin`, `/docente`, `/estudiante`). Cada rol tiene un layout en `src/layouts/` con header y menú lateral de 240 px (`w-60`, fijo desde `md`) y renderiza la vista hija con `<Outlet />`. No hay autenticación ni guardas de ruta todavía. Las rutas `/estudiante/talleres` e `/estudiante/innovaciones` parecen cruzadas respecto de AI_GUIDELINES §6 (talleres es `critical-incidents/`, innovaciones es `repository/`); no las cambies sin acordarlo.

**Cadena de capas de cada feature.** El patrón a seguir es siempre:

`models/<feature>.ts` (tipos y constantes) → `services/<feature>Service.ts` (mock con `localStorage`) → `views/<feature>/hooks/` (toda la lógica y el estado) → `views/<feature>/components/` (solo presentación) → `<Feature>View.tsx`.

- Los servicios exponen firmas estables con un `TODO` de Axios en cada método: al llegar el backend se cambian los cuerpos, no las firmas. Las vistas y componentes nunca llaman al servicio directamente, solo los hooks.
- `models/theoryQuiz.ts` y `models/criticalIncident.ts` son los contratos entre features; otros módulos los leen sin importar el feature.
- Claves de `localStorage` en uso: `reflexia_theory_attempts`, `reflexia_theory_approval`, `reflexia_incident_drafts`, `reflexia_incident_attempts`.

**Dependencia HU-03 (incidentes) → HU-04 (marco teórico).** Los talleres solo se habilitan si el estudiante aprobó el marco teórico. Esa condición se consulta en **un único punto**: `views/critical-incidents/hooks/useTheoryGate.ts`, que llama a `theoryQuizService.getApprovalStatus()` y falla cerrado. El servicio de incidentes **no** conoce HU-04. `DevTheoryToggle` y `dev/theoryApprovalSimulator.ts` simulan la aprobación escribiendo directamente la clave `reflexia_theory_approval` (acoplamiento deliberado, solo con `import.meta.env.DEV`); se eliminan cuando HU-04 esté integrada.

**Invariante de HU-03.** Guardar un borrador **nunca** descuenta intentos de revisión: `criticalIncidentService.saveDraft` solo escribe la clave de borradores. El asistente es por taller (`workshopId`, talleres 1 a 4 con desbloqueo lineal).

## Convenciones que no se deducen del código

- **Estilos:** Tailwind con tokens. Los nombres de color de Tailwind (`texto`, `accent-ia`, `perf-fail`, `bg`, `surface`, `border`) no coinciden con las variables CSS (`--color-text`, ...). `tailwind.config.js` repite los hex de `src/assets/styles/tokens.css`: si cambias un color, cámbialo en ambos.
- **Patrón de referencia para vistas nuevas:** `views/critical-incidents/` (Tailwind, `components/Button`, `Modal`). Los componentes de `views/theory-verification/` usan estilos inline y hex sueltos, lo que contradice las reglas R1 y R3: no los copies.
- **Rojo:** solo como color semántico de desempeño (`perf-fail`), nunca para errores de formulario ni botones; evita la variante `danger` de `Button` por eso.
- **Diseño adaptable:** los breakpoints de Tailwind miden el viewport, pero el menú lateral resta 240 px al contenido desde `md`. Para distribuciones en dos columnas usa `xl`, no `lg`.
- **Hooks asíncronos:** descarta respuestas atrasadas con una referencia al último request (ver `useTheoryReferences`, `useWorkshops`) y no pongas efectos secundarios dentro de updaters de `setState`: `StrictMode` (activo en `main.tsx`) los ejecuta dos veces.

## Estado de integración (verifica con git, puede haber cambiado)

- La vista real de HU-04 (`TheoryQuizView`, la rueda del dashboard) vivía en `origin/marcoTeorico` (commit `8a05d83`) y no había llegado a `main`, que solo tenía el placeholder. El hook, el servicio y los componentes de HU-04 sí están en `main`.
- Salvo HU-04 y HU-03 (en la rama `incidentesCriticos`), todas las demás vistas son placeholders de 9 líneas.

## Flujo de trabajo del equipo

- Ramas, formato de commit (`tipo: descripción`, hasta 72 caracteres) y demás en AI_GUIDELINES §10.
- Por defecto no hagas commit ni push: el equipo commitea desde GitHub Desktop. Propón el mensaje (resumen y descripción) y los archivos a incluir en cada commit. Si la tarea pide varios commits, ordénalos de abajo hacia arriba para que cada uno compile por sí solo.
- Los `.ts` y `.tsx` usan CRLF en Windows (`autocrlf=true`); los avisos de LF/CRLF de Git son normales.
- En este entorno de Windows, los heredocs largos con muchas comillas fallan en Bash: crea los archivos grandes con la herramienta de escritura.
