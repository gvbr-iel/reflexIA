# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

ReflexIA es un prototipo **solo frontend** (React 18 + TypeScript + Vite + Tailwind v3) de una plataforma de práctica profesional docente. No hay backend propio: los datos de talleres siguen en `localStorage`; Firebase Authentication y Firestore se usan para autenticación estudiantil y whitelist. La configuración de HU-08 está en `HU08_GUIA.md`.

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

**Rutas y layouts.** `src/App.tsx` define rutas anidadas por rol (`/admin`, `/docente`, `/estudiante`) y la ruta `/iniciar-sesion`. `RequireStudent` protege `/estudiante/*` con Firebase Authentication y una autorización activa en Firestore. Cada rol tiene un layout en `src/layouts/` con header y menú lateral de 240 px (`w-60`, fijo desde `md`) y renderiza la vista hija con `<Outlet />`. `/estudiante/talleres` es la lista de talleres (`RepositoryView`) y `/estudiante/innovaciones/:workshopId?` es el asistente de incidentes críticos (`CriticalIncidentView`); el taller elegido va en la URL. Esos nombres parecen cruzados respecto de AI_GUIDELINES §6 (talleres es `critical-incidents/`, innovaciones es `repository/`); no los cambies sin acordarlo, y si se renombran hazlo en `utils/routes.ts` y en `App.tsx`.
**Rutas y layouts.** `src/App.tsx` define rutas anidadas por rol (`/admin`, `/docente`, `/estudiante`). Cada rol tiene un layout en `src/layouts/` con header y menú lateral de 240 px (`w-60`, fijo desde `md`) y renderiza la vista hija con `<Outlet />`. No hay autenticación ni guardas de ruta todavía. `/estudiante/talleres` es la lista de talleres (`RepositoryView`) y `/estudiante/talleres/:workshopId` abre el asistente de incidentes críticos de ese taller (`CriticalIncidentView`) sin salir de la sección; el taller elegido va en la URL. `/estudiante/innovaciones` es un placeholder (`InnovationsView`) para RF-07. La carpeta `repository/` contiene hoy la lista de talleres, no la biblioteca de innovaciones que AI_GUIDELINES §6 le asigna. Si se renombran las rutas, hazlo en `utils/routes.ts` y en `App.tsx`.

**Cadena de capas de cada feature.** El patrón a seguir es siempre:

`models/<feature>.ts` (tipos y constantes) → `services/<feature>Service.ts` (mock con `localStorage`, salvo Firebase para autenticación y whitelist) → `views/<feature>/hooks/` (toda la lógica y el estado) → `views/<feature>/components/` (solo presentación) → `<Feature>View.tsx`.

- Los servicios de talleres conservan persistencia mock con `localStorage`; autenticación y whitelist usan Firebase. Las vistas y componentes nunca llaman al servicio directamente, solo los hooks.
- `models/theoryQuiz.ts` y `models/criticalIncident.ts` son los contratos entre features; otros módulos los leen sin importar el feature.
- Claves base de `localStorage` para talleres: `reflexia_theory_attempts`, `reflexia_theory_approval`, `reflexia_incident_drafts`, `reflexia_incident_attempts` y `reflexia_incident_results`; se particionan por UID con `utils/userStorage.ts`. La whitelist usa Firestore.
- Un hook o componente que usan dos features va a `src/hooks/` o `src/components/` (regla R2), no se importa de un feature a otro. Ejemplos: `useWorkshops`, `WorkshopStatusBadge`.

**Dependencia HU-03 (incidentes) → HU-04 (marco teórico).** Los talleres solo se habilitan si el estudiante aprobó el marco teórico. Esa condición se consulta en **un único punto**: `views/critical-incidents/hooks/useTheoryGate.ts`, que llama a `theoryQuizService.getApprovalStatus()` y falla cerrado. El servicio de incidentes **no** conoce HU-04. `DevTheoryToggle` y `dev/theoryApprovalSimulator.ts` simulan la aprobación en la clave `reflexia_theory_approval` particionada por UID (solo con `import.meta.env.DEV`).

