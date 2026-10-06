# Detalles técnicos de los componentes y hooks de React

Este documento describe los componentes React y hooks propios que están
implementados en `src/`, junto con los hooks de React y React Router que los
soportan. El inventario se organiza de acuerdo con la estructura por capas y
features del proyecto.

## 1. Cómo se organiza la interfaz

La aplicación separa responsabilidades para que el JSX de presentación no
concentre acceso a datos ni reglas de negocio:

1. **Punto de entrada:** `main.tsx` monta React, configura el enrutamiento y los
   proveedores globales.
2. **Rutas:** `App.tsx` decide qué vista mostrar y protege las rutas privadas.
3. **Layouts:** muestran la navegación y estructura común para cada rol.
4. **Vistas:** coordinan una pantalla y conectan sus componentes con hooks.
5. **Componentes compartidos o de feature:** presentan controles, listas,
   formularios y estados visuales.
6. **Hooks:** administran estado, efectos, validaciones y operaciones
   asíncronas; delegan persistencia y comunicaciones a `services/`.

Flujo habitual de una pantalla:

```text
Ruta → guarda de autenticación → layout de rol → vista
     → hook de feature → servicio → Firebase o almacenamiento local
     → componentes de presentación
```

## 2. Componentes raíz y composición de la aplicación

| Componente | Archivo | Responsabilidad |
|---|---|---|
| `App` | [`src/App.tsx`](./src/App.tsx) | Declara las rutas públicas y privadas. Carga layouts y vistas con `React.lazy` y muestra un estado de carga con `Suspense` mientras se descargan. Redirige `/admin` a la whitelist y las rutas desconocidas al inicio. |
| `AuthProvider` | [`src/context/AuthContext.tsx`](./src/context/AuthContext.tsx) | Proveedor global de autenticación. Mantiene usuario, rol y estado de autorización; verifica el acceso en la whitelist y observa cambios que puedan revocar la sesión. |
| `ErrorBoundary` | [`src/components/ErrorBoundary.tsx`](./src/components/ErrorBoundary.tsx) | Captura errores de renderizado de componentes descendientes y presenta una interfaz de respaldo en vez de dejar la aplicación en blanco. |
| `AdminLayout` | [`src/layouts/AdminLayout.tsx`](./src/layouts/AdminLayout.tsx) | Estructura del administrador, navegación a la whitelist, identidad de la sesión, menú adaptable y cierre de sesión. Renderiza la vista hija mediante el outlet de React Router. |
| `TeacherLayout` | [`src/layouts/TeacherLayout.tsx`](./src/layouts/TeacherLayout.tsx) | Estructura y navegación para panel, reflexiones, plazos e innovaciones del profesor guía. Incluye menú móvil y cierre de sesión. |
| `StudentLayout` | [`src/layouts/StudentLayout.tsx`](./src/layouts/StudentLayout.tsx) | Estructura del estudiante y navegación a progreso, marco teórico, talleres e innovaciones. Incluye el menú adaptable y el acceso a la sesión actual. |

En [`src/main.tsx`](./src/main.tsx), la aplicación se monta dentro de
`StrictMode`, `ErrorBoundary`, `BrowserRouter` y `AuthProvider`, en ese orden.
Cada envoltorio habilita una responsabilidad transversal: diagnóstico en
desarrollo, recuperación de errores de interfaz, navegación y sesión global.

## 3. Componentes reutilizables globales

Estos componentes están en `src/components/` y pueden ser utilizados por más
de una feature.

