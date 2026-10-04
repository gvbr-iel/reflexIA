# Guía de desarrollo — HU-03: Registro Estructurado de Incidentes Críticos

## Descripción general

Este módulo implementa el **asistente paso a paso (Step Wizard)** para redactar el relato de un incidente crítico (RF-03). El estudiante completa cuatro etapas independientes: **1) Contexto, 2) Descripción del hecho, 3) Actores e influencia y 4) Relevancia pedagógica**, con un panel lateral de referencias bibliográficas y un gestor de borradores.

El asistente es **por taller** (talleres 1 a 4, con desbloqueo lineal) y solo está disponible si el estudiante aprobó el marco teórico (HU-04 / RF-04).

Cada taller termina con un resultado: **aprobado** (se muestra en verde) o **reprobado** (en rojo). En ambos casos el estudiante puede continuar con el siguiente taller.

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
        │   ├── WorkshopResultBanner.tsx     # Aviso de aprobado o reprobado
        │   ├── IncidentWizard.tsx           # Compone el asistente de un taller
        │   ├── StepWizard.tsx               # Indicador de los 4 pasos
        │   ├── IncidentStepForm.tsx         # Campo de texto de cada paso
        │   ├── TheoryReferenceSidebar.tsx   # Panel de referencias
        │   ├── DraftManager.tsx             # Guardar y descartar borrador
        │   ├── DevTheoryToggle.tsx          # Solo desarrollo: simula la aprobación
        │   └── DevWorkshopResultToggle.tsx  # Solo desarrollo: simula el resultado del taller
        ├── dev/
        │   ├── theoryApprovalSimulator.ts   # Solo desarrollo
        │   └── useWorkshopResultSimulator.ts # Solo desarrollo: resultado del taller
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

- **Talleres** (`Workshop`, `WorkshopStatus`, `WorkshopOutcome`): estado en el flujo lineal (`locked`, `available`, `in-progress`, `completed`), resultado (`approved` o `failed`, solo cuando está completado), intentos usados y máximos.
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

- **`fetchWorkshops()`**: los 4 talleres con su estado, calculado por progresión lineal (un taller se bloquea si el anterior no tiene resultado) y la configuración vigente.
- **`getDraft(workshopId)`**: el borrador del taller, o `null`.
- **`saveDraft(payload, isAutoSaved)`**: crea o reemplaza el borrador. Solo escribe en la clave de borradores, nunca en la de intentos.
- **`clearDraft(workshopId)`**: descarta el borrador.
- **`getReferences(step)`**: las referencias pertinentes al paso.

**Claves de localStorage:** `reflexia_incident_drafts` (un borrador por taller), `reflexia_incident_attempts` y `reflexia_incident_results` (resultado de cada taller, Etapa 9).

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
- **`WorkshopSelector`**: tarjetas Taller 1 a 4 con estado indicado con ícono y texto: Bloqueado, Disponible, En curso, Aprobado y Reprobado (estos dos, desde la Etapa 9).
- **`WorkshopWorkspace`**: une el selector con el asistente del taller elegido y actualiza los estados al cambiar de taller.

### Etapa 8 — Diseño adaptable

Los breakpoints de Tailwind miden el viewport, pero el menú lateral de la app resta 240 px al contenido desde `md`. Por eso:

- Las distribuciones en dos columnas (asistente y panel) usan `xl`, no `lg`.
- `StepWizard` muestra los títulos de los 4 pasos solo desde `xl`; entre `sm` y `xl` solo el del paso actual.
- El contenido de la vista se centra con un ancho máximo de 96 rem, y el panel lateral y el título escalan con el ancho de la pantalla.

### Etapa 9 — Resultado del taller (aprobado o reprobado)

**Archivos creados:** `components/WorkshopResultBanner.tsx`, `components/DevWorkshopResultToggle.tsx`, `dev/useWorkshopResultSimulator.ts`
**Archivos modificados:** `models/criticalIncident.ts`, `services/criticalIncidentService.ts`, `components/WorkshopSelector.tsx`, `components/WorkshopWorkspace.tsx`

Regla de negocio: un taller con resultado queda **completado**, y tanto si fue aprobado como si fue reprobado **desbloquea el siguiente**. Un taller reprobado se muestra en rojo y uno aprobado en verde.

- **Modelo**: se agrega `WorkshopOutcome` (`approved` o `failed`) y el campo `outcome` en `Workshop`, que es `null` mientras el taller no está completado.
- **Servicio**: el resultado de cada taller se guarda en `reflexia_incident_results`. Un taller se considera completado cuando tiene resultado; esto reemplaza la condición anterior, que dependía de un intento revisado (ningún código escribía intentos, así que no cambia el comportamiento visible). Los métodos `simulateWorkshopResult` y `clearWorkshopResult` son **solo mock**:
  - `simulateWorkshopResult` rechaza simular el resultado de un taller bloqueado.
  - `clearWorkshopResult` quita el resultado del taller y de los siguientes, que dejarían de estar desbloqueados.
  - Ninguno toca los borradores ni los intentos.
