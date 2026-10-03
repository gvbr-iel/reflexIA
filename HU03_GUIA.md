# Guía de desarrollo — HU-03: Registro Estructurado de Incidentes Críticos

## Descripción general

Este módulo implementa el **asistente paso a paso (Step Wizard)** para redactar el relato de un incidente crítico (RF-03). El estudiante completa cuatro etapas independientes: **1) Contexto, 2) Descripción del hecho, 3) Actores e influencia y 4) Relevancia pedagógica**, con un panel lateral de referencias bibliográficas y un gestor de borradores.

El asistente es **por taller** (talleres 1 a 4, con desbloqueo lineal) y solo está disponible si el estudiante aprobó el marco teórico (HU-04 / RF-04).

Criterios de aceptación de RF-03 y dónde se cumplen:

| Criterio | Dónde |
|---|---|
| Bloqueo de avance si el campo obligatorio del paso actual está vacío | `useIncidentWizard` (`goNext`, `canGoToStep`) |
| Guardado manual y automático de borradores, de forma estructurada | `useIncidentWizard` + `criticalIncidentService.saveDraft` |
| Guardar un borrador no descuenta intentos de revisión | `criticalIncidentService.saveDraft` solo escribe la clave de borradores |

> **Alcance:** el proyecto es **solo frontend**. Los borradores se guardan en `localStorage`; el criterio "guardado en base de datos" está simulado y queda listo para conectar un backend sin cambiar las firmas.

### Ubicación en el código

```text
src/
├── models/
│   └── criticalIncident.ts          # Interfaces, pasos y configuración
├── services/
│   └── criticalIncidentService.ts   # Mock con localStorage (firmas estables)
├── vite-env.d.ts                    # Tipos de Vite (import.meta.env)
└── views/
    └── critical-incidents/
        ├── components/
        │   ├── WorkshopWorkspace.tsx        # Une selector y asistente
        │   ├── WorkshopSelector.tsx         # Tarjetas de los talleres 1 a 4
        │   ├── IncidentWizard.tsx           # Compone el asistente de un taller
        │   ├── StepWizard.tsx               # Indicador de los 4 pasos
        │   ├── IncidentStepForm.tsx         # Campo de texto de cada paso
        │   ├── TheoryReferenceSidebar.tsx   # Panel de referencias
        │   ├── DraftManager.tsx             # Guardar y descartar borrador
        │   └── DevTheoryToggle.tsx          # Solo desarrollo: simula la aprobación
        ├── dev/
        │   └── theoryApprovalSimulator.ts   # Solo desarrollo
        ├── hooks/
        │   ├── useTheoryGate.ts             # Único punto de contacto con HU-04
        │   ├── useWorkshops.ts              # Lista y selección de talleres
        │   ├── useIncidentWizard.ts         # Lógica y estado del asistente
        │   └── useTheoryReferences.ts       # Referencias del paso actual
        └── CriticalIncidentView.tsx         # Vista principal
```

---

## Registro de cambios por etapa

### Etapa 1 — Modelos e interfaces TypeScript

**Archivo creado:** `src/models/criticalIncident.ts`

Contratos del módulo:

- **Talleres** (`Workshop`, `WorkshopStatus`): estado en el flujo lineal (`locked`, `available`, `in-progress`, `completed`), intentos usados y máximos.
- **Pasos** (`IncidentStep`, `IncidentStepInfo`, `INCIDENT_STEPS`): los 4 pasos con título, instrucción y ejemplo, tomados de AI_GUIDELINES §7.
- **Borrador** (`IncidentDraft`, `SaveDraftPayload`): contenido de los 4 campos, paso en que quedó el estudiante y si el guardado fue automático.
- **Retroalimentación y envío** (`AIFeedback`, `WorkshopAttempt`, `SubmitWorkshopPayload`): definidos para el futuro envío a revisión; **todavía no se usan**.
- **Configuración** (`WorkshopConfig`, `DEFAULT_WORKSHOP_CONFIG`): 3 intentos por taller, autoguardado cada 30 s y mínimo de 50 caracteres por campo.
- **Referencias** (`TheoryReference`): cada referencia indica a qué pasos aplica.