| Componente | Archivo | Responsabilidad |
|---|---|---|
| `Button` | [`src/components/Button.tsx`](./src/components/Button.tsx) | Botón visual compartido con variantes, estado de carga, icono y atributos de interacción consistentes. |
| `Dropzone` | [`src/components/Dropzone.tsx`](./src/components/Dropzone.tsx) | Zona reutilizable para seleccionar o arrastrar archivos; refleja visualmente el estado de arrastre. |
| `Modal` | [`src/components/Modal.tsx`](./src/components/Modal.tsx) | Contenedor modal común con título, cuerpo y pie opcional; gestiona el cierre mediante teclado y los efectos asociados al ciclo de vida. |
| `RequireStudent` | [`src/components/RequireStudent.tsx`](./src/components/RequireStudent.tsx) | Guarda de rutas por estado de autenticación y rol permitido. Muestra carga/error, permite reintentar autorización y redirige al login o al inicio del rol correspondiente cuando no se puede entrar. Aunque su nombre histórico dice “Student”, protege también rutas de administración y docencia. |
| `Table` | [`src/components/Table.tsx`](./src/components/Table.tsx) | Tabla genérica tipada para mostrar datos tabulares y sus columnas. |
| `WorkshopStatusBadge` | [`src/components/WorkshopStatusBadge.tsx`](./src/components/WorkshopStatusBadge.tsx) | Etiqueta visual del estado de un taller dentro del flujo del estudiante. |

Los iconos importados desde `lucide-react` son componentes de terceros que se
usan como contenido visual; no son componentes propios del proyecto.

## 4. Vistas de las rutas

Las vistas son los componentes que representan una pantalla completa y conectan
los hooks de feature con la interfaz.

| Vista | Archivo | Responsabilidad |
|---|---|---|
| `LandingPage` | [`src/views/landingpage/LandingPage.tsx`](./src/views/landingpage/LandingPage.tsx) | Presentación pública de ReflexIA y acceso al inicio de sesión. |
| `LoginView` | [`src/views/auth/LoginView.tsx`](./src/views/auth/LoginView.tsx) | Formulario de inicio de sesión; valida el correo institucional, invoca autenticación y navega según el rol recibido. |
| `WhiteListView` | [`src/views/admin-whitelist/WhiteListView.tsx`](./src/views/admin-whitelist/WhiteListView.tsx) | Coordina métricas, filtros, tabla y modales de alta, carga masiva y revocación de la whitelist. |
| `TeacherDashboardView` | [`src/views/teacher-dashboard/TeacherDashboardView.tsx`](./src/views/teacher-dashboard/TeacherDashboardView.tsx) | Panel de seguimiento docente con resumen, filtros y progreso de estudiantes. |
| `ReflectionsView` | [`src/views/reflections/ReflectionsView.tsx`](./src/views/reflections/ReflectionsView.tsx) | Revisión docente de reflexiones: filtros, propuesta original de IA, edición y validación de impulsos. |
| `DeadlinesView` | [`src/views/work-pacing/DeadlinesView.tsx`](./src/views/work-pacing/DeadlinesView.tsx) | Configuración de fechas límite e intentos para marco teórico y talleres. |
| `StudentDashboardView` | [`src/views/student-dashboard/StudentDashboardView.tsx`](./src/views/student-dashboard/StudentDashboardView.tsx) | Inicio del estudiante y resumen de su progreso reflexivo. |
| `TheoryQuizView` | [`src/views/theory-verification/TheoryQuizView.tsx`](./src/views/theory-verification/TheoryQuizView.tsx) | Pantalla del cuestionario diagnóstico y presentación de introducción, preguntas o resultado. |
| `RepositoryView` | [`src/views/repository/RepositoryView.tsx`](./src/views/repository/RepositoryView.tsx) | Lista de talleres, sus estados y acceso condicionado a cada taller. |
| `CriticalIncidentView` | [`src/views/critical-incidents/CriticalIncidentView.tsx`](./src/views/critical-incidents/CriticalIncidentView.tsx) | Entrada al asistente de incidentes; valida el parámetro de ruta, la aprobación teórica y el estado del taller. |
| `InnovationsView` | [`src/views/innovations/InnovationsView.tsx`](./src/views/innovations/InnovationsView.tsx) | Biblioteca de innovaciones con búsqueda, filtro de categoría y detalle del caso. |

## 5. Componentes por feature

### 5.1 Administración de whitelist

Ubicación: `src/views/admin-whitelist/components/`. Todos se presentan desde
`WhiteListView`; la lógica de la lista y la carga se mantiene en hooks.

