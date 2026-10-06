# Prueba 1: guía de presentación de ReflexIA

Guía para presentar el proyecto según la pauta de evaluación. Sigue el mismo orden que la pauta:

1. Demostración del problema a resolver (contexto del proyecto).
2. Repositorio en GitHub: commits por integrante, clonar y ejecutar la rama `main`.
3. Frontend funcional y cómo se implementó cada historia de usuario.
4. Preguntas técnicas: qué hace cada módulo y hook, cómo se conectan y cómo sigue el flujo.

> **Importante:** el profesor solo revisa la rama `main`. Lo que esté en otra rama no cuenta. El último commit se permite hasta antes de la clase.

---

## 0. Antes de la clase (checklist)

- [ ] Todo lo que se va a mostrar está fusionado en `main` (no quedan PR abiertos importantes).
- [ ] Node.js 18 o superior instalado (`node -v`).
- [ ] Probado en limpio: clonar `main` en otra carpeta, `npm install` y `npm run dev` sin errores.
- [ ] `npm run lint` y `npm run build` pasan.
- [ ] Archivo `.env` listo con `VITE_OPENROUTER_API_KEY` (lo necesita la detección de datos sensibles, HU-05). **No se sube a GitHub.**
- [ ] Una cuenta por rol, registrada en Firebase **y** activa en la whitelist: estudiante, profesor guía y administrador. Las contraseñas las maneja cada uno; **nunca** se escriben en este archivo ni en el repositorio.
- [ ] Navegador con la sesión cerrada, para mostrar el login desde cero.
- [ ] Repartido quién presenta cada parte (ver sección 5).

---

## 1. Demostración del problema (contexto)

**Guion sugerido (1 a 2 minutos):**

Los estudiantes de pedagogía en práctica profesional deben reflexionar sobre lo que ocurre en sus clases. Hoy ese proceso se hace en papel: cuesta seguir el avance, el profesor guía revisa todo a mano y es fácil que el relato incluya datos sensibles (nombres de alumnos, colegios).

**ReflexIA** digitaliza ese **ciclo reflexivo**:

1. El estudiante demuestra que maneja el **marco teórico** (cuestionario diagnóstico).
2. Analiza un **incidente crítico** de su práctica con un asistente paso a paso, con referencias bibliográficas en pantalla.
3. Recibe **"El Impulso"**: orientaciones que le dicen qué falta, **sin redactar por él**.
4. El sistema **detecta datos sensibles** y no deja avanzar hasta anonimizarlos.
5. El **profesor guía** revisa y valida la retroalimentación, fija plazos e intentos y sigue el avance semanal.
6. Todos consultan una **biblioteca de innovaciones pedagógicas**.

**Roles:** estudiante en práctica, profesor guía y administrador (gestiona quién puede entrar). Solo pueden entrar correos `@ucen.cl` autorizados en la whitelist. No se pide RUT (Ley 21.719).

---

## 2. GitHub: repositorio, commits y ejecución

### 2.1 Commits por integrante

La pauta exige **mínimo 10 commits por integrante**. Estado en `main` al preparar esta guía (sin contar merges):

| Integrante (usuario de git) | Commits |
|---|---|
| bladingg | 46 |
| ChristianSzSv + TheArsenalz4 (mismo correo, misma persona) | 39 + 8 = 47 |
| JoaquinMichea | 29 |
| gvbr-iel | 27 |

Todos superan los 10. Para mostrarlo en vivo:

```bash
git shortlog -sn --no-merges main
```

También se ve en GitHub: **Insights → Contributors**. GitHub agrupa los commits por correo, así que los dos usuarios de git con el mismo correo aparecen como una sola persona si ese correo está verificado en su cuenta.

### 2.2 Clonar y ejecutar `main`

