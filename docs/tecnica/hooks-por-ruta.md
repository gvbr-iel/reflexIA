# Hooks por ruta del proyecto

Este documento resume dónde se implementan los hooks principales del proyecto y en qué rutas del frontend se usan.

## 1) Rutas principales y hooks globales

| Ruta | Vista / Layout | Hook(s) implementado(s) | Archivo(s) | Observación |
|---|---|---|---|---|
| `/` | Landing page | No hook propio | — | Página pública inicial sin lógica custom. |
| `/iniciar-sesion` | Login | `useAuth` | [src/hooks/useAuth.ts](../../src/hooks/useAuth.ts) | Gestiona sesión, rol y salida de usuario. |
| `/admin` | [src/layouts/AdminLayout.tsx](../../src/layouts/AdminLayout.tsx) | `useAuth` | [src/hooks/useAuth.ts](../../src/hooks/useAuth.ts) | El layout usa la sesión para mostrar email y cerrar sesión. |
| `/docente` | [src/layouts/TeacherLayout.tsx](../../src/layouts/TeacherLayout.tsx) | `useAuth` | [src/hooks/useAuth.ts](../../src/hooks/useAuth.ts) | Cabecera y navegación del rol docente. |
| `/estudiante` | [src/layouts/StudentLayout.tsx](../../src/layouts/StudentLayout.tsx) | `useAuth` | [src/hooks/useAuth.ts](../../src/hooks/useAuth.ts) | Cabecera y navegación del rol estudiante. |
| `/admin/*` | Guía de whitelist | `useWhitelist`, `useBulkUpload` | [src/views/admin-whitelist/hooks/useWhitelist.ts](../../src/views/admin-whitelist/hooks/useWhitelist.ts), [src/views/admin-whitelist/hooks/useBulkUpload.ts](../../src/views/admin-whitelist/hooks/useBulkUpload.ts) | Lógica de listado, filtros, carga masiva y permisos. |

## 2) Mapa por ruta funcional

### Administrador

| Ruta | Vista | Hook(s) | Ubicación |
|---|---|---|---|
| `/admin/whitelist` | WhiteListView | `useWhitelist`, `useBulkUpload` | [src/views/admin-whitelist/WhiteListView.tsx](../../src/views/admin-whitelist/WhiteListView.tsx) |

### Profesor

| Ruta | Vista | Hook(s) | Ubicación |
|---|---|---|---|
| `/docente` | TeacherDashboardView | `useTeacherDashboard` | [src/views/teacher-dashboard/TeacherDashboardView.tsx](../../src/views/teacher-dashboard/TeacherDashboardView.tsx) |
| `/docente/reflexiones` | ReflectionsView | `useReflections`, `useReflectionReview` | [src/views/reflections/ReflectionsView.tsx](../../src/views/reflections/ReflectionsView.tsx) |
| `/docente/plazos` | DeadlinesView | `useWorkPacing` | [src/views/work-pacing/DeadlinesView.tsx](../../src/views/work-pacing/DeadlinesView.tsx) |
| `/docente/innovaciones` | InnovationsView | `useInnovations` | [src/views/innovations/InnovationsView.tsx](../../src/views/innovations/InnovationsView.tsx) |

### Estudiante

| Ruta | Vista | Hook(s) | Ubicación |
|---|---|---|---|
| `/estudiante` | StudentDashboardView | No hook visible en esta vista principal | [src/views/student-dashboard/StudentDashboardView.tsx](../../src/views/student-dashboard/StudentDashboardView.tsx) |
| `/estudiante/marco-teorico` | TheoryQuizView | `useTheoryQuiz` | [src/views/theory-verification/TheoryQuizView.tsx](../../src/views/theory-verification/TheoryQuizView.tsx) |
| `/estudiante/talleres` | RepositoryView | `useWorkshops` | [src/views/repository/RepositoryView.tsx](../../src/views/repository/RepositoryView.tsx) |
| `/estudiante/talleres/:workshopId` | CriticalIncidentView | `useTheoryGate`, `useIncidentWizard`, `useTheoryReferences`, `useSensitiveDataDetector`, `useImpulse` | [src/views/critical-incidents/CriticalIncidentView.tsx](../../src/views/critical-incidents/CriticalIncidentView.tsx) |
| `/estudiante/innovaciones` | InnovationsView | `useInnovations` | [src/views/innovations/InnovationsView.tsx](../../src/views/innovations/InnovationsView.tsx) |

