# ReflexIA: guía de contexto para la IA (frontend)

> Cargar este archivo al inicio de **cada** sesión con IA. Todo el equipo trabaja con las mismas reglas.
> Complementa al `README.md` del repositorio (requisitos RF/RNF y estructura de carpetas). Si algo se contradice, se resuelve en equipo y se corrige en **ambos** archivos (ver sección 10).
> Fuentes: README del equipo y reuniones con la cliente (académica Marcela), extraídas con NotebookLM.
> Lo marcado **[PROPUESTA]** o **[POR DEFINIR]** no fue decidido por la cliente: lo define el equipo.

---

## 1. Qué es ReflexIA

Plataforma web para estudiantes de pedagogía en práctica profesional. Guía un **ciclo reflexivo** en el que el estudiante analiza un incidente crítico de su práctica y propone una innovación pedagógica, apoyado por una IA que orienta sin escribir por él. Reemplaza un proceso que antes se hacía en papel.

**Roles:**
- **Estudiante en práctica:** trabajo estrictamente individual.
- **Profesor guía:** monitorea el avance semanal, configura plazos e intentos, revisa la retroalimentación.
- **Administrador (profesor guía / coordinador):** gestiona la whitelist de correos autorizados.

**Contexto de uso:**
- Asincrónico: el estudiante redacta en casa, con calma.
- Sincrónico: en la clase semanal se socializan las reflexiones y las observaciones de la IA.

---

## 2. Requisitos que condicionan el frontend

| Código | Qué implica para la UI |
|---|---|
| RF-01 | Vista de administración de whitelist: carga masiva, estado activo/inactivo, filtros de búsqueda, revocar acceso de inmediato. |
| RF-02 | El profesor ve la propuesta de retroalimentación del sistema **antes** de validarla o editarla. |
| RF-03 | Asistente paso a paso (*Step Wizard*) con referencias bibliográficas y marco teórico visibles en pantalla, y guardado de borradores. |
| RF-04 | Cuestionario del marco teórico con puntaje mínimo; bloquea o condiciona el acceso a los talleres. |
| RF-05 | Detección y enmascaramiento de nombres propios, colegios y datos sensibles; el docente puede bloquear relatos expuestos. |
| RF-06 | Plazos y límite de intentos por actividad, con **contador de intentos restantes** visible. |
| RF-07 | Biblioteca de innovaciones categorizada, con filtros de búsqueda (estudiantes y profesores). |
| RF-08 | Autenticación del estudiante de práctica profesional (es su puerta de entrada). |
| RNF-01 | Se valida el texto del relato antes de procesarlo: si hay nombres propios, se bloquea y se pide anonimizar. |
| RNF-02 | Acceso solo con correo institucional `@ucen.cl` **y** presente en la whitelist. |
| RNF-03 | Diseño 100% responsive: móvil desde **360 px**, tablet y escritorio. |
| RNF-04 | Desde el panel principal, **máximo 2 clics** para llegar a cualquier taller o al marco teórico; menú visual con paleta de colores fríos; el usuario ve su progreso general. |
| RNF-05 | La retroalimentación de la IA tarda **≤ 10 s** por intento: hay que diseñar el estado de carga (loader/skeleton) y el de error. |

---

## 3. Identidad y tono

- Nombre: **Reflexia** (en el logo, "Reflex" + "IA" en mayúscula y color distinto; fue una *sugerencia*, no un pedido).
- Sensación visual: **moderna e innovadora**, que motive a innovar. Estilo limpio, sobrio y profesional.
- Tono del lenguaje: **amigable, automatizado y estructurado**. Orienta al estudiante a opinar **con fundamento**, respaldado en la literatura, no solo por intuición.
- **Transversal a cualquier pedagogía** (lenguaje, matemáticas, etc.).
- Referencias de la cliente: aulas virtuales/Moodle (modernidad y estructura institucional), plataformas preuniversitarias (organización por categorías en el inicio), Portafolio Docente del Ministerio (navegación por etapas).

---

## 4. Colores

**Pedido explícito:** paleta de **tonos fríos**: azules (incluido azul institucional), celestes, verde agua y verde esmeralda.

**Prohibido en la estructura de la app:** naranjo y rojo, y cualquier estética asociada a educación física o deporte.

> **Excepción controlada:** el rojo **solo** se permite como color *semántico de desempeño* en la rueda (nota reprobatoria). Nunca en fondos, botones, navegación ni decoración.

### Colores de desempeño de la rueda (sugerencia de la cliente)