| Componente | Responsabilidad |
|---|---|
| `ActionNotice` | Comunica el resultado de una acción de administración y permite descartar el aviso. |
| `AddEmailModal` | Formulario modal para autorizar un correo individual y elegir su rol. |
| `FilterBar` | Búsqueda por correo y filtros de estado y rol; muestra conteo y permite limpiar filtros. |
| `RevokeAccessModal` | Pide confirmación antes de revocar el acceso de un registro seleccionado. |
| `RoleSelector` | Selector accesible de los perfiles de usuario disponibles. |
| `UploadModal` | Flujo de carga masiva: selección de rol y origen, vista previa, resumen y confirmación de importación. |
| `WhitelistStats` | Tarjetas con totales de entradas, estados y usuarios activos por rol; reutiliza internamente `StatCard` para cada métrica. |
| `WhitelistTable` | Tabla adaptable de correos, roles, estado, fecha y acciones para revocar o restablecer. Contiene las etiquetas internas `RoleBadge` y `StatusBadge`. |

`UploadModal` también define `SummaryItem` y `PreviewRow` como piezas de
presentación internas para resumir la importación y mostrar el resultado de
cada línea antes de confirmar.

### 5.2 Incidentes críticos

Ubicación: `src/views/critical-incidents/components/`. `IncidentWizard`
concentra el flujo del taller y combina el formulario, el guardado, las
referencias, la privacidad y “El Impulso”.

| Componente | Responsabilidad |
|---|---|
| `WorkshopWorkspace` | Organiza el espacio de trabajo del taller y su estado general. |
| `WorkshopSelector` | Permite elegir entre los talleres disponibles y presenta su estado de avance. |
| `IncidentWizard` | Conecta hooks y componentes para redactar, guardar, validar privacidad y solicitar impulsos. |
| `StepWizard` | Muestra la progresión entre los pasos del asistente y las acciones de navegación. |
| `IncidentStepForm` | Presenta el campo de texto del paso activo y su validación. |
| `DraftManager` | Presenta acciones y estado para guardar, descartar o confirmar un borrador. |
| `TheoryReferenceSidebar` | Muestra referencias bibliográficas relevantes al paso actual. |
| `SensitiveDataPreview` | Presenta el texto analizado y destaca los posibles datos sensibles sin reescribir el relato; contiene una vista interna para el estado detectado. |
| `ImpulsePanel` | Presenta orientaciones de “El Impulso”, estados de carga/error y el contador e historial de intentos. |
| `WorkshopResultBanner` | Comunica el resultado registrado para el taller y sus efectos en el recorrido. |
| `DevTheoryToggle` | Control de desarrollo para simular la aprobación del marco teórico. |
| `DevWorkshopResultToggle` | Control de desarrollo para simular o restablecer el resultado de un taller. |

Los dos controles `Dev*` son herramientas de demostración y se muestran solo
en desarrollo. `SensitiveDataPreview` puede representar distintos subestados
del análisis sin transferir esa lógica al formulario del incidente.

### 5.3 Biblioteca de innovaciones

Ubicación: `src/views/innovations/components/`.

| Componente | Responsabilidad |
|---|---|
| `InnovationCard` | Tarjeta de resumen de una innovación y acción para abrir su detalle. |
| `InnovationDetailModal` | Presenta el contenido ampliado del caso seleccionado. |

### 5.4 Revisión de reflexiones

Ubicación: `src/views/reflections/components/`.

| Componente | Responsabilidad |
|---|---|
| `AIPreviewBox` | Distingue y presenta la propuesta original de retroalimentación de IA. |
| `FeedbackEditor` | Permite editar impulsos y comentario general; marca campos incompletos y controla la solicitud de validación. |
| `ReflectionFilterBar` | Expone los filtros de taller, estado y texto de búsqueda. |
| `ReflectionList` | Presenta la lista filtrada y sus estados de carga o vacío. |
| `ReflectionListItem` | Muestra el resumen de una reflexión y permite seleccionarla. |
| `ReflectionStatsBar` | Resume la cantidad de reflexiones por estado de revisión con tarjetas `StatCard` internas. |
| `ReflectionStoryPanel` | Muestra el relato del incidente asociado a la reflexión abierta. |
| `ReviewNotice` | Comunica el resultado de guardar o validar la revisión. |
| `ReviewStatusBadge` | Representa visualmente el estado de revisión. |
| `ValidateFeedbackModal` | Confirma la validación de la retroalimentación guardada. |

