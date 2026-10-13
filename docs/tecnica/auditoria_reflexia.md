# 🔍 Auditoría Completa — ReflexIA

> **Versión:** 2.0 (Actualizada tras revisión integral de raíz, `src/` y `docs/`)
> **Fecha:** 11 de octubre de 2026
> **Alcance:** Frontend React/TypeScript/Vite + Firebase Auth + Firestore + OpenRouter API + Documentación del repositorio
> **Archivos auditados:** 65+ archivos (código fuente en `src/`, configuraciones en raíz y guías en `docs/`)

---

## Índice

1. [✨ Mejoras Recientemente Implementadas](#1--mejoras-recientemente-implementadas)
2. [🔴 Vulnerabilidades de Seguridad](#2--vulnerabilidades-de-seguridad)
3. [🟠 Bugs y Errores Funcionales](#3--bugs-y-errores-funcionales)
4. [🟡 Malas Prácticas y Deuda Técnica](#4--malas-prácticas-y-deuda-técnica)
5. [🔵 Riesgos Arquitectónicos](#5--riesgos-arquitectónicos)
6. [♿ Accesibilidad (a11y)](#6--accesibilidad-a11y)
7. [🎨 Mejoras de UX](#7--mejoras-de-ux)
8. [📦 Configuración y Tooling](#8--configuración-y-tooling)
9. [📚 Documentación y Mantenibilidad](#9--documentación-y-mantenibilidad)
10. [🧪 Testing](#10--testing)
11. [📋 Plan de Ejecución por Etapas](#11--plan-de-ejecución-por-etapas)

---

## 1. ✨ Mejoras Recientemente Implementadas

Durante las sesiones de trabajo previas se resolvieron de forma proactiva tres aspectos clave de seguridad, UX y consumo de recursos:

| Ref | Mejora implementada | Archivos modificados |
|---|---|---|
| **IMP-01** | **Validación reactiva en tiempo real en Login**: Se eliminó el texto estático de ayuda y se añadió validación dinámica en JS/React que alerta en rojo semántico (`text-perf-fail` / `CircleAlert`) mientras el usuario escribe si el correo no termina en `@ucen.cl`. Además, bloquea el submit prematuro. | [`src/views/auth/LoginView.tsx`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/views/auth/LoginView.tsx) |
| **IMP-02** | **Consolidación del relato para detección de datos sensibles (HU-05)**: Se eliminó el botón de detección repetido en cada paso (pasos 1 a 3) y se trasladó exclusivamente al final del asistente (paso 4). El proceso toma los 4 pasos del relato y los envía en una **única llamada consolidada a OpenRouter**, reduciendo drásticamente las peticiones por taller y la cuota de tokens. | [`src/views/critical-incidents/components/IncidentWizard.tsx`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/views/critical-incidents/components/IncidentWizard.tsx) |
| **IMP-03** | **Cancelación activa de IA mediante AbortController**: Se añadió soporte para `AbortSignal` en `openRouterService.ts` y en `useSensitiveDataDetector.ts`. Si el usuario no desea esperar o quiere evitar el gasto de IA, puede cancelar el análisis con un nuevo botón **"Cancelar"** incorporado directamente dentro de la tarjeta de carga (`SensitiveDataPreview.tsx`). La petición HTTP se aborta de inmediato y se detiene la rotación innecesaria de modelos. | [`src/services/openRouterService.ts`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/services/openRouterService.ts), [`src/views/critical-incidents/hooks/useSensitiveDataDetector.ts`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/views/critical-incidents/hooks/useSensitiveDataDetector.ts), [`src/views/critical-incidents/components/SensitiveDataPreview.tsx`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/views/critical-incidents/components/SensitiveDataPreview.tsx) |

---

## 2. 🔴 Vulnerabilidades de Seguridad

### SEC-01 · API Key de OpenRouter y credenciales de Firebase en cliente

| Severidad | Ubicación |
|-----------|-----------|
| **CRÍTICA** | [`.env`](file:///c:/Users/joaqu/Documents/Github/reflexIA/.env#L6), [`src/services/firebase.ts`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/services/firebase.ts#L28-L33), [`src/models/sensitiveData.ts`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/models/sensitiveData.ts#L140-L145) |

**Problema:**
1. La clave de OpenRouter (`sk-or-v1-...`) se lee desde variables de entorno de Vite (`import.meta.env.VITE_OPENROUTER_API_KEY`), lo que significa que viaja embebida en el bundle compilado de JavaScript y en los encabezados HTTP visibles desde las herramientas de desarrollador (DevTools → Network).
2. `firebase.ts` hardcodea las claves de Firebase del proyecto (`AIzaSyBzPCI1GIezQB_mzwkY-OLhWRZHp_UrKRg`, etc.) como fallback con el operador `??` (líneas 28–33). Aunque las credenciales web de Firebase son públicas por diseño, tenerlas quemadas en código fuente anula el desacoplamiento con `.env` e imposibilita apuntar a un entorno de staging/testing sin tocar el repositorio.
3. El arreglo `OPENROUTER_API_KEYS` en `sensitiveData.ts` sugiere guardar múltiples claves privadas en el cliente para rotación, exponiéndolas todas.

**Solución:**
- Para producción: Crear un proxy o backend (Cloud Functions, Node.js API, etc.) que custodie la clave de OpenRouter en servidor.
- Para el prototipo actual: Eliminar los fallbacks de Firebase en `firebase.ts`, forzar lectura estricta de `.env` y documentar que la clave de OpenRouter es de prueba y restringida por presupuesto.

---

### SEC-02 · Banco completo de preguntas y respuestas expuesto en el cliente

| Severidad | Ubicación |
|-----------|-----------|
| **ALTA** | [`src/services/theoryQuizService.ts`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/services/theoryQuizService.ts#L51-L412) |

**Problema:**
Las 30 preguntas de marco teórico, junto con la clave de respuesta correcta (`correctOptionId`) y las explicaciones completas, están hardcodeadas en el archivo JavaScript del frontend. Cualquier estudiante puede abrir las herramientas de desarrollador (DevTools → Sources / Console) y consultar las respuestas correctas antes de iniciar el cuestionario.

**Solución:**
- En el backend: El servidor debe entregar únicamente el enunciado y las opciones sin `correctOptionId`. La corrección del intento debe realizarse exclusivamente del lado del servidor.
- En el frontend: Mantener documentado como riesgo conocido de prototipo para la presentación docente.

---

### SEC-03 · Validación de datos sensibles puramente del lado del cliente

| Severidad | Ubicación |
|-----------|-----------|
| **ALTA** | [`src/services/openRouterService.ts`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/services/openRouterService.ts), [`src/views/critical-incidents/hooks/useImpulse.ts`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/views/critical-incidents/hooks/useImpulse.ts) |

**Problema:**
La detección de nombres propios y datos sensibles solo se valida en la interfaz. Si un estudiante manipula el estado local o las solicitudes HTTP, puede guardar o enviar relatos con nombres de menores e instituciones educativas sin anonimizar, violando la Ley 21.719 de Protección de Datos Personales.

**Solución:**
El backend debe ejecutar un filtro de anonimización obligatorio antes de persistir cualquier reflexión o enviarla al modelo de IA.

---

### SEC-04 · Ausencia de regla catch-all en Firestore Security Rules

| Severidad | Ubicación |
|-----------|-----------|
| **MEDIA** | [`firestore.rules`](file:///c:/Users/joaqu/Documents/Github/reflexIA/firestore.rules) |

**Problema:**
Las reglas solo contemplan la colección `/whitelist/{email}`. Aunque Firestore deniega por defecto lo no especificado, no existe una regla catch-all explícita de bloqueo al final, lo que deja expuesto el esquema a errores accidentales si se crean colecciones temporales o de prueba.

**Solución:**
Agregar la regla explícita de cierre:
```text
match /{document=**} {
  allow read, write: if false;
}
```

---

### SEC-05 · Correo de administrador quemado en reglas de Firestore

| Severidad | Ubicación |
|-----------|-----------|
| **MEDIA** | [`firestore.rules`](file:///c:/Users/joaqu/Documents/Github/reflexIA/firestore.rules#L9) |

**Problema:**
La condición `request.auth.token.email == 'admin@ucen.cl'` otorga privilegios de superadministrador basándose exclusivamente en un string literal de correo. Si se requiere cambiar o rotar el administrador, se debe redesplegar la infraestructura de reglas.

**Solución:**
Basar la administración en Custom Claims de Firebase Auth (`request.auth.token.admin == true`) gestionados por consola o Cloud Function.

---

## 3. 🟠 Bugs y Errores Funcionales

### BUG-01 · Condición de carrera en `AuthContext` entre `signIn` y `onAuthStateChanged`

| Severidad | Ubicación |
|-----------|-----------|
| **MEDIA** | [`src/context/AuthContext.tsx`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/context/AuthContext.tsx#L174-L180) |

**Problema:**
`signIn()` asigna `user`, `role` y `status = 'authenticated'` de forma inmediata en el estado de React. En paralelo, el observador `onAuthStateChanged` de Firebase se activa asíncronamente y vuelve a disparar `checkAuthorization(firebaseUser)`, lo que en conexiones lentas puede causar parpadeo (`authenticated` → `loading` → `authenticated`) o sobrescribir el estado de rol con información desfasada.

**Solución:**
Hacer que `signIn()` delegue el cambio de estado de sesión a `onAuthStateChanged` o utilizar un identificador de sesión para ignorar la verificación duplicada.

---

### BUG-02 · `workPacingService` no aísla datos multiusuario en `localStorage`

| Severidad | Ubicación |
|-----------|-----------|
| **MEDIA** | [`src/services/workPacingService.ts`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/services/workPacingService.ts#L69-L81) |

**Problema:**
A diferencia de los demás servicios que usan `readUserStorage` / `writeUserStorage` asociando cada registro al UID del usuario autenticado, `workPacingService` usa directamente `localStorage.getItem(STORAGE_KEYS.CONFIG)`. Esto causa que si dos usuarios inician sesión en el mismo navegador, compartan y sobreescriban los plazos e intentos.

**Solución:**
Migrar `readConfig()` y `writeConfig()` a `readUserStorage` y `writeUserStorage`.

---

### BUG-03 · Shadowing de función `getAuth()` en `authService.ts`

| Severidad | Ubicación |
|-----------|-----------|
| **BAJA** | [`src/services/authService.ts`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/services/authService.ts#L46-L51) |

**Problema:**
La función interna `function getAuth()` tiene el mismo nombre que la función `getAuth` provista por el SDK de `firebase/auth`. Aunque actualmente no se importa directamente de Firebase en ese archivo, genera confusión y riesgos de colisión en futuros imports.

**Solución:**
Renombrar la función local a `ensureAuth()` o `getFirebaseAuth()`.

---

### BUG-04 · Non-null assertion sin comprobación en `theoryQuizService.submitAttempt`

| Severidad | Ubicación |
|-----------|-----------|
| **BAJA** | [`src/services/theoryQuizService.ts`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/services/theoryQuizService.ts#L488) |

**Problema:**
Se utiliza `QUESTION_BANK.find((q) => q.id === a.questionId)!`. Si por corrupción de datos o desincronización el ID no existe en el banco, la aplicación sufrirá un crash no controlado al intentar leer propiedades sobre `undefined`.

**Solución:**
Agregar validación explícita con descarte o fallback informativo.

---

### BUG-05 · Funciones y tipos legacy huérfanos en `authService.ts`

| Severidad | Ubicación |
|-----------|-----------|
| **BAJA** | [`src/services/authService.ts`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/services/authService.ts#L115-L125) |

**Problema:**
Se mantienen exportadas funciones marcadas como legacy (`signInStudent`, `verifyStudentAccess`, `signOutUser`, alias `AuthError`) que ya no tienen ningún consumidor en el código y confunden a los desarrolladores respecto al API canónico.

**Solución:**
Eliminar los exports obsoletos y consolidar el uso de `signIn` y `authService`.

---

### BUG-06 · Llamada asíncrona sin `.catch()` y re-ejecución excesiva en `StudentLayout`

| Severidad | Ubicación |
|-----------|-----------|
| **MEDIA** | [`src/layouts/StudentLayout.tsx`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/layouts/StudentLayout.tsx#L62-L66) |

**Problema:**
En `StudentLayout.tsx`, el efecto que verifica la aprobación teórica:
```tsx
useEffect(() => {
  theoryQuizService.getApprovalStatus().then((status) => {
    setIsTheoryApproved(status.isApproved)
  })
}, [location.pathname])
```
1. No tiene bloque `.catch()`, provocando un **Unhandled Promise Rejection** en la consola si el almacenamiento o la llamada simulada fallan.
2. Al depender de `location.pathname`, dispara una consulta asíncrona repetitiva e innecesaria **en cada navegación** del estudiante (ej. cambiar entre dashboard, talleres o innovaciones), sin importar si el valor ya fue resuelto.

**Solución:**
Extraer a un hook `useTheoryApproval()` con manejo de errores, estado memoizado y consulta bajo demanda.

---

## 4. 🟡 Malas Prácticas y Deuda Técnica

### MP-01 · Duplicación de design tokens y variables CSS huérfanas

| Ubicación |
|-----------|
| [`src/assets/styles/tokens.css`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/assets/styles/tokens.css), [`tailwind.config.js`](file:///c:/Users/joaqu/Documents/Github/reflexIA/tailwind.config.js) |

**Problema:**
Los colores institucionales (`primary`, `secondary`, `perf-fail`, etc.) están definidos dos veces (en `:root` de `tokens.css` y en `tailwind.config.js`). Además, en `tokens.css` existen decenas de variables CSS para espaciados (`--space-*`), radios (`--radius-*`) y sombras (`--shadow-*`) que ningún componente utiliza, ya que la aplicación se apoya directamente en las clases utilitarias de Tailwind.

**Solución:**
Unificar en una sola fuente de verdad: vincular Tailwind a las variables de CSS con `var(--color-*)` o centralizar todo en `tailwind.config.js` eliminando el código muerto de `tokens.css`.

---

### MP-02 · `StudentLayout` invoca directamente al servicio (violación de R4)

| Ubicación |
|-----------|
| [`src/layouts/StudentLayout.tsx`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/layouts/StudentLayout.tsx#L62-L66) |

**Problema:**
La regla R4 de `AI_GUIDELINES.md` establece que los layouts y componentes de presentación no deben comunicarse directamente con la capa de `services/`, sino a través de hooks. El propio archivo reconoce en sus comentarios que debería utilizar un hook.

**Solución:**
Extraer la lógica a `src/hooks/useTheoryApproval.ts`.

---

### MP-03 · `StudentDashboardView` invoca directamente a `theoryQuizService` (segunda violación de R4)

| Ubicación |
|-----------|
| [`src/views/student-dashboard/StudentDashboardView.tsx`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/views/student-dashboard/StudentDashboardView.tsx#L47-L51) |

**Problema:**
La vista principal del estudiante hace llamadas directas a `theoryQuizService.getApprovalStatus()` y `theoryQuizService.getConfig()` dentro de su propio `useEffect` en lugar de abstraer la lógica en un hook de feature (ej. `useStudentProgress`). La regla R4 exige que las vistas se concentren en coordinar la presentación.

**Solución:**
Crear el hook `useStudentProgress` en `views/student-dashboard/hooks/` y desacoplar la vista de las llamadas directas al servicio.

---

### MP-04 · Código de layout triplicado entre Admin, Teacher y Student

| Ubicación |
|-----------|
| [`AdminLayout.tsx`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/layouts/AdminLayout.tsx), [`TeacherLayout.tsx`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/layouts/TeacherLayout.tsx), [`StudentLayout.tsx`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/layouts/StudentLayout.tsx) |

**Problema:**
Los tres layouts contienen ~150 líneas de código con más de un 70% de JSX idéntico: cabecera superior, botón de menú móvil, overlay de backdrop, contenedor lateral de navegación y botón de cerrar sesión.

**Solución:**
Crear un componente base reutilizable `AppLayout` en `src/components/` que reciba `navItems`, `brandBadge` y `userRole` como propiedades.

---

### MP-05 · Concatenación manual de clases CSS por template strings

| Ubicación |
|-----------|
| Múltiples componentes en `src/components/` y `src/views/` |

**Problema:**
El proyecto concatena clases con template strings (`className={`... ${cond ? 'clase-a' : 'clase-b'}`}`), lo que genera espacios duplicados, conflictos de cascada en Tailwind y código difícil de leer.

**Solución:**
Implementar una utilidad estándar `cn(...inputs)` en `src/utils/cn.ts` haciendo uso de `clsx` y `tailwind-merge`.

---

### MP-06 · Paquetes instalados pero nunca utilizados (4 dependencias huérfanas)

| Ubicación |
|-----------|
| [`package.json`](file:///c:/Users/joaqu/Documents/Github/reflexIA/package.json#L15-L23) |

**Problema:**
Cuatro librerías de producción están instaladas en `package.json` pero tienen **cero imports** en todo el código fuente:
1. `axios`: Todos los servicios usan `fetch` nativo; sólo aparece en comentarios `// TODO`.
2. `zod`: Toda la validación se hace con funciones e interfaces manuales.
3. `clsx`: Instalada pero reemplazada por concatenación de strings.
4. `tailwind-merge`: Instalada pero nunca llamada.

**Solución:**
- Aprovechar `clsx` y `tailwind-merge` para crear `cn()`.
- O bien implementar esquemas de validación Zod para las respuestas de OpenRouter y formularios, o remover `zod` y `axios` para mantener un bundle ligero.

---

### MP-07 · Componente `RequireStudent` con nombre engañoso

| Ubicación |
|-----------|
| [`src/components/RequireStudent.tsx`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/components/RequireStudent.tsx) |

**Problema:**
El archivo se llama `RequireStudent`, pero se usa para proteger rutas de los tres perfiles: `<RequireStudent allowedRoles={['admin']}>` o `<RequireStudent allowedRoles={['teacher']}>`.

**Solución:**
Renombrar el archivo y su export a `RequireAuth.tsx`.

---

### MP-08 · Barrel export parcial en `models/index.ts`

| Ubicación |
|-----------|
| [`src/models/index.ts`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/models/index.ts) |

**Problema:**
Solo reexporta 3 de los 8 modelos del proyecto (`theoryQuiz`, `criticalIncident`, `sensitiveData`). Los otros 5 deben importarse directamente desde su archivo, creando confusión sobre el estándar de imports.

**Solución:**
Completar el barrel con todos los modelos o eliminar `models/index.ts` para que todos los imports sean explícitos.

---

### MP-09 · Normalización de texto incompleta en `impulseGenerator.ts`

| Ubicación |
|-----------|
| [`src/utils/impulseGenerator.ts`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/utils/impulseGenerator.ts#L141-L144) |

**Problema:**
La expresión regular `/[̀-ͯ]/g` depende del rango de combining diacritical marks y puede fallar en ciertos motores o con caracteres particulares del español (como la `ñ` o diéresis), afectando el matcheo heurístico de palabras clave.

**Solución:**
Usar la normalización estándar `.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()`.

---

## 5. 🔵 Riesgos Arquitectónicos

### ARCH-01 · Ausencia de estado global compartido de UI

**Problema:**
No existe un store o contexto que comunique el estado de avance entre secciones independientes. Por ejemplo, si el estudiante aprueba el marco teórico en `TheoryQuizView`, el `StudentLayout` no se entera hasta que se produce un cambio de ruta o se fuerza una recarga de localStorage.

**Solución:**
Crear un contexto liviano o store con Zustand/Jotai para el progreso del ciclo reflexivo.

---

### ARCH-02 · Sin estrategia de caché ni invalidación de datos

**Problema:**
Cada navegación hacia una vista dispara nuevas llamadas a `localStorage` o simula latencias de red con `setTimeout`. No hay deduplicación de consultas ni TTL en memoria.

**Solución:**
Planificar la adopción de TanStack Query (React Query) cuando se integre el backend.

---

### ARCH-03 · Fechas límite estáticas hardcodeadas en mocks

| Ubicación |
|-----------|
| [`src/services/criticalIncidentService.ts`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/services/criticalIncidentService.ts#L87-L121) |

**Problema:**
Las fechas límites de los talleres están fijas como cadenas de texto (`'2026-10-15'`), mientras que en `teacherDashboardService.ts` se calculan dinámicamente respecto a la fecha actual. En demostraciones futuras, los talleres pueden aparecer vencidos automáticamente.

**Solución:**
Unificar la generación de fechas de demostración relativas a `new Date()`.

---

### ARCH-04 · Directorio `dist/` presente en el espacio de trabajo local

| Ubicación |
|-----------|
| Directorio `dist/` en raíz |

**Problema:**
El compilado de producción `dist/` reside localmente. Aunque `.gitignore` contiene `/dist`, es indispensable verificar que ningún archivo de build haya quedado indexado en el historial de Git para evitar inflar el repositorio.

---

### ARCH-05 · Inconsistencia en la gestión y centralización de rutas

| Ubicación |
|-----------|
| [`src/utils/routes.ts`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/utils/routes.ts), [`src/App.tsx`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/App.tsx), vistas y layouts |

**Problema:**
El archivo `routes.ts` sólo centraliza la ruta de talleres (`WORKSHOPS_ROUTE`). Todas las demás rutas de la aplicación (`/iniciar-sesion`, `/admin`, `/docente`, `/estudiante`, `/admin/whitelist`, etc.) están dispersas como strings quemados en `App.tsx`, `LoginView.tsx`, layouts y componentes. Esto incrementa exponencialmente el riesgo de enlaces rotos si se renombra una sección.

**Solución:**
Crear un diccionario integral de rutas tipadas en `src/utils/routes.ts` (e.g. `ROUTES.AUTH.LOGIN`, `ROUTES.STUDENT.ROOT`) y usarlo en toda la aplicación.

---

## 6. ♿ Accesibilidad (a11y)

### A11Y-01 · ID duplicado en componente `Modal.tsx`

| Ubicación |
|-----------|
| [`src/components/Modal.tsx`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/components/Modal.tsx#L75-L76) |

**Problema:**
El título del modal usa el ID estático `id="modal-title"`. Si se abren modales anidados o coexisten múltiples instancias en el DOM, los lectores de pantalla confunden la referencia del aria-label.

**Solución:**
Generar un ID único por instancia utilizando el hook nativo `useId()` de React 18: `const titleId = useId()`.

---

### A11Y-02 · Falta de `aria-label` o `caption` en `Table.tsx`

| Ubicación |
|-----------|
| [`src/components/Table.tsx`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/components/Table.tsx#L72) |

**Problema:**
El elemento `<table>` carece de `aria-label` o `<caption>`, impidiendo que los usuarios de tecnologías asistivas identifiquen el propósito de los datos tabulares.

**Solución:**
Añadir una prop obligatoria `caption` o `aria-label` a `TableProps`.

---

### A11Y-03 · Sidebars sin `aria-label` de navegación en Admin y Student layouts

| Ubicación |
|-----------|
| [`AdminLayout.tsx`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/layouts/AdminLayout.tsx), [`StudentLayout.tsx`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/layouts/StudentLayout.tsx) |

**Problema:**
Los elementos `<nav>` de los menús laterales carecen de `aria-label`. Solo `TeacherLayout` implementa atributos accesibles completos (`aria-controls`, `aria-expanded`).

**Solución:**
Homogeneizar agregando `aria-label="Navegación principal de [rol]"` y vincular el botón hamburguesa con `aria-expanded` y `aria-controls`.

---

### A11Y-04 · Botones hamburguesa sin atributo `type="button"`

| Ubicación |
|-----------|
| [`AdminLayout.tsx`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/layouts/AdminLayout.tsx#L52), [`StudentLayout.tsx`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/layouts/StudentLayout.tsx#L85) |

**Problema:**
Los botones de apertura de menú no especifican `type="button"`. Por defecto en HTML, un botón sin tipo explícito se interpreta como `type="submit"`.

**Solución:**
Agregar explícitamente `type="button"` en todos los botones de interacción no asociados a envío de formularios.

---

### A11Y-05 · Ausencia de focus trap en `Modal.tsx`

| Ubicación |
|-----------|
| [`src/components/Modal.tsx`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/components/Modal.tsx) |

**Problema:**
Al abrir un modal, el usuario que navega por teclado puede tabular fuera de la ventana modal hacia los elementos interactivos del fondo.

**Solución:**
Implementar captura y confinamiento de foco (`focus trap`) o integrar el diálogo nativo `<dialog>` de HTML5 con `showModal()`.

---

### A11Y-06 · `Dropzone` no vincula errores con `aria-describedby`

| Ubicación |
|-----------|
| [`src/components/Dropzone.tsx`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/components/Dropzone.tsx#L115-L119) |

**Problema:**
Cuando se rechaza un archivo (por peso o extensión), el mensaje de error tiene `role="alert"`, pero el input o área de drop no tiene `aria-invalid="true"` ni `aria-describedby="dropzone-error"`.

**Solución:**
Enlazar el input con el mensaje de error para usuarios de lectores de pantalla.

---

### A11Y-07 · Ratios de contraste insuficientes en textos secundarios

| Ubicación |
|-----------|
| Múltiples componentes en `src/views/` (clases `text-texto/60`) |

**Problema:**
El uso de `text-texto/60` produce un color `#1F2937` con 60% de opacidad sobre fondo `#F7FAFC`, arrojando un contraste de ~4.2:1. Las pautas WCAG 2.1 AA exigen al menos **4.5:1** para texto normal (< 18px).

**Solución:**
Subir la opacidad mínima de textos pequeños a `text-texto/75` o usar un token accesible con ratio verificado.

---

## 7. 🎨 Mejoras de UX

### UX-01 · Fallback de `Suspense` demasiado austero en `App.tsx`

| Ubicación |
|-----------|
| [`src/App.tsx`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/App.tsx#L51-L59) |

**Problema:**
Mientras se descargan las rutas dinámicas, se muestra un texto plano "Cargando…". Si la conexión es lenta, la sensación visual es de una página congelada o rota.

**Solución:**
Crear un componente `FullPageLoader` con spinner institucional y el imagotipo de ReflexIA.

---

### UX-02 · Falta de feedback visual ante error de cierre de sesión

| Ubicación |
|-----------|
| [`AdminLayout.tsx`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/layouts/AdminLayout.tsx#L42), [`TeacherLayout.tsx`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/layouts/TeacherLayout.tsx#L46) |

**Problema:**
Si la desconexión con Firebase falla, el error solo se imprime en consola con `console.error`. El usuario no recibe retroalimentación y la pantalla parece no responder.

**Solución:**
Replicar el manejo de errores visual (`signOutError`) que ya tiene `StudentLayout`.

---

### UX-03 · Cierre de sesión sin advertencia de borrador pendiente

| Ubicación |
|-----------|
| Todos los layouts |

**Problema:**
Hacer clic en "Salir" cierra la sesión inmediatamente. Si el estudiante estaba redactando un taller y no guardó, corre el riesgo de perder cambios recientes.

**Solución:**
Solicitar confirmación antes de salir si el taller actual tiene cambios sin guardar (`isDirty`).

---

### UX-04 · Sin detección de estado offline

**Problema:**
Si el estudiante pierde conexión a internet mientras trabaja, las llamadas a OpenRouter o Firebase fallan con errores genéricos sin explicar que se debe a la red.

**Solución:**
Añadir un hook o listener de `window.navigator.onLine` que muestre una alerta amigable de "Sin conexión".

---

### UX-05 · Menú móvil no se cierra al pulsar el botón "atrás" del navegador

| Ubicación |
|-----------|
| Todos los layouts |

**Problema:**
Si el menú lateral móvil está abierto y el usuario presiona el botón "atrás" de su dispositivo móvil, el menú permanece abierto.

**Solución:**
Añadir un `useEffect` que cierre el sidebar cuando cambie `location.key` o `location.pathname`.

---

### UX-06 · Formateo de fechas dependiente de la zona horaria del cliente

| Ubicación |
|-----------|
| [`src/utils/formatDateTime.ts`](file:///c:/Users/joaqu/Documents/Github/reflexIA/src/utils/formatDateTime.ts#L9-L15) |

**Problema:**
`formatDateTime` utiliza la zona horaria del navegador del cliente. Si un estudiante o docente tiene desconfigurada la hora de su computador o se conecta desde otro país, verá fechas y horas de entrega distintas a la hora oficial de Chile.

**Solución:**
Fijar explícitamente `timeZone: 'America/Santiago'` en la configuración de `Intl.DateTimeFormat`.

---

## 8. 📦 Configuración y Tooling

### CFG-01 · Sin ESLint configurado en el repositorio

**Problema:**
No existe archivo de configuración de ESLint (`eslint.config.js` o `.eslintrc`). El comando `npm run lint` solo ejecuta `tsc --noEmit`. No se auditan hooks de React (reglas de dependencias de `useEffect`), imports huérfanos ni buenas prácticas de JSX.

**Solución:**
Instalar y configurar ESLint con `@typescript-eslint` y `eslint-plugin-react-hooks`.

---

### CFG-02 · Sin Prettier ni `.editorconfig`

**Problema:**
No existe `.prettierrc`. En Windows y Linux coexisten finales de línea CRLF y LF, así como discrepancias de indentación en archivos `.md` y `.ts`.

**Solución:**
Añadir `.prettierrc` y `.editorconfig` con reglas de fin de línea `lf` e indentación de 2 espacios.

---

### CFG-03 · Ausencia de path aliases (`@/`) en `tsconfig.json` y `vite.config.ts`

**Problema:**
Todas las importaciones usan rutas relativas profundas (`../../../../components/Button`), lo que vuelve frágil cualquier movimiento de archivos.

**Solución:**
Configurar alias `@/*` apuntando a `src/*` en `tsconfig.json` y `vite.config.ts`.

---

### CFG-04 · Nombre de paquete desactualizado en `package.json`

| Ubicación |
|-----------|
| [`package.json`](file:///c:/Users/joaqu/Documents/Github/reflexIA/package.json#L2) |

**Problema:**
El nombre es `"plataforma-practica-profesional"` en vez de `"reflexia"`.

**Solución:**
Actualizar `"name": "reflexia"`.

---

### CFG-05 · Override indocumentado de `@grpc/grpc-js`

| Ubicación |
|-----------|
| [`package.json`](file:///c:/Users/joaqu/Documents/Github/reflexIA/package.json#L35-L37) |

**Problema:**
Existe un override forzado `"@grpc/grpc-js": "1.13.6"` sin comentarios explicativos.

**Solución:**
Documentar el motivo (resolución de vulnerabilidad o compatibilidad con Firebase Firestore) en un comentario o en la documentación técnica.

---

### CFG-06 · Bandera riesgosa `allowImportingTsExtensions` en `tsconfig.json`

| Ubicación |
|-----------|
| [`tsconfig.json`](file:///c:/Users/joaqu/Documents/Github/reflexIA/tsconfig.json#L9) |

**Problema:**
`"allowImportingTsExtensions": true` está habilitado. Esta bandera permite importar archivos con terminación `.ts` explícita (`import foo from './foo.ts'`), lo que no es estándar en la mayoría de bundlers y genera inconsistencias si se compila con otras herramientas.

**Solución:**
Remover `"allowImportingTsExtensions": true`.

---

## 9. 📚 Documentación y Mantenibilidad

### DOC-01 · Documentación técnica desincronizada con el código actual

| Ubicación |
|-----------|
| [`docs/tecnica/detallesTecnicos.md`](file:///c:/Users/joaqu/Documents/Github/reflexIA/docs/tecnica/detallesTecnicos.md), [`docs/tecnica/hooks-por-ruta.md`](file:///c:/Users/joaqu/Documents/Github/reflexIA/docs/tecnica/hooks-por-ruta.md), [`docs/historias-usuario/HU05_GUIA.md`](file:///c:/Users/joaqu/Documents/Github/reflexIA/docs/historias-usuario/HU05_GUIA.md) |

**Problema:**
Tras la optimización de HU-05 (detección al final de los 4 pasos y botón de cancelación), las guías técnicas siguen describiendo el comportamiento antiguo:
1. `hooks-por-ruta.md` y `detallesTecnicos.md` no mencionan `cancelAnalysis()` ni la consolidación del relato.
2. `HU05_GUIA.md` indica que el botón está en cada paso del wizard.

**Solución:**
Actualizar los documentos técnicos y la guía de HU-05 para reflejar fielmente la arquitectura y el flujo implementados.

---

### DOC-02 · Duplicidad entre guías de raíz y subcarpetas de `docs/`

**Problema:**
Coexisten `HU04_DEVELOPMENT.md` en la raíz con `docs/historias-usuario/HU04_GUIA.md`, y `HU05_DEVELOPMENT.md` con `docs/historias-usuario/HU05_GUIA.md`. Mantener dos fuentes de verdad genera confusión sobre cuál es el documento canónico de referencia.

**Solución:**
Eliminar los archivos de desarrollo de la raíz y dejar `docs/historias-usuario/` como única fuente de verdad.

---

## 10. 🧪 Testing

### TEST-01 · Ausencia total de pruebas automatizadas

**Problema:**
El proyecto tiene **0 pruebas** (unitarias, integración o E2E). Todo el aseguramiento de calidad depende de pruebas manuales, lo que eleva el riesgo de regresiones críticas ante cualquier modificación.

**Solución prioritaria:**
1. Configurar **Vitest** + **React Testing Library**.
2. Crear pruebas unitarias para utilidades críticas puras (`institutionalEmail.ts`, `performanceStatus.ts`, `impulseGenerator.ts`, `workPacingDates.ts`).
3. Pruebas de integración sobre flujos de validación (cálculo de aprobación en `theoryQuizService` y rotación de modelos en `openRouterService`).

---

## 11. 📋 Plan de Ejecución por Etapas

### Etapa 0 · Sanidad y Hotfixes Inmediatos (1–2 días)
> **Objetivo:** Resolver riesgos inmediatos de seguridad, limpiar dependencias y armonizar la raíz antes de demostraciones.

| # | Tarea | Referencia | Estado |
|---|-------|------------|--------|
| 1 | Eliminar fallbacks hardcodeados de Firebase en `firebase.ts` | SEC-01 | Pendiente |
| 2 | Agregar regla catch-all en `firestore.rules` | SEC-04 | Pendiente |
| 3 | Corregir `workPacingService` para usar `readUserStorage`/`writeUserStorage` | BUG-02 | Pendiente |
| 4 | Renombrar `getAuth()` → `ensureAuth()` en `authService.ts` | BUG-03 | Pendiente |
| 5 | Eliminar guías duplicadas de raíz (`HU04_DEVELOPMENT.md`, `HU05_DEVELOPMENT.md`) | MP-10, DOC-02 | Pendiente |
| 6 | Cambiar nombre en `package.json` a `"reflexia"` | CFG-04 | Pendiente |
| 7 | Remover `"allowImportingTsExtensions": true` de `tsconfig.json` | CFG-07 | Pendiente |
| 8 | Fijar zona horaria `America/Santiago` en `formatDateTime.ts` | UX-06 | Pendiente |

---

### Etapa 1 · Calidad de Código y Arquitectura Frontend (Sprint 1)
> **Objetivo:** Estandarizar código, crear utilidades compartidas y eliminar deuda técnica.

| # | Tarea | Referencia | Estado |
|---|-------|------------|--------|
| 1 | Configurar ESLint (`react-hooks`) y Prettier con `.editorconfig` | CFG-01, CFG-02 | Pendiente |
| 2 | Configurar path aliases (`@/*`) en `tsconfig.json` y `vite.config.ts` | CFG-03 | Pendiente |
| 3 | Crear función `cn()` aprovechando `clsx` y `tailwind-merge` ya instalados | MP-05, MP-06 | Pendiente |
| 4 | Resolver dependencias huérfanas: usar Zod para contratos o remover `zod` y `axios` | MP-06 | Pendiente |
| 5 | Extraer hook `useTheoryApproval` y corregir llamada directa en `StudentLayout` | MP-02, BUG-06 | Pendiente |
| 6 | Extraer hook `useStudentProgress` para `StudentDashboardView` (cumplir R4) | MP-03 | Pendiente |
| 7 | Renombrar `RequireStudent` a `RequireAuth` | MP-07 | Pendiente |
| 8 | Centralizar todas las rutas en `src/utils/routes.ts` | ARCH-05 | Pendiente |
| 9 | Extraer layout base reutilizable `AppLayout` | MP-04 | Pendiente |
| 10 | Unificar tokens de color (evitar duplicación CSS y Tailwind) | MP-01 | Pendiente |
| 11 | Completar o retirar barrel parcial `models/index.ts` | MP-08 | Pendiente |
| 12 | Limpiar exports obsoletos de `authService.ts` | BUG-05 | Pendiente |

---

### Etapa 2 · Accesibilidad (Sprint 2)
> **Objetivo:** Cumplir estándares WCAG 2.1 AA exigidos para plataformas educativas institucionales.

| # | Tarea | Referencia | Estado |
|---|-------|------------|--------|
| 1 | Generar ID dinámico en `Modal.tsx` con `useId()` | A11Y-01 | Pendiente |
| 2 | Implementar focus trap en modales | A11Y-05 | Pendiente |
| 3 | Agregar `caption` / `aria-label` obligatorio a `Table.tsx` | A11Y-02 | Pendiente |
| 4 | Homogeneizar navegación y atributos accesibles en los tres layouts | A11Y-03 | Pendiente |
| 5 | Asegurar `type="button"` en todos los botones no-submit | A11Y-04 | Pendiente |
| 6 | Vincular errores de `Dropzone` mediante `aria-describedby` y `aria-invalid` | A11Y-06 | Pendiente |
| 7 | Auditar y corregir contrastes de texto secundario (`text-texto/60` → `text-texto/75`) | A11Y-07 | Pendiente |

---

### Etapa 3 · UX y Resiliencia (Sprint 2–3)
> **Objetivo:** Pulir la experiencia de uso del estudiante y docente.

| # | Tarea | Referencia | Estado |
|---|-------|------------|--------|
| 1 | Diseñar `FullPageLoader` institucional para el fallback de `Suspense` | UX-01 | Pendiente |
| 2 | Homogeneizar mensaje de error en cierre de sesión para Admin y Teacher | UX-02 | Pendiente |
| 3 | Confirmar cierre de sesión si hay cambios no guardados en el taller (`isDirty`) | UX-03 | Pendiente |
| 4 | Banner de notificación cuando se pierde la conexión a internet | UX-04 | Pendiente |
| 5 | Cerrar menú móvil al navegar hacia atrás con el navegador | UX-05 | Pendiente |
| 6 | Resolver race condition entre `signIn` y `onAuthStateChanged` en `AuthContext` | BUG-01 | Pendiente |
| 7 | Dinamizar deadlines en mocks relativos a la fecha actual | ARCH-03 | Pendiente |

---

### Etapa 4 · Testing Automatizado (Sprint 3–4)
> **Objetivo:** Establecer la red de seguridad de pruebas antes del backend.

| # | Tarea | Referencia | Estado |
|---|-------|------------|--------|
| 1 | Configurar Vitest y React Testing Library en el proyecto | TEST-01 | Pendiente |
| 2 | Suite de pruebas unitarias para utilidades (`institutionalEmail`, `dates`, etc.) | TEST-01 | Pendiente |
| 3 | Pruebas unitarias para servicios de lógica (`theoryQuizService`, `whitelist`) | TEST-01 | Pendiente |
| 4 | Pruebas de integración sobre componentes globales (`Button`, `Modal`, `Table`) | TEST-01 | Pendiente |
| 5 | Tests automatizados de accesibilidad con `vitest-axe` | TEST-01 | Pendiente |

---

### Etapa 5 · Transición a Backend (Sprint 4+)
> **Objetivo:** Migrar lógica crítica fuera del navegador al iniciar el desarrollo del backend.

| # | Tarea | Referencia | Estado |
|---|-------|------------|--------|
| 1 | Mover la API key de OpenRouter a un proxy o servicio backend seguro | SEC-01 | Planificado |
| 2 | Trasladar el banco de preguntas y la evaluación de respuestas al backend | SEC-02 | Planificado |
| 3 | Validación obligatoria de datos sensibles en el servidor antes de persistir | SEC-03 | Planificado |
| 4 | Reemplazar `localStorage` por base de datos relacional/NoSQL en backend | BUG-02, ARCH-01 | Planificado |
| 5 | Implementar TanStack Query para fetching, mutaciones y caché | ARCH-02 | Planificado |
| 6 | Definir contratos y esquemas API formales con Zod u OpenAPI | MP-06 | Planificado |