| Estado | Condición | Color |
|---|---|---|
| No entregado / nota 1.0 | Taller no entregado | Gris |
| Reprobado | 1.1 a 3.9 | Rojo (solo aquí) |
| Aprobado | 4.0 a 5.0 | Azul / azul verdoso |
| Sobresaliente | 5.0 a 7.0 | Verde esmeralda |

### Tokens de color **[PROPUESTA: validar con el equipo antes de usar]**

La cliente no dio códigos; estos valores son un punto de partida. Ubicación sugerida: `src/assets/styles/tokens.css`, importado una sola vez desde `main.tsx`.

```css
:root {
  /* Base */
  --color-primary:       #1E5AA8; /* azul institucional */
  --color-secondary:     #2BA3B8; /* celeste / verde agua */
  --color-accent-ia:     #059669; /* esmeralda: la "IA" del logo y elementos de la IA */
  --color-bg:            #F7FAFC;
  --color-surface:       #FFFFFF;
  --color-text:          #1F2937;
  --color-border:        #D6E0EA;

  /* Desempeño (rueda) */
  --perf-none:           #9CA3AF; /* gris */
  --perf-fail:           #DC2626; /* rojo: SOLO semántico */
  --perf-pass:           #0F8FA8; /* azul verdoso */
  --perf-excellent:      #059669; /* esmeralda */
}
```

---

## 5. Tipografía

La cliente no pidió fuentes específicas; las eligió el equipo. **Solo se usan estas dos familias** (ambas gratuitas y con soporte completo para español):

| Elemento | Fuente | Peso / estilo | Propósito |
|---|---|---|---|
| Títulos, encabezados y etiquetas de la rueda | **Plus Jakarta Sans** | SemiBold (600) / Bold (700) | Dinamismo, modernidad y estructura visual clara. |
| Cuerpo de texto, formularios y relato del incidente | **Inter** | Regular (400) | Máxima legibilidad al redactar. |
| Caja de retroalimentación de la IA ("El Impulso") | **Inter** | Regular (400) o Medium (500) | Diferenciar las orientaciones de la IA del texto del alumno **mediante el contenedor** (ver sección 7), no con cursiva. |
| Logo "Reflex" + "IA" | **Plus Jakarta Sans** | Bold (700) o ExtraBold (800) | "IA" en mayúscula y en `--color-accent-ia`. Exportarlo como SVG, sin depender de que la fuente cargue. |

**Reglas:**
- Cargar solo los pesos 400, 500, 600 y 700 (800 solo si el logo lo requiere), con `font-display: swap`.
- Alojar las fuentes en el proyecto con `@fontsource/inter` y `@fontsource/plus-jakarta-sans`, **sin** CDN de Google (más rápido y no envía la IP de los usuarios a terceros).
- Cuerpo de texto de **16 px como mínimo** e interlineado de 1,5 a 1,6 en textos de lectura y redacción (campos menores a 16 px provocan zoom automático en iOS).
- Cursiva solo para citas breves, nunca en párrafos largos.
- Las etiquetas de la rueda deben ser cortas (por ejemplo "Taller 1") y probarse en 360 px.

```css
:root {
  --font-heading: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-body:    'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;

  /* Escala [PROPUESTA] */
  --text-xs: 0.75rem;   --text-sm: 0.875rem;
  --text-base: 1rem;    --text-lg: 1.25rem;
  --text-xl: 1.5rem;    --text-2xl: 2rem;
}
```

---

## 6. Pantallas y su módulo en el código

Cada módulo vive en `src/views/<feature>/` (ver sección 9).

| Pantalla | RF | Rol | Módulo |
|---|---|---|---|
| Inicio de sesión (solo `@ucen.cl`, sin RUT) | RF-08 | Estudiante | `auth/` |
| Panel principal del estudiante con la **rueda** y su progreso; encabezado con nombre, asignatura, código y profesor guía | RNF-04 | Estudiante | `StudentLayout` + vista de inicio **[POR DEFINIR]** |
| Marco teórico + evaluación diagnóstica | RF-04 | Estudiante | `theory-verification/` |
| Talleres 1 a 4: fundamentación, objetivos, sustento teórico, actividad y matriz del producto esperado | RF-03 | Estudiante | `critical-incidents/` |
| Evaluación final (propuesta de innovación pedagógica) | n/d | Estudiante | **[POR DEFINIR]** no aparece en el README |
| Retroalimentación y revisión de reflexiones | RF-02 | Profesor guía | `reflections/` |
| Plazos e intentos (configuración y contadores) | RF-06 | Profesor guía / Estudiante | `work-pacing/` |
| Detección y enmascaramiento de datos sensibles | RF-05, RNF-01 | Transversal | `privacy-guard/` |
| Repositorio de innovaciones ("Actuaciones Mejoradas"): publica automáticamente proyectos con nota **≥ 6.0** *(sugerencia)* | RF-07 | Estudiante y profesor | `repository/` |
| Gestión de whitelist | RF-01 | Administrador | `admin-whitelist/` |
| Panel docente: seguimiento semanal de alumnos | n/d | Profesor guía | `TeacherLayout` + vista **[POR DEFINIR]** |

