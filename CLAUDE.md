# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

ReflexIA es una aplicación web (React 18 + TypeScript + Vite + Tailwind v3) de práctica profesional pedagógica. Utiliza Firebase Authentication y Cloud Firestore para el inicio de sesión y la whitelist de usuarios institucional; los talleres de incidentes críticos y cuestionarios diagnósticos emplean persistencia en `localStorage` particionada de forma segura por UID mediante `utils/userStorage.ts`.

Contexto, requisitos (RF/RNF) y reglas del equipo, que debes respetar en todo cambio:

@AI_GUIDELINES.md

`README.md` contiene el estado detallado de las HU y el mapa de rutas.

## Comandos

```bash
npm run dev            # Servidor de desarrollo (Vite)
npm run lint           # Verificación de tipos TypeScript (tsc --noEmit)
npm run build          # Compilación completa (tsc && vite build)
```

- **`npm run lint`**: Ejecuta `tsc --noEmit`, asegurando que no existan errores de tipos.
- `tsconfig.json` es estricto con `noUnusedLocals` y `noUnusedParameters`: cualquier import o variable no utilizada romperá la compilación.
- No hay alias `@/`. Usa siempre rutas relativas (ej. `../../models/whitelist`).

## Arquitectura

**Rutas y layouts.** `src/App.tsx` define rutas anidadas por rol (`/admin`, `/docente`, `/estudiante`) y la ruta pública `/iniciar-sesion`. La guarda `RequireStudent` (alias `RequireAuth`) protege las rutas según `allowedRoles`. Cada rol tiene un layout en `src/layouts/` con cabecera (que muestra el email del usuario activo y botón de salida) y menú lateral de 240 px (`w-60`).
- `/admin` → `/admin/whitelist`: Gestión de la whitelist (`WhiteListView`).
- `/docente`: Panel de seguimiento de estudiantes (`TeacherDashboardView`), con datos de ejemplo del mock `services/teacherDashboardService.ts`.
- `/docente/plazos`: Regulación de plazos e intentos (`DeadlinesView`, HU-06). `/docente/reflexiones` es una vista preliminar.
- `/estudiante`: Dashboard de progreso (`StudentDashboardView`).
- `/estudiante/marco-teorico`: Evaluación diagnóstica (`TheoryQuizView`, HU-04).
- `/estudiante/talleres`: Repositorio de talleres con bloqueo condicional (`RepositoryView`).
- `/estudiante/talleres/:workshopId`: Asistente guiado de incidentes críticos (`CriticalIncidentView`, HU-03).
- `/estudiante/innovaciones`: Espacio de innovaciones pedagógicas (`InnovationsView`, placeholder para RF-07).

**Cadena de capas de cada feature.** El patrón estándar es:
`models/<feature>.ts` (tipos y contratos) → `services/<feature>Service.ts` (Firestore para whitelist/auth, o almacenamiento local particionado por UID para talleres) → `views/<feature>/hooks/` (toda la lógica y estado) → `views/<feature>/components/` (solo presentación) → `<Feature>View.tsx`.

- Las vistas y componentes nunca llaman al servicio directamente, solo a través de hooks (regla R4).
- `models/theoryQuiz.ts`, `models/whitelist.ts` y `models/criticalIncident.ts` son los contratos entre features.
- Claves base de talleres: `reflexia_theory_attempts`, `reflexia_theory_approval`, `reflexia_incident_drafts`, etc. Todas se particionan por el UID de Firebase con `utils/userStorage.ts`.

**Dependencia HU-03 (incidentes) → HU-04 (marco teórico).** Los talleres solo se desbloquean si el estudiante aprobó el marco teórico. Se consulta en un único punto: `views/critical-incidents/hooks/useTheoryGate.ts`, invocando a `theoryQuizService.getApprovalStatus()`.

**Invariante de HU-03.** Guardar un borrador **nunca** descuenta intentos de revisión: `criticalIncidentService.saveDraft` solo escribe la clave de borradores.

## Convenciones de diseño y código

- **Estilos:** Tailwind CSS con tokens institucionales. Los componentes de `theory-verification`, `admin-whitelist` y `work-pacing` están completamente migrados a Tailwind con iconos vectoriales de `lucide-react`.
- **Rojo:** Reservado exclusivamente como color semántico de desempeño (`perf-fail`), nunca para errores de formulario o botones comunes.
- **Diseño adaptable:** Móvil primero desde 360 px; para distribuciones en dos columnas con menú lateral usa `xl`.
- **Resiliencia:** La aplicación cuenta con un `ErrorBoundary` global en `src/main.tsx` y blindaje en `userStorage.ts` y `workPacingService.ts` ante cuotas de almacenamiento o recargas de página.

## Estado de integración

- **HU-01 (Whitelist):** Conectada a Cloud Firestore en tiempo real con soporte para 3 roles (`student`, `teacher`, `admin`), 5 métricas de resumen y carga masiva con bloqueo preventivo.
- **HU-03 (Incidentes críticos):** Asistente paso a paso con referencias bibliográficas y autoguardado de borradores.
- **HU-04 (Marco teórico):** Cuestionario de 30 preguntas, temporizador y resultados con Tailwind CSS e iconos Lucide; bloqueo condicional de talleres.
- **HU-05 (Datos sensibles):** Detección en frontend vía OpenRouter con rotación automática de modelos gratuitos.
- **HU-06 (Plazos e intentos):** Panel docente en `/docente/plazos` con límites de intentos y fechas de entrega.
- **Panel docente (`/docente`):** Seguimiento semanal con 4 tarjetas de resumen, filtros por situación (todos, vencidos, en curso, completados) y tabla de avance por estudiante (tarjetas en móvil). Usa un mock local con 8 estudiantes ficticios (`teacherDashboardService`); aún no lee los avances reales, que viven en el `localStorage` de cada estudiante.
- **HU-08 (Autenticación multi-rol):** Login unificado en `/iniciar-sesion` con Firebase Authentication, verificación en Firestore y redirección por perfil.
- **Pendientes:** HU-02 (retroalimentación de reflexiones) y HU-07 (biblioteca de innovaciones).