El modelo **no importa tipos de `theoryQuiz`**: la dependencia con HU-04 se consulta en un solo punto (Etapa 3). Se exporta desde `models/index.ts`.

### Etapa 2 — Servicio de API (mock local)

**Archivo creado:** `src/services/criticalIncidentService.ts`

Mock con `localStorage` y firmas estables; cada método incluye un `TODO` con la llamada Axios que corresponde.

**Métodos:**

- **`fetchWorkshops()`**: los 4 talleres con su estado, calculado por progresión lineal (un taller se bloquea si el anterior no está completado) y la configuración vigente.
- **`getDraft(workshopId)`**: el borrador del taller, o `null`.
- **`saveDraft(payload, isAutoSaved)`**: crea o reemplaza el borrador. Solo escribe en la clave de borradores, nunca en la de intentos.
- **`clearDraft(workshopId)`**: descarta el borrador.
- **`getReferences(step)`**: las referencias pertinentes al paso.

**Claves de localStorage:** `reflexia_incident_drafts` (un borrador por taller) y `reflexia_incident_attempts`.

Si la escritura falla, el error se propaga: un borrador que no se guardó no se da por guardado. El servicio **no conoce HU-04**.

### Etapa 3 — Bloqueo por marco teórico

**Archivos creados:** `hooks/useTheoryGate.ts`, `components/DevTheoryToggle.tsx`, `dev/theoryApprovalSimulator.ts`, `src/vite-env.d.ts`
**Archivo modificado:** `CriticalIncidentView.tsx`

- **`useTheoryGate`**: único punto de contacto con HU-04. Llama a `theoryQuizService.getApprovalStatus()` y **falla cerrado**: si no puede verificar la aprobación, trata al estudiante como no aprobado y muestra el error.
- **`CriticalIncidentView`**: muestra los estados de carga, error con reintento, bloqueado (con enlace al marco teórico) y desbloqueado. El bloqueo se aplica en la vista, no solo en el menú, así que entrar por URL directa tampoco lo evita.
- **`DevTheoryToggle` y `theoryApprovalSimulator`**: permiten simular la aprobación solo con `npm run dev` (`import.meta.env.DEV`), mientras la vista de HU-04 no esté integrada. Escriben directamente la clave `reflexia_theory_approval` del servicio de HU-04, un acoplamiento deliberado y temporal; se eliminan al integrar HU-04.
- **`vite-env.d.ts`**: archivo estándar de Vite que faltaba; sin él TypeScript no reconoce `import.meta.env`.

### Etapa 4 — Hook de lógica y estado del asistente

**Archivo creado:** `hooks/useIncidentWizard.ts`

Encapsula toda la lógica (R5):

- Los 4 campos independientes y la navegación entre pasos.
- **Bloqueo de avance**: `goNext` no avanza si el campo del paso actual está vacío (solo espacios cuenta como vacío) y muestra el error. Se puede retroceder libremente; para ir a un paso adelante, todos los anteriores deben estar completos.
- **Guardado del borrador**:
  - manual, con "Guardar borrador";
  - automático cada 30 s, solo si hay cambios sin guardar;
  - al cambiar de paso;
  - al salir de la vista o cerrar la pestaña, para no perder lo escrito.
- Si el estudiante sigue escribiendo mientras se guarda, el borrador sigue marcado como "sin guardar".
- Retoma el borrador en el último paso guardado.
- Avisa (`onDraftChange`) cuando el borrador se guarda o se descarta.

### Etapa 5 — Componentes del asistente

**Archivos creados:** `StepWizard.tsx`, `IncidentStepForm.tsx`, `DraftManager.tsx`, `IncidentWizard.tsx`

Todos sin estado propio salvo el de interfaz (R5), con Tailwind y tokens, sin estilos inline.

- **`StepWizard`**: indicador de los 4 pasos con estado actual y completado; los pasos a los que aún no se puede llegar aparecen deshabilitados.
- **`IncidentStepForm`**: un campo de texto separado por paso. El error lleva ícono y texto, y no usa rojo (reservado para notas reprobatorias, AI_GUIDELINES §4 y §8). El Textarea vive aquí hasta que otro feature lo necesite (R2).
- **`DraftManager`**: guardar, descartar con confirmación en `Modal`, estado del último guardado y contador de intentos, para dejar claro que guardar no los consume.
- **`IncidentWizard`**: compone todo y maneja los estados de carga, error y taller bloqueado.