`FeedbackEditor` contiene el subcomponente `FieldError` para asociar mensajes
de validación a los campos.

### 5.5 Panel docente

Ubicación: `src/views/teacher-dashboard/components/`.

| Componente | Responsabilidad |
|---|---|
| `TeacherStats` | Tarjetas resumen del seguimiento de estudiantes; presenta cada métrica mediante su `StatCard` interno. |
| `StudentFilterBar` | Filtros por situación del estudiante y conteos de cada grupo. |
| `StudentProgressTable` | Presenta estudiantes y avance de actividades en escritorio y móvil. Incluye `SituationBadge`, `ActivityCell`, `MobileActivityRow` y `MobileStudentCard` como subcomponentes de formato. |
| `PerformanceBadge` | Etiqueta el resultado de desempeño de una actividad. |

### 5.6 Evaluación del marco teórico

Ubicación: `src/views/theory-verification/components/`.

| Componente | Responsabilidad |
|---|---|
| `QuizEngine` | Presenta la pregunta actual, las alternativas, navegación y envío del cuestionario. |
| `QuizTimer` | Visualiza el tiempo restante del intento. |
| `ScoreCard` | Presenta el puntaje, el resultado de aprobación y la información del intento. |

### 5.7 Plazos e intentos

Ubicación: `src/views/work-pacing/components/`.

| Componente | Responsabilidad |
|---|---|
| `ActivityPacingCard` | Muestra y permite editar el plazo y máximo de intentos de una actividad. |
| `DeadlineBadge` | Resume visualmente la proximidad o vencimiento de una fecha. |
| `PacingNotice` | Comunica el resultado de guardar o restablecer la configuración. |
| `PacingSaveBar` | Presenta acciones para guardar cambios o descartarlos. |
| `PacingStats` | Resume el próximo plazo, las actividades vencidas y la configuración personalizada con tarjetas `StatCard` internas. |
| `PrototypeNotice` | Advierte que esta funcionalidad opera como prototipo. |
| `ResetDefaultsModal` | Confirma el restablecimiento de valores de plazo e intentos. |

## 6. Hooks de React utilizados

Los hooks nativos permiten que componentes funcionales mantengan estado,
respondan al ciclo de vida y compartan valores sin propagar estado manualmente.

| Hook | Uso en ReflexIA | Importancia |
|---|---|---|
| `useState` | Formularios, sesión, filtros, estados de carga/error, selección y datos de pantallas. | Mantiene los datos que cambian y provoca el render necesario cuando se actualizan. |
| `useEffect` | Carga inicial, suscripciones a Firebase, temporizadores, sincronización y limpieza al desmontar. | Coordina efectos externos al render; requiere dependencias correctas y limpieza para evitar listeners o timers activos de más. |
| `useMemo` | Derivación de listas filtradas, resúmenes, selección actual y objetos de contexto. | Evita recalcular valores derivados en cada render cuando sus dependencias no cambiaron. |
| `useCallback` | Acciones asíncronas, setters y funciones usadas por efectos o componentes descendientes. | Conserva la identidad de callbacks entre renders cuando sus dependencias permanecen estables. |
| `useRef` | Identificadores de solicitud, referencias actuales y handles de `setInterval`. | Guarda valores mutables entre renders sin causar renderizados; ayuda a descartar respuestas antiguas y limpiar recursos. |
| `useContext` | Lectura de `AuthContext` dentro de `useAuth`. | Permite que cualquier componente descendiente consulte la misma sesión y rol provistos por `AuthProvider`. |

## 7. Hooks de React Router

| Hook | Dónde se usa | Importancia |
|---|---|---|
| `useNavigate` | Login, layouts y vistas que navegan tras una acción. | Cambia la ruta desde código, por ejemplo después de autenticar o cerrar sesión. |
| `useLocation` | Guarda de acceso y layout del estudiante. | Lee la ubicación actual para preservar o responder a la navegación activa. |
| `useParams` | Vista del incidente crítico. | Lee `:workshopId` de la ruta para cargar el taller solicitado. |