Las secciones del estudiante se **desbloquean en orden lineal**.

---

## 7. Componentes de interfaz

- **Rueda circular interactiva ("Experiencia Reflexiva 360°")** *(sugerencia)*: navegación principal dividida en segmentos (Marco teórico, Talleres 1 a 4, Evaluación final) en vez de pestañas. Los segmentos bloqueados se ven bloqueados y cambian de color según la nota (tabla de la sección 4). Debe cumplir RNF-04 (máximo 2 clics) y funcionar bien en 360 px.
- **Formulario del incidente crítico** *(explícito)*, dentro del `StepWizard`: un paso o campo de texto **separado** para cada uno de *Contexto* (alumnos, infraestructura, conocimientos previos), *Descripción del hecho*, *Actores e influencia* y *Relevancia pedagógica*. Con `TheoryReferenceSidebar` y `DraftManager` (borradores).
- **"El Impulso", caja de retroalimentación de la IA** *(explícito)*: panel desplegable con pistas sobre qué elementos faltan. **Nunca** entrega la respuesta redactada. Muestra el contador de intentos restantes y un estado de carga (la respuesta puede tardar hasta 10 s). Se distingue del texto del alumno por su contenedor: fondo suave, borde izquierdo en `--color-accent-ia`, ícono y etiqueta "El Impulso"; el texto va en Inter Regular/Medium, sin cursiva. La diferencia no debe depender solo del color.
- **Cuestionario diagnóstico** (`QuizEngine`, `ScoreCard`) *(explícito)*: 10 preguntas aleatorias de un banco de 30, con temporizador y hasta 3 intentos.
- **Gráfico de desempeño** *(sugerencia)*: evolución del estudiante durante el semestre.
- **Componentes de administración y revisión:** `UploadModal`, `WhitelistTable`, `FilterBar`, `FeedbackEditor`, `AIPreviewBox`, `MaskingPreview`, `InnovationCard`, `CategoryFilter`, `ResourceDetailModal`.

---

## 8. Restricciones obligatorias

- **Sin estética deportiva:** ni imágenes, ni íconos, ni elementos asociados a educación física o deporte.
- **Sin rojo/naranjo estructural** (ver excepción de la sección 4).
- **Sin RUT** en registros ni formularios (Ley 21.719 de Protección de Datos Personales).
- **La IA nunca redacta ni corrige el texto del alumno.** Solo entrega orientaciones generales ("impulsos").
- **Sin video ni audio** de salas de clases (restricciones legales de privacidad).
- **Anonimización estricta:** no se registran nombres reales de estudiantes, profesores, colegios ni cursos exactos. Solo rangos generales o edades como contexto. Si se detecta un nombre propio, el relato **no se procesa** hasta que el usuario lo anonimice.

---

## 9. Reglas técnicas para la IA

### Stack
- **React + TypeScript** (`App.tsx`, `main.tsx`), con Context API (`AuthContext`, `ThemeContext`) y llamadas a la API con Axios/Fetch desde `services/`.
- **Bundler:** Vite (`vite.config.ts`).
- **Estilos:** Tailwind CSS v3 (`tailwindcss` en `package.json`).
- **Librería de pruebas:** **[POR DEFINIR]** (confirmar con el equipo y anotar aquí).

### Estructura de carpetas (*Feature-Driven*)

```text
src/
├── assets/        # Recursos estáticos y estilos globales (tokens aquí)
├── components/    # UI reutilizable global (Button, Modal, Table, Dropzone, etc.)
├── context/       # AuthContext, ThemeContext
├── hooks/         # Hooks globales (useAuth, useDebounce, etc.)
├── layouts/       # AdminLayout, TeacherLayout, StudentLayout
├── models/        # Tipos e interfaces globales (User, Reflection, Incident, etc.)
├── services/      # Axios/Fetch y llamadas a la API por módulo
├── utils/         # Formateadores, validadores, anonimizadores
├── views/         # Un módulo por feature (ver sección 6)
│   └── <feature>/ # components/, hooks/ y <Feature>View.tsx
├── App.tsx
└── main.tsx
```

### Convenciones **[PROPUESTA: confirmar]**
- Carpetas en `kebab-case`; componentes y vistas en `PascalCase`; hooks con prefijo `use`; vistas terminan en `View.tsx`.
- Código, variables y nombres de archivo en inglés; **textos de la interfaz en español**.

