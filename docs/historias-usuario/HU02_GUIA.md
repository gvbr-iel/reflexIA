# Guía de desarrollo — HU-02: Retroalimentación asistida por IA y su revisión por el profesor guía

## Descripción general

Este módulo implementa **RF-02**: la IA entrega al estudiante observaciones formativas ("impulsos") sobre su incidente crítico, y el **profesor guía** las revisa, las edita y las valida desde su panel.

> **Historia de usuario.** Como Profesor guía, quiero revisar, ajustar y validar la retroalimentación que la IA propone sobre las reflexiones de mis estudiantes, para asegurar que las orientaciones sean pertinentes antes de entregarlas.
> Como estudiante, quiero recibir orientaciones sobre qué elementos faltan en mi relato, sin que la IA lo escriba por mí, para mejorarlo con mis propias palabras.

La HU tiene **dos caras**, que se conectan por el mismo tipo de dato (`AIFeedback`):

| Cara | Rol | Dónde | Qué hace |
|---|---|---|---|
| **El Impulso** | Estudiante | `/estudiante/talleres/:workshopId` | Pide un impulso a la IA desde el asistente; cada solicitud descuenta 1 intento. |
| **Revisión de reflexiones** | Profesor guía | `/docente/reflexiones` | Ve la propuesta de la IA **antes** de actuar; puede editarla, guardar y validarla. |

> **Alcance — leer antes de probar.** El proyecto es **solo frontend**. No hay IA real ni base de datos compartida:
>
> - Los impulsos los genera `utils/impulseGenerator.ts`, una función local que revisa el texto con reglas por palabras clave y simula una espera de 2,5 s.
> - El profesor trabaja con **8 reflexiones de ejemplo** (`views/reflections/data/reflections.ts`), porque los envíos reales de cada estudiante viven en el `localStorage` de su propia cuenta y otra cuenta no puede leerlos.
> - Lo que sí se guarda de verdad es la **revisión del profesor** y los **intentos del estudiante**, en `localStorage` particionado por usuario.
> - "Validar y entregar" es simulado: no llega a ninguna cuenta de estudiante. La pantalla lo avisa.

---

## Criterios de aceptación y dónde se cumplen

| Criterio (RF-02, RF-06, RNF-05) | Dónde |
|---|---|
| Los impulsos aparecen en un contenedor destacado junto al editor | `ImpulsePanel` dentro de `IncidentWizard`: fondo suave, borde izquierdo `accent-ia`, ícono y etiqueta "El Impulso" |
| La IA no entrega la solución redactada | `impulseGenerator` solo emite preguntas y orientaciones generales; nunca copia ni reescribe el texto del alumno |
| El modelo evalúa omisiones de contexto, actores e infraestructura | Reglas por paso en `impulseGenerator` (ver "El generador de impulsos") |
| Respuesta en ≤10 s con indicador de carga | Espera simulada de 2,5 s (`IMPULSE_LATENCY_MS`) con skeleton y el texto "Puede tardar hasta 10 segundos" |
| El profesor puede auditar los impulsos desde su panel | `ReflectionsView`: `AIPreviewBox` muestra la propuesta original y el `FeedbackEditor` la versión editable |
| El profesor ve la propuesta antes de validarla o editarla | El detalle muestra primero el relato y la propuesta de la IA; el editor va debajo |
| Cada solicitud de impulso descuenta 1 intento | `criticalIncidentService.requestImpulse` |
| Guardar un borrador no descuenta intentos | `saveDraft` no se modificó y nunca toca la clave de intentos |
| Contador de intentos restantes visible | `ImpulsePanel` ("Te quedan N de 3 intentos") y `DraftManager` |

---

## Ubicación en el código

```text
src/
├── models/
│   └── reflection.ts                  # Tipos de la revisión docente (reutiliza AIFeedback de HU-03)
├── services/
│   ├── reflectionService.ts           # Mock del panel docente: listar, obtener, editar, validar
│   └── criticalIncidentService.ts     # Se agregaron requestImpulse y getAttempts (HU-03)
├── utils/
│   ├── impulseGenerator.ts            # Generador SIMULADO de impulsos (pura, sin red)
│   └── formatDateTime.ts              # Fecha y hora legibles
└── views/
    ├── reflections/                   # Cara del PROFESOR
    │   ├── ReflectionsView.tsx        # Vista: junta los dos hooks y los componentes
    │   ├── data/
    │   │   └── reflections.ts         # 8 reflexiones de ejemplo (Educación Física)
    │   ├── hooks/
    │   │   ├── useReflections.ts      # Lista, filtros, resumen y reflexión elegida
    │   │   └── useReflectionReview.ts # Editar, guardar y validar UNA reflexión
    │   └── components/
    │       ├── ReflectionStatsBar.tsx       # Tarjetas: total y por estado
    │       ├── ReflectionFilterBar.tsx      # Búsqueda y filtros por taller y estado
    │       ├── ReflectionList.tsx           # Lista con estados de carga, error y vacío
    │       ├── ReflectionListItem.tsx       # Una reflexión de la lista
    │       ├── ReviewStatusBadge.tsx        # Pendiente, Editada o Validada (ícono + texto)
    │       ├── ReflectionStoryPanel.tsx     # Relato del estudiante (solo lectura)
    │       ├── AIPreviewBox.tsx             # Propuesta ORIGINAL de la IA (solo lectura)
    │       ├── FeedbackEditor.tsx           # Edición, guardado y botón de validar
    │       ├── ValidateFeedbackModal.tsx    # Confirmación de validación
    │       ├── ReviewNotice.tsx             # Aviso de éxito o error
    │       ├── stepTitle.ts                 # Nombre de cada paso del asistente
    │       └── fieldStyles.ts               # Estilos de los campos
    └── critical-incidents/            # Cara del ESTUDIANTE
        ├── hooks/
        │   └── useImpulse.ts          # Pedir impulso, contador y bloqueos
        └── components/
            ├── ImpulsePanel.tsx       # Panel "El Impulso"
            └── IncidentWizard.tsx     # Se conectó useImpulse e ImpulsePanel (HU-03)
```