```bash
# 1. Clonar el repositorio (rama main)
git clone https://github.com/gvbr-iel/reflexIA.git
cd reflexIA

# 2. Instalar dependencias (crea node_modules)
npm install

# 3. Crear el .env a partir del ejemplo y poner la API key de OpenRouter
cp .env.example .env          # en Windows (cmd): copy .env.example .env
#    editar .env → VITE_OPENROUTER_API_KEY=...

# 4. Levantar el servidor de desarrollo
npm run dev
#    abre http://localhost:5173
```

- Firebase **no** necesita configuración: `src/services/firebase.ts` trae la configuración web pública por defecto.
- Sin `VITE_OPENROUTER_API_KEY`, todo funciona **excepto** la detección de datos sensibles (HU-05).
- Comprobaciones de calidad: `npm run lint` (tipos de TypeScript) y `npm run build` (compilación de producción).

---

## 3. Frontend funcional: recorrido por las historias de usuario

### 3.1 Guion de la demo (orden sugerido)

| # | Rol | Qué mostrar | HU |
|---|---|---|---|
| 1 | Público | Página de inicio `/` y botón para ingresar | n/d |
| 2 | Todos | Login en `/iniciar-sesion`: un correo que no es `@ucen.cl` es rechazado, y uno válido redirige al panel de su rol | HU-08 |
| 3 | Administrador | `/admin/whitelist`: métricas, filtros, autorizar un correo, carga masiva con vista previa, revocar y restablecer | HU-01 |
| 4 | Estudiante | `/estudiante`: panel "Mi progreso". El menú muestra el candado en Talleres | n/d |
| 5 | Estudiante | `/estudiante/talleres` **bloqueado** antes de aprobar el marco teórico | HU-03 + HU-04 |
| 6 | Estudiante | `/estudiante/marco-teorico`: 10 preguntas al azar de un banco de 30, 15 minutos, 3 intentos, aprueba con 7 de 10 | HU-04 |
| 7 | Estudiante | Talleres **desbloqueados**: abrir un taller, asistente de 4 pasos, referencias al costado, guardar borrador y autoguardado | HU-03 |
| 8 | Estudiante | Escribir un nombre propio en el relato: se detecta como dato sensible y bloquea el impulso | HU-05 |
| 9 | Estudiante | "El Impulso": pedir orientaciones y ver el contador de intentos restantes (3 por taller) | HU-02 |
| 10 | Estudiante | `/estudiante/innovaciones`: buscar, filtrar por categoría y abrir un caso | HU-07 |
| 11 | Profesor guía | `/docente`: panel de seguimiento (tarjetas, filtros, tabla; en móvil, tarjetas) | n/d |
| 12 | Profesor guía | `/docente/plazos`: cambiar fecha e intentos, guardar, restablecer | HU-06 |
| 13 | Profesor guía | `/docente/reflexiones`: ver la propuesta de la IA, editarla y validarla | HU-02 |
| 14 | Profesor guía | `/docente/innovaciones`: misma biblioteca, compartida | HU-07 |

**Truco de demo:** con `npm run dev` aparecen botones de simulación en los talleres (`DevTheoryToggle` y `DevWorkshopResultToggle`). Sirven para aprobar el marco teórico o simular el resultado de un taller sin repetir todo el flujo. No aparecen en producción (`import.meta.env.DEV`).

**Responsive (RNF-03):** mostrar alguna pantalla a 360 px de ancho con las herramientas de desarrollo del navegador (modo dispositivo).

### 3.2 Dónde está implementada cada historia