- **`WorkshopSelector`**: la tarjeta del taller aprobado se pinta en verde con "Aprobado" y la del reprobado en rojo con "Reprobado". Cada una lleva ícono y texto, no solo color. El taller seleccionado conserva un anillo para distinguirlo.
- **`WorkshopResultBanner`**: aviso sobre el asistente que indica el resultado y recuerda que puede continuar con el siguiente taller; en el último taller solo informa que era el último.
- **`DevWorkshopResultToggle` y `useWorkshopResultSimulator`**: solo con `npm run dev`. Simulan la notificación del resultado del taller seleccionado con **Simular aprobado** (verde), **Simular reprobado** y **Quitar resultado**, que permite repetir la demostración. Se eliminan junto con los métodos mock del servicio cuando el resultado lo entregue el backend.
- **Colores**: el rojo se usa únicamente como color semántico de desempeño reprobatorio (AI_GUIDELINES §4); ningún botón es rojo, por eso "Simular reprobado" es un botón neutro. El botón verde reutiliza `Button` con clases `!` para no modificar un componente compartido (R7); una variante `success` sería la solución más limpia si el equipo la aprueba.

---

## Cómo probar

1. `npm run dev` y abrir `/estudiante/innovaciones`.
2. Sin aprobar el marco teórico se ve la pantalla de bloqueo. Con **Simular aprobado** (solo en desarrollo) aparece el asistente.
3. Verificar los criterios: el paso no avanza con el campo vacío; el borrador se guarda manual y automáticamente y se recupera al recargar; el contador de intentos no cambia al guardar.
4. En la caja "Modo desarrollo" del taller, pulsar **Simular aprobado** o **Simular reprobado**: la tarjeta pasa a verde o a rojo, aparece el aviso de resultado y se desbloquea el siguiente taller. **Quitar resultado** permite repetir la demostración.
5. `npx tsc --noEmit` para la verificación de tipos (no hay tests).

## Discrepancias y pendientes del módulo

| Tema | Detalle | Referencia |
|---|---|---|
| Metodología R5 | La profesora guía usará un libro como base de la metodología; no se incorporó en este primer prototipo. | Por definir con la cliente |
| Referencias bibliográficas | Los autores, años y textos de `criticalIncidentService` son parafraseos provisionales marcados `[POR DEFINIR]`; hay que validarlos antes de mostrarlos a estudiantes. | Por definir con la cliente |
| Títulos de los talleres | Se usan nombres neutros ("Taller 1" a "Taller 4"); no hay descripciones definitivas. | `AI_GUIDELINES.md` §6 |
| Envío a revisión y "El Impulso" | Fuera del alcance de este prototipo. Los tipos existen en el modelo pero ningún código los usa. | RF-02, RNF-05 |
| Resultado del taller | El resultado (aprobado o reprobado) se simula solo en desarrollo. Al integrar el backend lo entregará la revisión del taller y habrá que eliminar la simulación. Un taller reprobado no se puede repetir y el resultado todavía no consume intentos. | Depende del envío a revisión |
| Colores del resultado | El taller aprobado usa `perf-excellent` (verde esmeralda) a pedido del equipo; AI_GUIDELINES §4 define "aprobado" como azul verdoso (`perf-pass`) y reserva el esmeralda para "sobresaliente". | `AI_GUIDELINES.md` §4 |
| Mínimo de caracteres | `minCharactersPerField` (50) está definido pero sin uso: el avance exige solo texto no vacío; el mínimo aplicará al envío. | Decisión del equipo |
| Intentos por taller | ¿2 o 3? Se usa 3 por defecto. | `AI_GUIDELINES.md` §11 |
| Integración con HU-04 | Al integrar la vista del marco teórico, eliminar `DevTheoryToggle` y `theoryApprovalSimulator`; `useTheoryGate` no necesita cambios. | Coordinación con HU-04 |
| Herramientas de desarrollo | `DevTheoryToggle`, `theoryApprovalSimulator`, `DevWorkshopResultToggle` y `useWorkshopResultSimulator` solo se muestran con `npm run dev`; eliminarlas al conectar HU-04 y el backend. | Antes del paso a producción |
| Rutas | El módulo se muestra en `/estudiante/innovaciones`, pero por AI_GUIDELINES §6 los talleres corresponden a `/estudiante/talleres`. | Acordar con el equipo |
| Backend | No existe; el servicio usa `localStorage` y cada método tiene su `TODO` de Axios. | Coordinación con backend |