Sigue la cadena de capas del proyecto: `models` → `services` → `hooks` → `components` → vista. Las vistas y componentes nunca llaman al servicio directamente: lo hacen a través de los hooks (regla R4).

---

## Cómo funciona

### El generador de impulsos (`utils/impulseGenerator.ts`)

`generateImpulse({ workshopId, attemptNumber, content })` recibe el texto de los 4 pasos y devuelve un `AIFeedback`: un comentario general y una lista de pistas (`hints`), cada una asociada a un paso.

1. Si un paso tiene **menos de 50 caracteres** (`minCharactersPerField`), emite una sola pista pidiendo desarrollarlo más.
2. Si no, busca palabras clave (sin tildes) de los elementos que debería contener. Por cada elemento ausente emite una orientación:

| Paso | Elementos que busca |
|---|---|
| Contexto | grupo (cantidad, edades, nivel), infraestructura, conocimientos previos |
| Descripción del hecho | momento, acciones, cómo terminó |
| Actores e influencia | quiénes participaron, influencia, el propio papel |
| Relevancia pedagógica | significado, vínculo con la teoría, qué haría distinto |

Las orientaciones son siempre preguntas o indicaciones generales. Es una **simulación**: puede equivocarse (por ejemplo, no reconocer un sinónimo). La IA real la reemplazará sin cambiar la firma.

### Cara del estudiante: pedir un impulso

```text
Pedir impulso (botón)
  → useImpulse.requestImpulse
      1. wizard.saveDraft            (guarda el borrador; NO descuenta intentos)
      2. criticalIncidentService.requestImpulse
           - valida: taller no bloqueado, quedan intentos, cada paso ≥ 50 caracteres
           - espera 2,5 s (simula a la IA)
           - generateImpulse → AIFeedback
           - guarda el intento en reflexia_incident_attempts  (descuenta 1)
      3. el panel muestra las orientaciones y el contador baja
```

Reglas que aplica `useImpulse`:

- El botón se deshabilita y se explica el motivo (`blockedReason`) si: los intentos están agotados, el detector de datos sensibles encontró algo (RF-05) o algún paso no llega al mínimo.
- Un pedido **rechazado no descuenta** intentos.
- Los impulsos de intentos anteriores se pueden releer (botones "Intento 1, 2, 3") y sobreviven a recargar la página.

### Cara del profesor: revisar y validar

`ReflectionsView` usa dos hooks:

- **`useReflections`**: carga la lista, aplica los filtros (taller, estado y texto sin distinguir tildes), calcula el resumen y recuerda cuál reflexión está abierta.
- **`useReflectionReview`**: maneja **una** reflexión. Mantiene dos copias de la retroalimentación: la **guardada** y la **que se está editando** (borrador). Comparándolas sabe si hay cambios sin guardar.

Estados de la revisión (`ReviewStatus`):

| Estado | Significado | Cómo se llega |
|---|---|---|
| `pending` (Pendiente) | El profesor aún no la toca; solo existe la propuesta de la IA | Estado inicial |
| `edited` (Editada) | Guardó cambios pero no la validó | "Guardar cambios" |
| `validated` (Validada) | Lista para entregarse al estudiante | "Validar retroalimentación" |

Reglas del panel:

- **Solo se puede validar si no hay cambios sin guardar**: así lo validado es exactamente lo guardado.
- Un impulso o el comentario general **vacíos** impiden guardar.
- Editar una reflexión ya validada la devuelve a "Editada": hay que validarla otra vez.
- "Restaurar propuesta de la IA" vuelve al texto original; "Descartar cambios" vuelve a lo último guardado.
- **La propuesta original de la IA (`aiFeedback`) nunca se modifica.** Sirve para auditar qué sugirió el sistema y qué cambió el profesor.

### Distribución en pantalla

