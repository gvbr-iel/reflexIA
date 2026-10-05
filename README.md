# ReflexIA — Plataforma de Práctica Profesional Pedagógica

ReflexIA es una aplicación web orientada a la práctica profesional docente de la Universidad Central de Chile (`@ucen.cl`), diseñada para estructurar la reflexión pedagógica profunda, acompañar el análisis de incidentes críticos de aula mediante inteligencia artificial formativa y resguardar la privacidad ética de los relatos escolares.

---

## 📋 Requisitos Funcionales (RF) y Estado de Implementación

| Código | Historia | Rol Principal | Estado | Descripción |
|---|---|---|---|---|
| **RF-01** | [HU-01](./HU01_GUIA.md) | Administrador | ✅ **Implementado** | Gestión autónoma de la lista de correos autorizados en Cloud Firestore mediante altas individuales, cargas masivas con vista previa, filtros de búsqueda, revocación inmediata y resumen de métricas para 3 roles (`student`, `teacher`, `admin`). |
| **RF-02** | HU-02 | Profesor guía | ⏳ *Pendiente* | Automatización en la revisión y entrega de retroalimentación formativa de las reflexiones semanales (vista preliminar `ReflectionsView.tsx`). |
| **RF-03** | [HU-03](./HU03_GUIA.md) | Estudiante | ✅ **Implementado** | Asistente paso a paso (*Step Wizard*) con referencias teóricas en pantalla para guiar el registro, análisis y autoguardado de borradores locales particionados por usuario. |
| **RF-04** | [HU-04](./HU04_GUIA.md) | Estudiante | ✅ **Implementado** | Evaluación diagnóstica del marco teórico con banco de 30 preguntas, temporizador dinámico, calificación inmediata en Tailwind CSS y bloqueo automático de los talleres prácticos hasta aprobar. |
| **RF-05** | [HU-05](./HU05_GUIA.md) | Asistente IA | ✅ **Implementado** | Detección automática en frontend de nombres propios, escuelas y datos sensibles en relatos mediante la API de OpenRouter con rotación de modelos gratuitos y destaque visual sin alterar el texto. |
| **RF-06** | [HU-06](./HU06_GUIA.md) | Profesor guía | ✅ **Implementado** | Panel de control en `/docente/plazos` para definir fechas límite y límites de intentos de revisión por actividad (marco teórico y talleres 1 a 4). |
| **RF-07** | HU-07 | Estudiante y Docente | ⏳ *Pendiente* | Biblioteca digital categorizada para consultar ejemplos de actuaciones mejoradas e innovaciones pedagógicas (vista preliminar `InnovationsView.tsx`). |
| **RF-08** | [HU-08](./HU08_GUIA.md) | Todos los roles | ✅ **Implementado** | Inicio de sesión seguro con Firebase Authentication y autorización activa en Firestore, con redirección inteligente por rol a `/estudiante`, `/docente` o `/admin`. |

---

## 🔒 Requisitos No Funcionales (RNF) y Atributos de Calidad

* **RNF-01: Privacidad y Confidencialidad**
  * Validación previa de textos mediante el servicio de IA (`openRouterService`). El sistema detecta datos sensibles (alumnos, docentes, colegios), alertando al usuario antes de cualquier envío para proteger la identidad institucional.
* **RNF-02: Seguridad y Control de Acceso**
  * Autenticación restringida a cuentas con dominio `@ucen.cl` registradas y activas en la Whitelist de Firestore. No se almacena ni solicita RUT en ninguna etapa del sistema.
* **RNF-03: Compatibilidad y Responsividad**
  * Interfaz 100% responsiva diseñada para dispositivos móviles desde 360 px, tablets y computadores de escritorio con soporte de temas y fuentes tipográficas accesibles (Inter y Plus Jakarta Sans).
* **RNF-04: Usabilidad y Navegación Rápida**
  * Acceso en un **máximo de 2 clics** a cualquier taller o marco teórico desde los paneles de navegación, con layouts especializados para cada rol.
* **RNF-05: Rendimiento**
  * Optimización de empaquetado con Vite, code-splitting con `React.lazy` y `Suspense`, y respuesta ágil del motor de inferencia de IA.

---

## 📂 Estructura de Directorios

El código fuente sigue una arquitectura modular orientada a características (*Feature-Driven Development*):