## 3) Hooks del núcleo y su uso cruzado

| Hook | Ruta de implementación | Uso principal |
|---|---|---|
| `useAuth` | [src/hooks/useAuth.ts](../../src/hooks/useAuth.ts) | Autenticación global, sesión, rol y cierre de sesión. |
| `useWorkshops` | [src/hooks/useWorkshops.ts](../../src/hooks/useWorkshops.ts) | Listado y acceso a talleres del estudiante. |
| `useTheoryGate` | [src/views/critical-incidents/hooks/useTheoryGate.ts](../../src/views/critical-incidents/hooks/useTheoryGate.ts) | Valida si el estudiante aprobó el marco teórico antes de entrar a incidentes críticos. |
| `useIncidentWizard` | [src/views/critical-incidents/hooks/useIncidentWizard.ts](../../src/views/critical-incidents/hooks/useIncidentWizard.ts) | Flujo paso a paso del asistente de incidentes. |
| `useImpulse` | [src/views/critical-incidents/hooks/useImpulse.ts](../../src/views/critical-incidents/hooks/useImpulse.ts) | Solicitud de impulso del docente/IA dentro del taller. |
| `useTheoryReferences` | [src/views/critical-incidents/hooks/useTheoryReferences.ts](../../src/views/critical-incidents/hooks/useTheoryReferences.ts) | Carga y manejo de referencias teóricas del taller. |
| `useSensitiveDataDetector` | [src/views/critical-incidents/hooks/useSensitiveDataDetector.ts](../../src/views/critical-incidents/hooks/useSensitiveDataDetector.ts) | Detección de contenido sensible antes de enviar o guardar. |
| `useTheoryQuiz` | [src/views/theory-verification/hooks/useTheoryQuiz.ts](../../src/views/theory-verification/hooks/useTheoryQuiz.ts) | Lógica del cuestionario de marco teórico. |
| `useWorkPacing` | [src/views/work-pacing/hooks/useWorkPacing.ts](../../src/views/work-pacing/hooks/useWorkPacing.ts) | Fechas, plazos e intentos del docente y el estudiante. |
| `useReflections` | [src/views/reflections/hooks/useReflections.ts](../../src/views/reflections/hooks/useReflections.ts) | Listado y filtrado de reflexiones para revisión. |
| `useReflectionReview` | [src/views/reflections/hooks/useReflectionReview.ts](../../src/views/reflections/hooks/useReflectionReview.ts) | Validación y edición de retroalimentación. |
| `useInnovations` | [src/views/innovations/hooks/useInnovations.ts](../../src/views/innovations/hooks/useInnovations.ts) | Biblioteca compartida de innovaciones. |
| `useTeacherDashboard` | [src/views/teacher-dashboard/hooks/useTeacherDashboard.ts](../../src/views/teacher-dashboard/hooks/useTeacherDashboard.ts) | Panel de seguimiento del docente. |

## 4) Relación con la configuración de rutas

La definición de rutas está en [src/App.tsx](../../src/App.tsx), donde se montan las vistas por rol y URL. Los hooks se implementan en carpetas específicas dentro de cada feature, siguiendo la convención:

- `src/hooks/` para lógica transversal.
- `src/views/<feature>/hooks/` para la lógica de cada pantalla o feature.

Esto permite mantener la separación entre:

- presentación visual (componentes en `components/`),
- lógica de estado y efectos (hooks en `hooks/`),
- acceso a datos y almacenamiento (servicios y utils).

## 5) Conclusión

La mayor parte de la lógica reactiva del proyecto está encapsulada en hooks que viven junto a cada feature y se consumen desde las rutas definidas en [src/App.tsx](../../src/App.tsx). El patrón general es:

- roles y sesión: `useAuth`
- administración: `useWhitelist`, `useBulkUpload`
- docente: `useTeacherDashboard`, `useReflections`, `useWorkPacing`
- estudiante: `useTheoryQuiz`, `useWorkshops`, `useTheoryGate`, `useIncidentWizard`, `useImpulse`
- contenidos compartidos: `useInnovations`
