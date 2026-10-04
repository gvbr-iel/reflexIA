## 📋 Requisitos Funcionales (RF)

El sistema contempla los siguientes requerimientos funcionales organizados por usuario, propósito y nivel de prioridad:

* **RF-01: Gestión de la Whitelist (Lista de Correos Autorizados)**
  * **Rol:** Administrador (Profesor guía / Coordinador)
  * **Descripción:** Gestión autónoma de la lista de correos institucionales mediante cargas masivas, revisión de estados de alta (activo/inactivo), filtros de búsqueda y revocación inmediata de accesos.
  * **Prioridad:** Alta (Garantiza trazabilidad y control de acceso seguro sin dependencia técnica).

* **RF-02: Automatización de Reflexiones y Retroalimentación**
  * **Rol:** Profesor guía
  * **Descripción:** Automatización en la revisión y entrega de retroalimentación formativa de las reflexiones semanales, permitiendo al docente visualizar propuestas del sistema antes de validarlas o editarlas.
  * **Prioridad:** Alta (Mitiga la carga de trabajo en la evaluación de relatos).

* **RF-03: Análisis Estructurado de Incidentes Críticos**
  * **Rol:** Estudiante en práctica
  * **Descripción:** Asistente paso a paso (*Step Wizard*) con referencias bibliográficas y marcos teóricos en pantalla para guiar el registro, análisis y guardado de borradores de experiencias fortuitas de aula.
  * **Prioridad:** Alta (Promueve una reflexión pedagógica basada en teoría y evita análisis superficiales).

* **RF-04: Verificación del Marco Teórico**
  * **Rol:** Profesor guía
  * **Descripción:** Evaluación o cuestionario automático sobre reflexión profesional con puntaje mínimo aprobatorio, bloqueando o condicionando de forma automática el acceso a los talleres prácticos.
  * **Prioridad:** Alta (Asegura bases conceptuales sólidas previas a la práctica en terreno).

* **RF-05: Anonimización y Resguardo de Privacidad**
  * **Rol:** Profesor guía
  * **Descripción:** Detección automática y enmascaramiento de nombres propios, colegios o datos sensibles en los relatos de los estudiantes, junto con la facultad docente de bloquear relatos expuestos.
  * **Prioridad:** Alta (Cumplimiento estricto de normativas de confidencialidad y ética profesional).

* **RF-06: Regulación del Ritmo de Trabajo y Límites de Intentos**
  * **Rol:** Profesor guía
  * **Descripción:** Configuración de ventanas de tiempo/plazos de entrega y restricción de intentos máximos permitidos por actividad, visualizando contadores de intentos restantes.
  * **Prioridad:** Media (Fomenta el análisis pausado, la rigurosidad y evita entregas masivas o impulsivas).

* **RF-07: Espacio de Consulta de Innovaciones**
  * **Rol:** Estudiante y Profesor
  * **Descripción:** Repositorio o biblioteca digital categorizada con filtros de búsqueda para consultar ejemplos de actuaciones mejoradas e innovaciones pedagógicas destacadas.
  * **Prioridad:** Media (Sirve como fuente de inspiración, referencia y apoyo para estandarizar la excelencia).

* **RF-08: Autenticación segura de Estudiantes de Práctica Profesional**
    * **Rol:** Estudiante de Práctica Profesional
    * **Descripción:** Aceptar y controlar el acceso de los estudiantes de práctica profesional.
    * **Prioridad:** Alta (Es el entrypoint del estudiante con la plataforma).

## 🔒 Requisitos No Funcionales (RNF) y Atributos de Calidad

El proyecto cumple con los siguientes estándares técnicos y de negocio definidos para la plataforma:

* **RNF-01: Privacidad y Confidencialidad**
  * **Descripción:** Validación previa del texto en los relatos redactados por los usuarios. El sistema detecta nombres propios de alumnos, docentes o establecimientos educativos, bloqueando el procesamiento temporal y solicitando su anonimización antes de cualquier evaluación para proteger la identidad de los involucrados.

* **RNF-02: Seguridad y Control de Acceso**
  * **Descripción:** Autenticación restringida exclusivamente a usuarios con correo institucional de dominio `@ucen.cl` que se encuentren previamente registrados en la lista de autorizados (Whitelist - HU-01) en la base de datos, delimitando el acceso a estudiantes y profesores de la asignatura de práctica profesional.

* **RNF-03: Compatibilidad y Responsividad**
  * **Descripción:** Interfaz 100% adaptativa (*responsive design*), garantizando una óptima visualización y experiencia de uso en dispositivos móviles (desde 360px de ancho), tablets y computadores de escritorio.

