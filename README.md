src/
├── assets/                  # Imágenes, iconos globales y estilos globales
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