| HU | Qué resuelve | Ruta | Archivos principales |
|---|---|---|---|
| HU-01 Whitelist | Quién puede entrar | `/admin/whitelist` | `models/whitelist.ts` → `services/whitelistService.ts` (Firestore) → `views/admin-whitelist/hooks/useWhitelist.ts`, `useBulkUpload.ts` → `WhiteListView.tsx` |
| HU-02 Retroalimentación | El Impulso (estudiante) y revisión (profesor) | `/estudiante/talleres/:id`, `/docente/reflexiones` | `utils/impulseGenerator.ts`, `views/critical-incidents/hooks/useImpulse.ts`; `models/reflection.ts` → `services/reflectionService.ts` → `views/reflections/hooks/useReflections.ts`, `useReflectionReview.ts` |
| HU-03 Incidentes críticos | Asistente paso a paso con borradores | `/estudiante/talleres/:workshopId` | `models/criticalIncident.ts` → `services/criticalIncidentService.ts` → `hooks/useIncidentWizard.ts` → `components/IncidentWizard.tsx` |
| HU-04 Marco teórico | Cuestionario que desbloquea los talleres | `/estudiante/marco-teorico` | `models/theoryQuiz.ts` → `services/theoryQuizService.ts` → `views/theory-verification/hooks/useTheoryQuiz.ts` → `TheoryQuizView.tsx` |
| HU-05 Datos sensibles | Detectar nombres y colegios en el relato | Dentro del asistente | `models/sensitiveData.ts` → `services/openRouterService.ts` (IA) → `hooks/useSensitiveDataDetector.ts` → `components/SensitiveDataPreview.tsx` |
| HU-06 Plazos e intentos | El profesor regula el ritmo | `/docente/plazos` | `models/workPacing.ts` → `services/workPacingService.ts` → `views/work-pacing/hooks/useWorkPacing.ts` → `DeadlinesView.tsx` |
| HU-07 Innovaciones | Biblioteca de casos | `/estudiante/innovaciones`, `/docente/innovaciones` | `views/innovations/data/innovations.ts` → `hooks/useInnovations.ts` → `InnovationsView.tsx` |
| HU-08 Autenticación | Login por rol | `/iniciar-sesion` | `services/firebase.ts`, `services/authService.ts` → `context/AuthContext.tsx` → `hooks/useAuth.ts` → `components/RequireStudent.tsx`, `views/auth/LoginView.tsx` |

Cada HU tiene una guía detallada en [`../historias-usuario/`](../historias-usuario/):
`HU01_GUIA.md` a `HU08_GUIA.md`.

---

## 4. Preguntas técnicas: arquitectura y flujo

### 4.1 Stack

- **React 18 + TypeScript**: componentes con tipos estrictos (`tsconfig` con `strict`, `noUnusedLocals`).
- **Vite**: servidor de desarrollo y compilación.
- **Tailwind CSS v3**: estilos con tokens de color propios (`primary`, `accent-ia`, `perf-*`…), en `tailwind.config.js` y `src/assets/styles/tokens.css`.
- **React Router v6**: rutas anidadas por rol.
- **Firebase**: Authentication (login) y Cloud Firestore (whitelist).
- **OpenRouter**: API de IA para detectar datos sensibles.
- **lucide-react**: íconos.

### 4.2 Arquitectura en capas (cada feature sigue la misma cadena)

```
models/        → tipos y contratos (qué forma tienen los datos)
   ↓
services/      → de dónde vienen los datos (Firestore, OpenRouter o localStorage simulado)
   ↓
views/<feature>/hooks/       → lógica y estado (useState, useEffect, useMemo…)
   ↓
views/<feature>/components/  → solo presentación (reciben props)
   ↓
views/<feature>/<Feature>View.tsx → arma la pantalla dentro del layout de su rol
```

**Regla clave (R4/R5):** las vistas y componentes **nunca** llaman a un servicio directamente; siempre pasan por un hook. Así la lógica se puede cambiar (por ejemplo, de un mock a una API real) sin tocar la interfaz.

### 4.3 Cómo arranca la app (flujo de entrada)

1. `index.html` tiene un `<div id="root">`.
2. `src/main.tsx` monta React con estas capas: `ErrorBoundary` → `BrowserRouter` → `AuthProvider` → `App`.
3. `src/App.tsx` define las rutas. Cada sección privada pasa por la guarda `RequireStudent` y luego por el layout de su rol, que dibuja la pantalla hija en `<Outlet />`.

### 4.4 Flujo del login (HU-08), paso a paso