* **RNF-04: Usabilidad**
  * **Descripción:** Navegación optimizada para que el usuario pueda visualizar su progreso general y acceder a cualquier taller o marco teórico en un **máximo de 2 clics** desde el panel principal, utilizando un menú visual e intuitivo con una paleta de colores fríos (azules y verde esmeralda).

* **RNF-05: Rendimiento**
  * **Descripción:** El componente de procesamiento de Inteligencia Artificial debe generar la retroalimentación orientadora en un tiempo **menor o igual a 10 segundos** por intento, asegurando fluidez durante el desarrollo de cada taller.

## 📂 Estructura de Directorios

El código fuente del proyecto se encuentra organizado bajo una arquitectura modular por características (*Feature-Driven Development*), permitiendo una alta cohesión y desacoplamiento para cada una de las Historias de Usuario (HU).

```text
src/
├── assets/                  # Recursos estáticos (imágenes, iconos y estilos globales)
├── components/              # Componentes UI reutilizables globales (Button, Modal, Table, Dropzone, etc.)
├── context/                 # Contextos globales de React (AuthContext, ThemeContext)
├── hooks/                   # Custom hooks globales (useAuth, useDebounce, etc.)
├── layouts/                 # Diseños de pantallas según rol (AdminLayout, TeacherLayout, StudentLayout)
├── models/                  # Tipos e interfaces TypeScript globales (User, Reflection, Incident, etc.)
├── services/                # Configuración de Axios/Fetch y llamadas a APIs por módulos
├── utils/                   # Funciones de utilidad (formateadores de fechas, validadores, anonimizadores)
├── views/                   # Módulos o características principales (Features)
│   ├── admin-whitelist/     # HU-01: Gestión de Whitelist
│   │   ├── components/      # Subcomponentes específicos (UploadModal, WhitelistTable, FilterBar)
│   │   ├── hooks/           # Lógica y estado de la whitelist (useWhitelist)
│   │   └── WhitelistView.tsx
│   ├── reflections/         # HU-02: Automatización de reflexiones y retroalimentación
│   │   ├── components/      # FeedbackEditor, ReflectionList, AIPreviewBox
│   │   ├── hooks/
│   │   └── ReflectionsView.tsx
│   ├── critical-incidents/  # HU-03: Análisis estructurado de incidentes críticos
│   │   ├── components/      # StepWizard, TheoryReferenceSidebar, DraftManager
│   │   ├── hooks/
│   │   └── CriticalIncidentView.tsx
│   ├── theory-verification/ # HU-04: Cuestionario del marco teórico
│   │   ├── components/      # QuizEngine, ScoreCard
│   │   ├── hooks/
│   │   └── TheoryQuizView.tsx
│   ├── privacy-guard/       # HU-05: Anonimización y resguardo de datos sensibles
│   │   ├── components/      # SensitiveDataDetector, MaskingPreview
│   │   └── ...
│   ├── work-pacing/         # HU-06: Regulación de ritmo de trabajo e intentos (compartido/configuración)
│   │   └── ...
│   └── repository/          # HU-07: Espacio de consulta de innovaciones y buenas prácticas
│       ├── components/      # InnovationCard, CategoryFilter, ResourceDetailModal
│       └── RepositoryView.tsx
├── App.tsx                  # Componente raíz y enrutador principal
└── main.tsx                 # Punto de entrada de React
```

## 🗺️ Estructura de Rutas

Las rutas están configuradas en `App.tsx` usando React Router v6 con rutas anidadas. Cada rol tiene un layout envolvente que renderiza las vistas hijas a través de `<Outlet />`.

| Ruta | Layout | Vista | Descripción |
|---|---|---|---|
| `/admin` → `/admin/whitelist` | AdminLayout | WhiteListView | Gestión de correos autorizados |
| `/docente` | TeacherLayout | TeacherDashboardView | Panel general del docente |
| `/docente/reflexiones` | TeacherLayout | ReflectionsView | Revisión de reflexiones |
| `/docente/plazos` | TeacherLayout | DeadlinesView | Configuración de plazos e intentos |
| `/estudiante` | StudentLayout | StudentDashboardView | Mi progreso (dashboard) |
| `/estudiante/marco-teorico` | StudentLayout | TheoryQuizView | Verificación del marco teórico |
| `/estudiante/talleres` | StudentLayout | RepositoryView | Lista de talleres con su estado; cada botón abre el asistente del taller |
| `/estudiante/innovaciones/:workshopId?` | StudentLayout | CriticalIncidentView | Asistente de incidentes críticos del taller indicado (sin taller, abre el que corresponde) |
| `*` (fallback) | — | — | Redirige a `/estudiante` |