`Outlet`, `Routes`, `Route`, `Navigate`, `BrowserRouter` y `Suspense` también
participan en el enrutamiento y composición, pero son componentes, no hooks.

## 8. Hooks personalizados del proyecto

### 8.1 Autenticación y navegación

| Hook | Archivo | Qué resuelve y por qué importa |
|---|---|---|
| `useAuth` | [`src/hooks/useAuth.ts`](./src/hooks/useAuth.ts) | Acceso tipado a usuario, rol, estado, inicio/cierre de sesión y reintento de autorización. Lanza un error claro si se invoca fuera de `AuthProvider`, evitando consumir un contexto inexistente. |
| `useWorkshops` | [`src/hooks/useWorkshops.ts`](./src/hooks/useWorkshops.ts) | Fuente compartida del estado de los cuatro talleres. Proporciona carga inicial, reintento y actualización silenciosa para mantener sincronizadas la lista y la vista de trabajo. |

### 8.2 Administración de whitelist

| Hook | Archivo | Qué resuelve y por qué importa |
|---|---|---|
| `useWhitelist` | [`src/views/admin-whitelist/hooks/useWhitelist.ts`](./src/views/admin-whitelist/hooks/useWhitelist.ts) | Carga entradas, calcula estadísticas, filtra por correo/estado/rol y coordina altas, importaciones, revocaciones y restablecimientos. Centraliza mensajes y estados pendientes para que la vista se mantenga presentacional. |
| `useBulkUpload` | [`src/views/admin-whitelist/hooks/useBulkUpload.ts`](./src/views/admin-whitelist/hooks/useBulkUpload.ts) | Lee CSV/TXT o texto pegado, normaliza y clasifica cada línea, detecta duplicados y entradas inválidas, prepara la vista previa y determina qué se importará. Permite corregir antes de escribir en Firestore. |

### 8.3 Talleres e incidentes críticos

| Hook | Archivo | Qué resuelve y por qué importa |
|---|---|---|
| `useTheoryGate` | [`src/views/critical-incidents/hooks/useTheoryGate.ts`](./src/views/critical-incidents/hooks/useTheoryGate.ts) | Consulta si el estudiante aprobó el marco teórico. Es el punto único de integración entre HU-04 y el acceso a los talleres; ante error falla cerrado e informa el problema. |
| `useIncidentWizard` | [`src/views/critical-incidents/hooks/useIncidentWizard.ts`](./src/views/critical-incidents/hooks/useIncidentWizard.ts) | Gestiona los cuatro campos y pasos, validación, carga del taller y borrador, guardado manual/automático y limpieza del borrador. Guardar borrador no consume intentos. |
| `useTheoryReferences` | [`src/views/critical-incidents/hooks/useTheoryReferences.ts`](./src/views/critical-incidents/hooks/useTheoryReferences.ts) | Carga referencias para el paso activo y expone carga, error y reintento. Descarta respuestas de pasos anteriores si el usuario ya avanzó. |
| `useSensitiveDataDetector` | [`src/views/critical-incidents/hooks/useSensitiveDataDetector.ts`](./src/views/critical-incidents/hooks/useSensitiveDataDetector.ts) | Orquesta el análisis de datos sensibles, controla carga/error/resultados y evita solicitudes concurrentes u obsoletas. Su resultado bloquea el impulso cuando detecta exposición. |
| `useImpulse` | [`src/views/critical-incidents/hooks/useImpulse.ts`](./src/views/critical-incidents/hooks/useImpulse.ts) | Carga historial y contador de intentos; valida mínimos de texto y privacidad; guarda el borrador antes de solicitar el impulso. Solo una solicitud aceptada consume un intento. |
| `useWorkshopResultSimulator` | [`src/views/critical-incidents/dev/useWorkshopResultSimulator.ts`](./src/views/critical-incidents/dev/useWorkshopResultSimulator.ts) | Herramienta exclusiva de desarrollo para simular y restablecer resultados de talleres y refrescar la lista. No representa la revisión real del profesor. |

### 8.4 Evaluación teórica