1. `LoginView` llama a `signIn(email, password)` del hook `useAuth()`.
2. `AuthContext` llama a `authService.signInUser`, que:
   1. rechaza correos que no sean `@ucen.cl`;
   2. valida correo y contraseña con **Firebase Authentication**;
   3. consulta la **whitelist en Firestore** (`whitelistService.checkAccess`) y obtiene el rol;
   4. si no está autorizado, **cierra la sesión** y lanza un error.
3. `AuthContext` guarda `user`, `role` y `status`. `LoginView` redirige a `/estudiante`, `/docente` o `/admin`.
4. Mientras la sesión está abierta, `whitelistService.watchAccess` escucha la whitelist **en tiempo real**: si el administrador revoca el acceso, la sesión se cierra sola.
5. `RequireStudent` protege cada sección: sin sesión manda al login, y con un rol equivocado manda al inicio del rol correcto.

### 4.5 Flujo marco teórico → talleres (HU-04 → HU-03)

1. `useTheoryQuiz` pide preguntas a `theoryQuizService.fetchQuestions()` (10 al azar de 30) y arranca un temporizador con `setInterval`.
2. Al enviar (o al acabarse el tiempo), `submitAttempt` corrige y guarda el intento y la aprobación en `localStorage` **separado por usuario** (`utils/userStorage.ts` agrega el UID a la clave).
3. Los talleres consultan la aprobación en **un solo punto**: el hook `useTheoryGate`. Sin aprobar, se muestra el bloqueo.

### 4.6 Flujo del asistente de incidentes críticos (HU-03, HU-05 y HU-02)

1. `IncidentWizard` combina cuatro hooks: `useIncidentWizard` (pasos y borrador), `useTheoryReferences` (bibliografía del paso), `useSensitiveDataDetector` (IA de datos sensibles) y `useImpulse` (El Impulso).
2. **Borrador:** se guarda con el botón, cada 30 segundos (autoguardado) y al cambiar de paso o cerrar la pestaña. **Guardar un borrador nunca descuenta intentos.**
3. **Datos sensibles:** `openRouterService` envía el texto a la IA y, si un modelo gratuito falla, rota a otro. Si hay datos sensibles, no se puede pedir un impulso.
4. **El Impulso:** cada solicitud sí cuenta como intento (máximo 3 por taller) y exige al menos 50 caracteres por paso. La IA solo indica qué falta; **nunca** redacta el texto del alumno.

### 4.7 Hooks y componentes que conviene saber explicar

| Pieza | Tipo | Qué hace |
|---|---|---|
| `useAuth` | Hook global | Lee la sesión (usuario, rol, estado) desde `AuthContext` |
| `useWorkshops` | Hook global | Talleres con su estado; lo comparten la lista y el asistente |
| `useWhitelist` | Hook de feature | Lista, filtros y acciones de la whitelist |
| `useBulkUpload` | Hook de feature | Lee un CSV o texto pegado y arma la vista previa |
| `useTheoryQuiz` | Hook de feature | Fases del cuestionario, temporizador y envío |
| `useTheoryGate` | Hook de feature | ¿Aprobó el marco teórico? (único punto de consulta) |
| `useIncidentWizard` | Hook de feature | Pasos, validación y borrador del incidente |
| `useImpulse` | Hook de feature | El Impulso y su contador de intentos |
| `useWorkPacing` | Hook de feature | Plazos e intentos: borrador, validación y guardado |
| `useTeacherDashboard` | Hook de feature | Resumen y filtros del panel docente |
| `useReflections` / `useReflectionReview` | Hooks de feature | Lista de reflexiones y edición/validación de la retroalimentación |
| `useInnovations` | Hook de feature | Búsqueda y filtro de la biblioteca |
| `Button`, `Modal`, `Table`, `Dropzone` | Componentes globales | UI reutilizable en todas las features (regla R1) |
| `ErrorBoundary` | Componente global | Atrapa errores de render y muestra un mensaje en vez de pantalla en blanco |
| `RequireStudent` | Componente global | Guarda de rutas por sesión y rol |