### Reglas fijas
1. Usar **siempre** los componentes de `src/components/` (Button, Modal, Table, Dropzone, etc.). No crear botones, inputs ni tablas nuevos dentro de una vista.
2. Un componente que se use en **dos o más features** se mueve a `src/components/` y se avisa al equipo. Un subcomponente de una sola feature queda en `views/<feature>/components/`.
3. Usar **solo tokens** (colores, tipografía, espaciado, radios, sombras). Prohibido escribir colores hexadecimales o tamaños sueltos dentro de los componentes, y usar fuentes distintas de las definidas en la sección 5 (`var(--font-heading)` y `var(--font-body)`).
4. Los tipos compartidos van en `models/`; las llamadas a la API, en `services/`. Las vistas y componentes no llaman a la API directamente.
5. La lógica y el estado de cada feature van en sus hooks (`views/<feature>/hooks/`), no mezclados con el JSX.
6. Cada vista se construye dentro del layout de su rol (`StudentLayout`, `TeacherLayout`, `AdminLayout`).
7. No modificar archivos compartidos (tokens, `components/`, `context/`, `models/`) sin acordarlo con el equipo.
8. Diseño **móvil primero** (desde 360 px) y accesible: contraste suficiente, foco visible con teclado, etiquetas en formularios, tamaños legibles.
9. Toda acción que dependa de la IA o de la red tiene estado de **carga, error y vacío**.
10. Textos de la interfaz en español, simples; los mensajes de error explican qué pasó y cómo corregirlo. Una acción conserva el mismo nombre en todo el flujo ("Guardar borrador" genera "Borrador guardado").
11. Antes de crear una pantalla, imitar el patrón de una ya aprobada: `[ruta/VistaDeReferencia]` **[POR DEFINIR]**.

---

## 10. Convenciones de Git

### Mensajes de commit (*Conventional Commits*)

Formato: `<tipo>: <descripción corta en infinitivo>`

| Tipo | Cuándo usarlo | Ejemplo |
|---|---|---|
| `feat` | Agregar una función nueva | `feat: agregar formulario de incidente crítico` |
| `fix` | Corregir un error o bug | `fix: corregir validación del correo @ucen.cl` |
| `docs` | Cambios solo en documentación | `docs: actualizar AI_GUIDELINES con convenciones de commit` |
| `style` | Cambios de estilos/CSS, sin lógica | `style: ajustar colores del token primary en tokens.css` |
| `refactor` | Reorganizar código sin cambiar comportamiento | `refactor: mover lógica de whitelist a useWhitelist` |
| `chore` | Configuración, dependencias, estructura | `chore: agregar estructura base compartida (components, models)` |

**Reglas:**
1. Siempre en **minúsculas** después del tipo.
2. Describir **qué hace** el commit, no qué hiciste tú (*"agregar vista"*, no *"agregué vista"*).
3. Máximo **72 caracteres** en la descripción.
4. **Un commit = un propósito.** No mezclar corrección de bug + función nueva en el mismo commit.

### Estrategia de ramas

- `main`: código estable y compartido. Solo se sube estructura base, componentes globales y código revisado.
- `feature/hu-XX-nombre`: una rama por Historia de Usuario (ejemplo: `feature/hu-01-admin-whitelist`). Se crea desde `main` y se fusiona de vuelta con Pull Request o merge.
- Antes de empezar a trabajar: `git pull origin main` para tener la última versión.
- Antes de fusionar: verificar que `npm run dev` funcione sin errores.

---

## 11. Discrepancias y dudas por resolver

- **Dominio del correo:** el README (RNF-02) dice `@ucen.cl`; la extracción de las reuniones decía `@central.cl`. En este archivo se usa `@ucen.cl` hasta confirmar con la cliente.
- **Aprobación del cuestionario diagnóstico:** el README habla de "puntaje mínimo aprobatorio"; en las reuniones se mencionó exigir **100% de aciertos**. Confirmar cuál rige y si el umbral es configurable por el profesor (RF-06).
- **Intentos de revisión de la IA por taller:** ¿2 o 3? (se acordó limitarlos, falta fijar el número).
- **Evaluación final y panel docente:** no aparecen en el árbol de carpetas del README; definir en qué módulo viven.
- Valores finales de la **paleta** y **stack de estilos** (secciones 4 y 9). La tipografía ya quedó definida en la sección 5.

La configuración de acceso y los detalles de HU-08 están consolidados en
[`HU08_GUIA.md`](./docs/historias-usuario/HU08_GUIA.md).