**Invariante de HU-03.** Guardar un borrador **nunca** descuenta intentos de revisión: `criticalIncidentService.saveDraft` solo escribe la clave de borradores. El asistente es por taller (`workshopId`, talleres 1 a 4 con desbloqueo lineal).

**Fuente única de los talleres.** La lista de talleres y su estado salen de `criticalIncidentService.fetchWorkshops()`, a través del hook global `src/hooks/useWorkshops.ts`, y la leen tanto el asistente como `RepositoryView`; no vuelvas a escribir la lista a mano en una vista. Un taller con resultado (`outcome`: aprobado o reprobado) queda completado y, en ambos casos, desbloquea el siguiente. El resultado se simula solo con `npm run dev` (`dev/useWorkshopResultSimulator.ts` y los métodos `simulateWorkshopResult` y `clearWorkshopResult` del servicio); se eliminan cuando el resultado lo entregue un backend.

## Convenciones que no se deducen del código

- **Estilos:** Tailwind con tokens. Los nombres de color de Tailwind (`texto`, `accent-ia`, `perf-fail`, `bg`, `surface`, `border`) no coinciden con las variables CSS (`--color-text`, ...). `tailwind.config.js` repite los hex de `src/assets/styles/tokens.css`: si cambias un color, cámbialo en ambos.
- **Patrón de referencia para vistas nuevas:** `views/critical-incidents/` (Tailwind, `components/Button`, `Modal`). Los componentes de `views/theory-verification/` usan estilos inline y hex sueltos, lo que contradice las reglas R1 y R3: no los copies.
- **Rojo:** solo como color semántico de desempeño (`perf-fail`), nunca para errores de formulario ni botones; evita la variante `danger` de `Button` por eso.
- **Diseño adaptable:** los breakpoints de Tailwind miden el viewport, pero el menú lateral resta 240 px al contenido desde `md`. Para distribuciones en dos columnas usa `xl`, no `lg`.
- **Hooks asíncronos:** descarta respuestas atrasadas con una referencia al último request (ver `useTheoryReferences`, `useWorkshops`) y no pongas efectos secundarios dentro de updaters de `setState`: `StrictMode` (activo en `main.tsx`) los ejecuta dos veces.

## Estado de integración (verifica con git, puede haber cambiado)

- HU-04 (`TheoryQuizView`, hook, servicio y componentes) y HU-03 (asistente, selector y resultado de talleres) ya están integradas en `main`. Del asistente aún faltan el envío a revisión, la retroalimentación "El Impulso" y la anonimización (RF-05).
- HU-01 (whitelist de `/admin/whitelist`) conserva filtros, carga masiva, alta y revocación; ahora persiste en Firestore y las operaciones de administración requieren el custom claim `admin: true`. El acceso estudiantil usa Firebase Authentication y `whitelistService.checkAccess(email)`.
- Siguen pendientes las reflexiones, los plazos y el panel docente. Los datos de talleres permanecen en almacenamiento local particionado por UID. Consulta `HU08_GUIA.md` para la configuración de autenticación y whitelist.

## Flujo de trabajo del equipo

- Ramas, formato de commit (`tipo: descripción`, hasta 72 caracteres) y demás en AI_GUIDELINES §10.
- Por defecto no hagas commit ni push: el equipo commitea desde GitHub Desktop. Propón el mensaje (resumen y descripción) y los archivos a incluir en cada commit. Si la tarea pide varios commits, ordénalos de abajo hacia arriba para que cada uno compile por sí solo.
- Los `.ts` y `.tsx` usan CRLF en Windows (`autocrlf=true`); los avisos de LF/CRLF de Git son normales.
- En este entorno de Windows, los heredocs largos con muchas comillas fallan en Bash: crea los archivos grandes con la herramienta de escritura.