### 4.8 Preguntas probables y respuestas cortas

- **¿Por qué hooks y no lógica en el componente?** Para separar la lógica de la presentación: el componente solo dibuja, y el hook se puede probar o cambiar sin tocar la interfaz.
- **¿Qué es `useEffect` y para qué lo usan?** Ejecuta código después de dibujar: cargar datos al abrir una pantalla, iniciar temporizadores y escuchar eventos. Su función de limpieza (`return`) los detiene.
- **¿Para qué sirven `useMemo` y `useCallback`?** `useMemo` guarda un cálculo (como una lista filtrada) y solo lo repite si cambian sus datos. `useCallback` mantiene la misma función entre renders.
- **¿Qué es el Context API?** Permite compartir datos (la sesión) con toda la app sin pasar props de componente en componente. Ejemplo: `AuthContext` + `useAuth`.
- **¿Qué hace `lazy` y `Suspense` en `App.tsx`?** Cada pantalla se descarga solo cuando se visita (carga inicial más liviana). `Suspense` muestra "Cargando…" mientras tanto.
- **¿Cómo protegen las rutas?** Con `RequireStudent` y `allowedRoles`. Además, Firestore tiene reglas de seguridad: la protección real no depende solo del frontend.
- **¿Por qué `localStorage` por usuario?** Porque aún no hay backend para talleres y cuestionario. Se agrega el UID a la clave para que dos usuarios del mismo navegador no vean datos del otro.
- **¿Qué es real y qué es simulado?** Real: login (Firebase Auth), whitelist (Firestore) y detección de datos sensibles (OpenRouter). Simulado en el frontend: cuestionario y talleres (`localStorage`), El Impulso (`impulseGenerator`), reflexiones, panel docente y biblioteca (datos de ejemplo). Los servicios mantienen su firma para reemplazarlos por una API sin cambiar los hooks.
- **¿Cómo cumplen la privacidad?** Sin RUT, solo correos `@ucen.cl` autorizados, detección de nombres antes de procesar y alias en vez de nombres reales.
- **¿Por qué no usan rojo en botones o errores?** Por pedido de la cliente: el rojo se reserva para el desempeño reprobado.

### 4.9 Limitaciones conocidas (mejor decirlas antes de que pregunten)

- La configuración de plazos e intentos (HU-06) se guarda, pero todavía no la leen los talleres ni el cuestionario.
- El panel docente y las reflexiones usan datos de ejemplo: el profesor aún no puede leer el avance real, que vive en el `localStorage` de cada estudiante.
- El Impulso se genera con reglas en el frontend (no con un modelo de IA).
- Los límites de nota (aprobado de 4.0 a 5.0 y sobresaliente de 5.0 a 7.0) se solapan en el 5.0; se tomó 5.0 como sobresaliente, y falta confirmarlo con la cliente.

---

## 5. Reparto sugerido de la presentación

Según quién hizo más commits en cada módulo de `main`. Ajústenlo entre ustedes.

| Parte | Módulos | Sugerencia |
|---|---|---|
| Contexto + login + whitelist (HU-08, HU-01) | `auth`, `admin-whitelist` | ChristianSzSv / gvbr-iel |
| Marco teórico (HU-04) y panel del estudiante | `theory-verification`, `student-dashboard` | JoaquinMichea |
| Incidentes críticos, datos sensibles y El Impulso (HU-03, HU-05, HU-02) | `critical-incidents`, `reflections` | bladingg |
| Plazos y panel docente (HU-06) | `work-pacing`, `teacher-dashboard` | ChristianSzSv |
| Innovaciones (HU-07) y página de inicio | `innovations`, `landingpage` | gvbr-iel |

Cada integrante debe poder explicar la **cadena de capas** de su parte (modelo → servicio → hook → componentes → vista), y la sección 4.3 y 4.4, que son comunes a todo el proyecto.