```text
src/
├── assets/                  # Estilos globales (tokens.css) y recursos
├── components/              # Componentes UI globales (Button, Modal, Table, Dropzone, ErrorBoundary)
├── context/                 # Contextos de React (AuthContext con Firebase)
├── hooks/                   # Custom hooks globales (useAuth, useWorkshops, etc.)
├── layouts/                 # Diseños envolventes por rol (AdminLayout, TeacherLayout, StudentLayout)
├── models/                  # Tipos TypeScript y contratos compartidos (whitelist, theoryQuiz, criticalIncident, etc.)
├── services/                # Capa de servicios (firebase, authService, whitelistService, openRouterService, etc.)
├── utils/                   # Utilidades de almacenamiento (userStorage), fechas y validadores de email institucional
└── views/                   # Vistas principales de la aplicación
    ├── admin-whitelist/     # HU-01: Panel de gestión de la whitelist
    ├── auth/                # HU-08: Formulario de inicio de sesión institucional
    ├── critical-incidents/  # HU-03: Asistente guiado de incidentes críticos
    ├── theory-verification/ # HU-04: Verificación diagnóstica del marco teórico
    ├── work-pacing/         # HU-06: Panel docente de plazos e intentos
    ├── student-dashboard/   # Dashboard "Mi progreso" del estudiante
    ├── teacher-dashboard/   # Dashboard general del profesor guía (placeholder)
    ├── reflections/         # Revisión de reflexiones (placeholder)
    ├── innovations/         # Espacio de innovaciones (placeholder)
    ├── repository/          # Repositorio de talleres prácticos
    └── landingpage/         # Página pública de bienvenida
```

---

## 🗺️ Mapa de Rutas de la Aplicación

| Ruta | Layout | Vista | Estado | Descripción |
|---|---|---|---|---|
| `/` | — | LandingPage | ✅ Listo | Presentación de la plataforma y acceso al inicio de sesión |
| `/iniciar-sesion` | — | LoginView | ✅ Listo | Formulario de acceso institucional con correo `@ucen.cl` y contraseña |
| `/admin` → `/admin/whitelist` | AdminLayout | WhiteListView | ✅ Listo | Gestión de la Whitelist en Cloud Firestore |
| `/docente` | TeacherLayout | TeacherDashboardView | ⏳ Placeholder | Panel general del profesor guía |
| `/docente/reflexiones` | TeacherLayout | ReflectionsView | ⏳ Placeholder | Listado y retroalimentación de reflexiones |
| `/docente/plazos` | TeacherLayout | DeadlinesView | ✅ Listo | Regulación del ritmo de trabajo: plazos e intentos |
| `/estudiante` | StudentLayout | StudentDashboardView | ✅ Listo | Dashboard "Mi progreso reflexivo" |
| `/estudiante/marco-teorico` | StudentLayout | TheoryQuizView | ✅ Listo | Evaluación diagnóstica obligatoria del marco teórico |
| `/estudiante/talleres` | StudentLayout | RepositoryView | ✅ Listo | Repositorio de talleres con bloqueo condicional |
| `/estudiante/talleres/:workshopId` | StudentLayout | CriticalIncidentView | ✅ Listo | Asistente de incidentes críticos del taller seleccionado |
| `/estudiante/innovaciones` | StudentLayout | InnovationsView | ⏳ Placeholder | Espacio de consulta de innovaciones |
| `*` (fallback) | — | — | ✅ Listo | Redirección por defecto a la página de bienvenida `/` |

---

## 🚀 Puesta en Marcha Local

### Prerrequisitos
- Node.js 18+ y npm instalados.

### Instalación y ejecución
```bash
# 1. Clonar el repositorio
git clone https://github.com/gvbr-iel/reflexIA.git
cd reflexIA

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

La plataforma incluye configuración pública de respaldo para Firebase Web Client en `src/services/firebase.ts`, por lo que es posible ejecutarla y probarla localmente de inmediato sin configuración manual adicional. Para usar la detección de datos sensibles por IA en incidentes críticos (HU-05), define `VITE_OPENROUTER_API_KEY` en tu archivo `.env`.

### Comprobaciones de calidad
```bash
# Verificación estricta de tipos TypeScript
npm run lint

# Compilación de producción
npm run build
```