- Desde `xl`: la lista a la izquierda (22 rem) y el detalle a la derecha.
- En pantallas más angostas se muestra una cosa a la vez: al abrir una reflexión aparece su detalle con el botón "Volver a la lista".

---

## Persistencia (mock)

| Clave de `localStorage` | Quién la escribe | Contenido |
|---|---|---|
| `reflexia_reflection_reviews:<uid>` | `reflectionService` | Revisiones del profesor, por `reflectionId` |
| `reflexia_incident_attempts:<uid>` | `criticalIncidentService` | Intentos del estudiante con su impulso, por taller |

Todas se particionan por el UID de Firebase con `utils/userStorage.ts`. Sin sesión activa, las operaciones que guardan fallan con un mensaje claro en lugar de aparentar que funcionaron.

---

## Decisiones de diseño

- **Dos hooks en el panel docente**, porque una cosa es la lista y otra la revisión de un caso. La vista los conecta con `updateReflection`.
- **Propuesta original separada de la versión editada**, para poder auditar (RF-02).
- **Datos de ejemplo en vez de datos reales**, por el aislamiento del `localStorage` por cuenta. Los relatos son de clases de Educación Física, usan solo roles y ningún nombre, colegio ni curso exacto (AI_GUIDELINES §8). Las imágenes e íconos de la interfaz son neutros.
- **Sin rojo**: los errores y avisos usan ícono y texto, no color. El rojo queda reservado al desempeño (AI_GUIDELINES §4).
- **El estado se indica con ícono y texto**, no solo con color (badges y panel de El Impulso).
- **`requestImpulse` no guarda el borrador**: lo guarda antes el hook. Así cada pieza tiene una sola responsabilidad y se conserva el invariante de HU-03.

---

## Cómo probar

**Profesor** (cuenta con rol `teacher`):

1. `npm run dev`, iniciar sesión y abrir **Reflexiones** en el menú lateral.
2. Comprobar el resumen (Total 8, Pendientes 4, Editadas 2, Validadas 2) y que la lista parte con la reflexión más reciente.
3. Probar los filtros (taller, estado, búsqueda) y "Limpiar filtros".
4. Abrir **Estudiante A**: relato, propuesta de la IA (7 orientaciones) y editor.
5. Editar un impulso: aparece "Tienes cambios sin guardar" y "Validar" queda deshabilitado. Vaciar un impulso bloquea "Guardar cambios".
6. Guardar (pasa a **Editada**), validar con la confirmación (pasa a **Validada**) y recargar: el estado se conserva.
7. Probar "Restaurar propuesta de la IA" y "Descartar cambios".
8. Revisar a 360, 768 y 1280 px.

**Estudiante** (cuenta con rol `student`, marco teórico aprobado o simulado con el interruptor de desarrollo):

1. Abrir el **Taller 1**. Con los pasos vacíos, "Pedir impulso" está deshabilitado y dice por qué.
2. Escribir más de 50 caracteres en cada paso y pulsar **Pedir impulso**: skeleton unos 2,5 s y luego las orientaciones; el contador baja a 2 de 3.
3. "Guardar borrador" no cambia el contador.
4. Pedir dos veces más: aparecen los botones de intento y, al llegar a 0, el botón se bloquea.
5. Recargar: los intentos siguen ahí.

Verificación de tipos: `npx tsc --noEmit` (no hay tests).

---

## Pendientes y discrepancias

| Tema | Detalle |
|---|---|
| IA real | El generador es una simulación por palabras clave. Con backend, reemplazar `generateImpulse` por la llamada a la API manteniendo la firma y respetando el límite de 10 s (RNF-05). |
| Datos compartidos entre cuentas | El profesor no ve los envíos reales de los estudiantes y la validación no llega al estudiante. Requiere base de datos compartida. |
| Detección de datos sensibles | El detector del asistente (HU-05) es manual y por paso. El bloqueo de "Pedir impulso" solo actúa si ya detectó algo en el paso actual. Una puerta completa (RF-05) necesita análisis automático de los 4 pasos o el backend. |
| Intentos configurables | `requestImpulse` usa el máximo de HU-03 (3). Falta conectarlo a lo que el profesor configura en HU-06. |
| Trazabilidad | No se registra quién auditó o validó cada impulso (backend). |
| Agregar impulsos | El profesor puede editar y quitar los impulsos de la IA, pero no agregar uno nuevo. |
| Contenido de los relatos | Los relatos de ejemplo son ficticios. Si la profesora guía aclara que AI_GUIDELINES §8 ("sin estética deportiva") restringe también el contenido, es un cambio solo de texto. |
| Componentes duplicados | `fieldStyles` y la tarjeta de resumen (`StatCard`) tienen copias en otras vistas; moverlos a `src/components/` (regla R2) requiere acuerdo del equipo. |
| Mock | `SIMULATED_LATENCY_MS` (`reflectionService`) y `IMPULSE_LATENCY_MS` (`criticalIncidentService`) y las dos claves de `localStorage` desaparecen al conectar el backend. |