### Etapa 6 — Panel de referencias

**Archivos creados:** `hooks/useTheoryReferences.ts`, `components/TheoryReferenceSidebar.tsx`

- **`useTheoryReferences`**: carga las referencias del paso actual con estados de carga y error; descarta respuestas de consultas anteriores si el estudiante cambia de paso.
- **`TheoryReferenceSidebar`**: columna lateral fija desde `xl` (1280 px) y plegable debajo del formulario en pantallas menores. Incluye los estados de carga, error y vacío.

### Etapa 7 — Selector de talleres

**Archivos creados:** `hooks/useWorkshops.ts`, `components/WorkshopSelector.tsx`, `components/WorkshopWorkspace.tsx`

- **`useWorkshops`**: lista los talleres y recuerda cuál está seleccionado (por defecto, el que tiene borrador en curso). Su `refresh` actualiza los estados sin mostrar la carga.
- **`WorkshopSelector`**: tarjetas Taller 1 a 4 con estado indicado con ícono y texto: Bloqueado, Disponible, En curso y Completado.
- **`WorkshopWorkspace`**: une el selector con el asistente del taller elegido y actualiza los estados al cambiar de taller.

### Etapa 8 — Diseño adaptable

Los breakpoints de Tailwind miden el viewport, pero el menú lateral de la app resta 240 px al contenido desde `md`. Por eso:

- Las distribuciones en dos columnas (asistente y panel) usan `xl`, no `lg`.
- `StepWizard` muestra los títulos de los 4 pasos solo desde `xl`; entre `sm` y `xl` solo el del paso actual.
- El contenido de la vista se centra con un ancho máximo de 96 rem, y el panel lateral y el título escalan con el ancho de la pantalla.

---

## Cómo probar

1. `npm run dev` y abrir `/estudiante/innovaciones`.
2. Sin aprobar el marco teórico se ve la pantalla de bloqueo. Con **Simular aprobado** (solo en desarrollo) aparece el asistente.
3. Verificar los criterios: el paso no avanza con el campo vacío; el borrador se guarda manual y automáticamente y se recupera al recargar; el contador de intentos no cambia al guardar.
4. `npx tsc --noEmit` para la verificación de tipos (no hay tests).

## Discrepancias y pendientes del módulo

| Tema | Detalle | Referencia |
|---|---|---|
| Metodología R5 | La profesora guía usará un libro como base de la metodología; no se incorporó en este primer prototipo. | Por definir con la cliente |
| Referencias bibliográficas | Los autores, años y textos de `criticalIncidentService` son parafraseos provisionales marcados `[POR DEFINIR]`; hay que validarlos antes de mostrarlos a estudiantes. | Por definir con la cliente |
| Títulos de los talleres | Se usan nombres neutros ("Taller 1" a "Taller 4"); no hay descripciones definitivas. | `AI_GUIDELINES.md` §6 |
| Envío a revisión y "El Impulso" | Fuera del alcance de este prototipo. Los tipos existen en el modelo pero ningún código los usa. | RF-02, RNF-05 |
| Talleres 2 a 4 | Como no existe el envío, ningún taller puede completarse y los talleres 2 a 4 quedan siempre bloqueados. | Depende del envío a revisión |
| Mínimo de caracteres | `minCharactersPerField` (50) está definido pero sin uso: el avance exige solo texto no vacío; el mínimo aplicará al envío. | Decisión del equipo |
| Intentos por taller | ¿2 o 3? Se usa 3 por defecto. | `AI_GUIDELINES.md` §11 |
| Integración con HU-04 | Al integrar la vista del marco teórico, eliminar `DevTheoryToggle` y `theoryApprovalSimulator`; `useTheoryGate` no necesita cambios. | Coordinación con HU-04 |
| Rutas | El módulo se muestra en `/estudiante/innovaciones`, pero por AI_GUIDELINES §6 los talleres corresponden a `/estudiante/talleres`. | Acordar con el equipo |
| Backend | No existe; el servicio usa `localStorage` y cada método tiene su `TODO` de Axios. | Coordinación con backend |