| Hook | Archivo | Qué resuelve y por qué importa |
|---|---|---|
| `useTheoryQuiz` | [`src/views/theory-verification/hooks/useTheoryQuiz.ts`](./src/views/theory-verification/hooks/useTheoryQuiz.ts) | Controla las fases del cuestionario, preguntas/respuestas, navegación, temporizador y autoenvío, puntaje, historial, aprobación e intentos permitidos. Mantiene separada la lógica de evaluación del motor visual. |

### 8.5 Revisión docente

| Hook | Archivo | Qué resuelve y por qué importa |
|---|---|---|
| `useReflections` | [`src/views/reflections/hooks/useReflections.ts`](./src/views/reflections/hooks/useReflections.ts) | Carga reflexiones, calcula métricas, genera opciones de taller, filtra por texto/estado/taller y mantiene la reflexión seleccionada. Al aplicar una revisión actualiza la lista sin volver a cargar todo. |
| `useReflectionReview` | [`src/views/reflections/hooks/useReflectionReview.ts`](./src/views/reflections/hooks/useReflectionReview.ts) | Mantiene borradores editables de los impulsos y comentario, detecta cambios y campos incompletos, permite guardar o validar y conserva intacta la propuesta original de IA para comparación/auditoría. |

### 8.6 Panel de seguimiento docente

| Hook | Archivo | Qué resuelve y por qué importa |
|---|---|---|
| `useTeacherDashboard` | [`src/views/teacher-dashboard/hooks/useTeacherDashboard.ts`](./src/views/teacher-dashboard/hooks/useTeacherDashboard.ts) | Carga el seguimiento, clasifica estudiantes como atrasados, en curso o completados, calcula resúmenes y conteos, y filtra el panel. Expone explícitamente carga, error, reintento y estado vacío. |

### 8.7 Biblioteca de innovaciones

| Hook | Archivo | Qué resuelve y por qué importa |
|---|---|---|
| `useInnovations` | [`src/views/innovations/hooks/useInnovations.ts`](./src/views/innovations/hooks/useInnovations.ts) | Controla texto buscado, categoría y caso seleccionado; deriva categorías únicas y casos coincidentes sin distinguir tildes ni mayúsculas. |

### 8.8 Plazos e intentos

| Hook | Archivo | Qué resuelve y por qué importa |
|---|---|---|
| `useWorkPacing` | [`src/views/work-pacing/hooks/useWorkPacing.ts`](./src/views/work-pacing/hooks/useWorkPacing.ts) | Carga la configuración de cinco actividades, mantiene valores guardados y borrador, valida el orden de plazos y límites de intentos, calcula métricas, y coordina guardar, descartar y restablecer. Evita guardar configuraciones incompletas o inválidas. |

## 9. Patrones importantes para entender el código

- **Separación entre estado y presentación:** las vistas conectan hooks; los
  componentes hijos reciben datos y callbacks mediante props.
- **Estados de interacción explícitos:** las operaciones asíncronas representan
  carga, error, vacío y contenido para que la interfaz pueda responder y permitir
  reintentos.
- **Protección frente a carreras:** varios hooks usan `useRef` con un contador
  de solicitud para ignorar respuestas de operaciones anteriores.
- **Limpieza de recursos:** efectos que abren listeners o temporizadores los
  cierran al cambiar sus dependencias o desmontarse el componente.
- **Reglas de dominio centralizadas:** las vistas no deben duplicar llamadas a
  Firebase ni persistencia; usan hooks y estos delegan a `services/`.
- **Accesibilidad y adaptación:** los componentes compartidos centralizan
  patrones de interacción y los componentes de tablas/formularios adaptan la
  presentación a móvil y escritorio.
- **Privacidad en el flujo reflexivo:** detección sensible y validación preceden
  al impulso; la IA orienta, pero no redacta ni corrige el texto del estudiante.

## 10. Dependencias de interfaz relevantes

- **React 18:** componentes funcionales y hooks.
- **React Router DOM 6:** rutas anidadas, layouts, navegación y parámetros de URL.
- **Lucide React:** iconografía vectorial usada dentro de la interfaz.
- **Tailwind CSS:** composición visual responsiva y coherente con los tokens del
  proyecto.
- **Firebase:** Authentication y Firestore se consumen a través de servicios;
  no son hooks ni componentes React del proyecto.
