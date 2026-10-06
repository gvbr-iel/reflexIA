# Guía de desarrollo — HU-06: Regulación del Ritmo de Trabajo y Límites de Intentos

## Descripción general

Este módulo implementa el **panel de plazos e intentos** para el rol **Profesor guía**, en la ruta `/docente/plazos` (RF-06).

> **Historia de usuario.** Como Profesor guía, quiero regular el ritmo de trabajo de los alumnos y limitar los intentos de revisión, para fomentar el análisis pausado, la rigurosidad y evitar envíos impulsivos o masivos.

Para cada actividad del flujo del estudiante (el **marco teórico** y los **talleres 1 a 4**), el profesor puede configurar:

- La **fecha límite** de entrega (o dejarla sin plazo).
- El **máximo de intentos** de revisión, entre 1 y 10.

Además puede ver un resumen, guardar o descartar cambios, y restablecer todo a los valores originales.

Criterios de aceptación y dónde se cumplen:

| Criterio | Dónde |
|---|---|
| El panel es accesible en un máximo de 2 clics desde la pantalla principal, con el menú visual institucional (azules y verde esmeralda) | `TeacherLayout`: la opción **Plazos e intentos** del menú lateral está a **1 clic** del panel docente |
| La interfaz se ve de forma óptima en cualquier dispositivo (móviles desde 360 px, tablets y escritorios) | Diseño móvil primero: tarjetas en columna, campos de 16 px, barra de guardado adaptada. Falta revisarlo en dispositivos reales (ver "Cómo probar") |

> **Alcance — leer antes de probar.** El proyecto es **solo frontend**. La configuración se guarda en `localStorage`, es decir, **solo en el navegador de quien la edita**, y **todavía no modifica** los plazos ni los intentos que ven los estudiantes: los servicios de talleres (HU-03) y del marco teórico (HU-04) siguen usando sus valores fijos. Por eso el panel muestra el aviso **"Datos simulados"**. Cómo conectarlo está en "Modificaciones futuras".

### Ubicación en el código

```text
src/
├── models/
│   └── workPacing.ts                    # Tipos, límites de intentos y el id del marco teórico
├── services/
│   └── workPacingService.ts             # Mock con localStorage (firmas estables)
├── utils/
│   └── workPacingDates.ts               # Validar, comparar y dar formato a fechas límite
├── layouts/
│   └── TeacherLayout.tsx                # Menú con "Plazos e intentos" (ya existía)
└── views/
    └── work-pacing/
        ├── DeadlinesView.tsx            # Vista principal: junta hook y componentes
        ├── hooks/
        │   └── useWorkPacing.ts         # Toda la lógica y el estado del panel
        └── components/
            ├── PacingStats.tsx          # Tarjetas de resumen
            ├── ActivityPacingCard.tsx   # Tarjeta de cada actividad (fecha e intentos)
            ├── DeadlineBadge.tsx        # Insignia del estado de un plazo
            ├── PacingSaveBar.tsx        # Barra fija: guardar o descartar
            ├── ResetDefaultsModal.tsx   # Confirmar el restablecimiento
            ├── PacingNotice.tsx         # Aviso del resultado de guardar o restablecer
            ├── PrototypeNotice.tsx      # Aviso de "Datos simulados"
            └── fieldStyles.ts           # Estilos compartidos de los campos
```

> **Nombre de la carpeta.** El README y `AI_GUIDELINES` §6 llaman a este módulo `work-pacing/`, pero el placeholder inicial estaba en `views/deadlines/`. Se movió a `work-pacing/` (y se actualizó el `import` en `App.tsx`) para seguir la estructura documentada. El componente conserva el nombre `DeadlinesView`, que es el que usa la tabla de rutas del README.

---

## Funcionalidades

### Resumen

Tres tarjetas arriba, calculadas con lo que está **guardado** (no con lo que se está editando):

| Tarjeta | Qué muestra |
|---|---|
| Próximo cierre | La actividad con el plazo más cercano que aún no vence y su fecha. Si no hay, "Sin plazos" |
| Plazos vencidos | Cuántas actividades ya pasaron su fecha límite |
| Personalizadas | Cuántas actividades tienen valores distintos de los originales (por ejemplo, "2 de 5") |

### Tarjeta de cada actividad

Hay **5 tarjetas**: el marco teórico y los talleres 1 a 4, en el orden del flujo del estudiante. Cada una tiene:

- El **título y el tema** de la actividad.
- La **insignia del plazo**: *Sin plazo*, *Vence en N días*, *Vence hoy* o *Vencido hace N días*. Cada estado se distingue por ícono y texto, no solo por color.
- La etiqueta **Modificado**, si los valores guardados difieren de los originales.
- **Fecha límite**: un selector de fecha, con el botón **Quitar plazo** para dejar la actividad sin fecha.
- **Intentos máximos**: botones **−** y **+** con el número en medio. Se limita entre 1 y 10.
- Una **vista previa** de lo que verá el estudiante, por ejemplo *"Intentos de revisión: 0 de 3 · Plazo: 15 oct 2026"*, y los valores originales si hubo cambios.

### Validación del orden de los plazos

Las actividades se desbloquean en orden, así que **un plazo no puede ser anterior al de la actividad previa que tenga plazo**. Si ocurre, la tarjeta muestra un mensaje que dice qué pasó y cómo corregirlo, y el botón **Guardar cambios** se bloquea. Una actividad sin plazo no se compara con nada.

### Guardar, descartar y restablecer

- Al editar algo aparece una **barra fija inferior** con "Tienes cambios sin guardar", y los botones **Descartar** y **Guardar cambios**.
- **Descartar** devuelve el panel a lo último guardado.
- **Restablecer valores por defecto** (arriba a la derecha) abre una confirmación; si hay cambios sin guardar, también avisa que se perderán. Solo se habilita si hay algo personalizado.
- Tras guardar o restablecer aparece un aviso que se oculta solo a los 6 segundos.

### Estados

- **Carga:** bloques grises animados con la forma de las tarjetas, sin números falsos en cero.
- **Error:** mensaje con el botón **Reintentar**.

---

## Conceptos clave del código

### 1. Arquitectura por capas

El módulo sigue el patrón del proyecto (ver `CLAUDE.md`):

```text
models/workPacing.ts           → tipos y constantes
services/workPacingService.ts  → datos (hoy localStorage, mañana API)
views/work-pacing/hooks/       → toda la lógica y el estado
views/work-pacing/components/  → solo presentación
DeadlinesView.tsx              → conecta el hook con los componentes
```

Las vistas y componentes nunca llaman al servicio: solo lo hace el hook (regla R4).

### 2. Tres copias de la configuración

El hook `useWorkPacing` maneja tres copias de los valores de cada actividad:

| Copia | Qué es |
|---|---|
| **Valores por defecto** | Lo que ya existe en la plataforma: las fechas de los talleres y los intentos de HU-03 y HU-04 |
| `saved` | Lo que el profesor guardó. Si nunca guardó, es igual a los valores por defecto |
| `draft` | Lo que el profesor está editando en pantalla |

Comparar `draft` con `saved` indica si **hay cambios sin guardar** (`isDirty`). Ese valor decide si aparece la barra de guardado.

### 3. Solo se guarda lo que cambió

El servicio guarda únicamente las actividades cuyos valores **difieren de los originales** (`overrides`), no las cinco. La ventaja: los valores originales siguen siendo los de la plataforma. Si mañana alguien cambia el plazo por defecto del Taller 3 y el profesor nunca lo tocó, el cambio se refleja solo.

### 4. Servicio mock con firmas estables

`workPacingService` expone tres métodos `async` que hoy leen y escriben `localStorage`, con latencia simulada de 400 ms y con el `TODO` del endpoint que los reemplazará:

| Método | Qué hace | Endpoint previsto |
|---|---|---|
| `fetchConfig()` | Devuelve lo que el profesor configuró (solo las actividades modificadas) | `GET /api/work-pacing` |
| `saveConfig(overrides)` | Guarda la configuración, reemplazando la anterior | `PUT /api/work-pacing` |
| `resetConfig()` | Borra todo: vuelve a los valores originales | `DELETE /api/work-pacing` |

- Clave de `localStorage`: **`reflexia_work_pacing`**. Si el JSON está dañado, se parte de una configuración vacía en vez de romper la pantalla.
- Al guardar, el servicio **valida** como lo haría un backend: intentos enteros entre 1 y 10, y fechas que existan (el 30 de febrero se rechaza). Si falla, lanza un `WorkPacingError` con un código (`invalid-attempts` o `invalid-deadline`).
- El servicio **no conoce los talleres ni el marco teórico**: guarda por el id de la actividad. Los ids son `theory-quiz` y `workshop-1` a `workshop-4`.

### 5. Errores con código y mensajes para el usuario

Igual que en la whitelist, el servicio no devuelve textos de interfaz, solo códigos. El hook los traduce a mensajes que explican qué pasó y cómo corregirlo (regla 10 de `AI_GUIDELINES` §9).

### 6. Cómo el hook obtiene las actividades

El hook arma las 5 actividades así:

- El **marco teórico** se define en el propio hook: sin plazo por defecto y con los intentos de `DEFAULT_QUIZ_CONFIG` (HU-04).
- Los **talleres** salen de `criticalIncidentService.fetchWorkshopPacingDefaults()` (HU-03): devuelve su título, tema, fecha límite e intentos por defecto, sin leer el progreso de un estudiante ni requerir una sesión estudiantil. El hook solo **lee**; no modifica nada del servicio de HU-03. Así el profesor puede abrir el panel sin autenticarse como estudiante y no se repiten los datos de los talleres.

Esta dependencia importa para las modificaciones futuras (ver abajo, punto "Ojo con los valores por defecto").

### 7. Validación del orden de plazos

`validateOrder` recorre las actividades en orden y recuerda el plazo de la última que tenía uno. Si el plazo actual es anterior, marca un error. Las fechas tienen formato `AAAA-MM-DD`, así que comparar los textos equivale a comparar las fechas.

### 8. Fechas en hora local

Los plazos se guardan como `AAAA-MM-DD` y se interpretan como **medianoche en la hora local del navegador** (`workPacingDates.ts`). Así un cambio de zona horaria no corre el día. Los días que faltan se cuentan desde el inicio del día de hoy, de modo que un plazo de hoy dice "Vence hoy" aunque sea de tarde.

### 9. Respuestas atrasadas

Igual que en otros hooks del proyecto, `useWorkPacing` cuenta las cargas (`latestRequestRef`) e ignora la respuesta de una carga vieja si ya se pidió otra. `StrictMode` ejecuta los efectos dos veces en desarrollo, y esto evita que una respuesta lenta pise a una más reciente.

### 10. Detalles de los componentes

- **La barra de guardado usa `fixed`, no `sticky`.** El `<main>` del layout tiene `overflow-y-auto`, y con eso un elemento `sticky` dentro de él no se pega a la pantalla. La barra queda con `md:left-60` para respetar el menú lateral y con `z-20`, por debajo de los modales (`z-50`) y del menú móvil (`z-30`).
- **El modal usa el `Modal` global**, que se renderiza en un portal sobre `<body>`.
- **Sin rojo ni naranjo** (AI_GUIDELINES §4): los errores y los plazos vencidos se marcan con ícono, borde y texto en azul institucional. El botón de restablecer no usa la variante `danger`.
- Los botones **−** y **+** tienen nombre accesible ("Reducir los intentos de Taller 1"), el número se anuncia al cambiar (`aria-live`) y los campos usan texto de 16 px para evitar el zoom automático de iOS.
- **Código repetido a propósito:** `PacingStats` incluye una copia de la tarjeta de resumen de la whitelist, y `fieldStyles.ts` es una copia de los estilos de campo de la whitelist. Se dejaron dentro del módulo para no tocar código ya fusionado. La regla R2 pide moverlos a `src/components/` cuando los usen dos módulos; queda como pendiente a acordar con el equipo.

---

## Registro de cambios por etapa

### Etapa 1 — Modelo y utilidades de fechas (`de65ecb`)

`models/workPacing.ts` (actividades, `ActivityPacing`, límites de 1 a 10 intentos, id del marco teórico) y `utils/workPacingDates.ts` (validar, comparar y dar formato a fechas).

### Etapa 2 — Servicio mock (`488d96e`)

`services/workPacingService.ts`: leer, guardar y restablecer, con validación y errores tipados.

### Etapa 3 — Hook (`27207ec`)

`useWorkPacing`: carga, borrador editable, validación del orden de plazos, guardado, descarte, restablecimiento, avisos y resumen.

### Etapa 4a — Avisos, insignia y estilos (`003a9e9`)

`fieldStyles`, `PrototypeNotice`, `PacingNotice` y `DeadlineBadge`.

### Etapa 4b — Tarjetas de resumen (`15a2092`)

`PacingStats`.

### Etapa 4c — Tarjeta de actividad (`8d79335`)

`ActivityPacingCard`.

### Etapa 4d — Barra de guardado y modal (`1aeed5e`)

`PacingSaveBar` y `ResetDefaultsModal`.

### Etapa 5 — Vista principal (`3da3777`)

`DeadlinesView` junta el hook y los componentes. Se movió de `views/deadlines/` a `views/work-pacing/` y se actualizó el `import` de `App.tsx`.

### Etapa 6 — Documentación

Esta guía.

---

## Cómo probar

1. `npm run dev`, entrar al panel docente (`/docente`) y abrir **Plazos e intentos** desde el menú lateral (un solo clic).
2. Revisar el aviso de **Datos simulados**, las 3 tarjetas de resumen y las 5 actividades. Con los valores originales, "Personalizadas" debe decir "0 de 5" y el botón **Restablecer** debe estar deshabilitado.
3. Subir los intentos de un taller con **+**: aparece la barra inferior, la etiqueta **Modificado** y "Valores originales" bajo la vista previa.
4. Poner el plazo del **Taller 2** anterior al del **Taller 1**: la tarjeta muestra el error y **Guardar cambios** se bloquea. Corregir la fecha y el error desaparece.
5. Pulsar **Guardar cambios**: aparece el aviso de éxito y la barra desaparece. Recargar la página y comprobar que los valores se mantienen.
6. Pulsar **Descartar** tras cambiar algo: el panel vuelve a lo guardado.
7. Pulsar **Quitar plazo** en una actividad: la insignia pasa a "Sin plazo".
8. **Restablecer valores por defecto**: abre la confirmación; al aceptar, todo vuelve a los valores originales.
9. Repetir lo anterior en un ancho de **360 px** (herramientas de desarrollo → modo dispositivo): las tarjetas van en columna y los botones de la barra inferior ocupan todo el ancho. Comprobar también que la barra no tape el final de la página.
10. `npx tsc --noEmit` para la verificación de tipos (no hay tests en el proyecto).

Para volver a los datos iniciales, borrar la clave `reflexia_work_pacing` en las herramientas de desarrollo (**Application → Local Storage**), o ejecutar `localStorage.removeItem('reflexia_work_pacing')` en la consola y recargar.

---

## Modificaciones futuras

Esta sección deja por escrito lo que falta para que el panel tenga efecto real. Las modificaciones tocan código de **HU-03** (talleres) y **HU-04** (marco teórico), así que hay que **acordarlas con sus responsables** antes de hacerlas.

### 1. Que la configuración llegue a los estudiantes

Hoy los valores nacen fijos en estos lugares:

| Qué | Dónde está hoy fijo | Historia |
|---|---|---|
| Fecha límite de cada taller | `WORKSHOP_DEFINITIONS` en `services/criticalIncidentService.ts` (`deadline` de cada taller) | HU-03 |
| Intentos máximos de cada taller | `DEFAULT_WORKSHOP_CONFIG.maxAttemptsPerWorkshop` en `models/criticalIncident.ts`, leído en `buildWorkshops` (`maxAttempts: maxAttemptsPerWorkshop`) | HU-03 |
| Intentos máximos del marco teórico | `DEFAULT_QUIZ_CONFIG.maxAttempts` en `models/theoryQuiz.ts`, usado en `services/theoryQuizService.ts` (`fetchQuestions`, `submitAttempt` y `getConfig`) | HU-04 |

Las pantallas del estudiante **ya muestran** "Intentos de revisión: X de Y" y las fechas, y leen esos valores de las listas de talleres y de la configuración. Por eso **no habría que cambiar las vistas**: basta con que los servicios dejen de usar el valor fijo y consulten primero la configuración del profesor.

**HU-03 — `criticalIncidentService.ts`:** en `fetchWorkshops`, leer la configuración y pasársela a `buildWorkshops`:

```ts
import { workPacingService } from './workPacingService';

// en fetchWorkshops():
const { overrides } = await workPacingService.fetchConfig();
return {
  workshops: buildWorkshops(drafts, attempts, results, overrides),
  config: DEFAULT_WORKSHOP_CONFIG,
};

// en buildWorkshops(), al armar cada taller:
const override = overrides[definition.id];
workshops.push({
  ...definition,
  // Si el profesor configuró el taller, manda su valor, incluso "sin plazo".
  deadline: override ? override.deadline : definition.deadline,
  maxAttempts: override ? override.maxAttempts : maxAttemptsPerWorkshop,
  // ...el resto igual
});
```

> **Cuidado con `??`.** No usar `override?.deadline ?? definition.deadline`: cuando el profesor **quita** un plazo (`null`), el `??` lo reemplazaría por el plazo original. Hay que decidir por la **existencia del override**, como en el ejemplo.

**HU-04 — `theoryQuizService.ts`:** reemplazar las tres apariciones de `const config = DEFAULT_QUIZ_CONFIG` (y el `return DEFAULT_QUIZ_CONFIG` de `getConfig`) por una función que combine la configuración:

```ts
import { THEORY_ACTIVITY_ID } from '../models/workPacing';
import { workPacingService } from './workPacingService';

async function getEffectiveConfig(): Promise<QuizConfig> {
  const { overrides } = await workPacingService.fetchConfig();
  const override = overrides[THEORY_ACTIVITY_ID];
  return override
    ? { ...DEFAULT_QUIZ_CONFIG, maxAttempts: override.maxAttempts }
    : DEFAULT_QUIZ_CONFIG;
}
// uso: const config = await getEffectiveConfig();
```

Además, `useTheoryQuiz` parte con `useState(DEFAULT_QUIZ_CONFIG)`; conviene que cargue la configuración desde `theoryQuizService.getConfig()` para mostrar el valor real desde el inicio.

**Decisión de diseño a acordar.** Hoy los servicios de HU-03 y HU-04 **no se conocen entre sí** (por ejemplo, el de incidentes no sabe nada de HU-04). Con esta modificación ambos pasarían a importar `workPacingService`. Alternativa: que los hooks de cada historia lean la configuración y la pasen al servicio, sin que los servicios dependan unos de otros. Hay que elegir una.

### 2. Ojo con los valores por defecto

Hoy `useWorkPacing` obtiene los **valores originales** de los talleres llamando a `criticalIncidentService.fetchWorkshopPacingDefaults()`. Si esa función empieza a devolver los valores **ya modificados** por el profesor (modificación anterior), el panel los tomaría como si fueran los originales: se perdería la etiqueta **Modificado** y **Restablecer** dejaría de devolver a lo original.

Solución recomendada: que los valores por defecto vivan en **un solo lugar**, por ejemplo una constante `DEFAULT_PACING` en `models/workPacing.ts` con la fecha y los intentos originales de cada actividad. Los servicios de HU-03 y HU-04 y el hook del panel la leerían, y desaparecería la duplicación de fechas fijas. Es la modificación más importante para mantener el proyecto **coherente**.

### 3. Hacer cumplir los plazos

Hoy ningún código **impide** guardar o enviar un taller después de su fecha límite: las vistas del estudiante solo muestran el plazo. Para que sea una restricción real (RF-06: "ventanas de tiempo") hay que decidir con la profesora guía:

- Si al vencer el plazo se **bloquea** la actividad o solo se **advierte** al estudiante.
- Si el profesor puede dar **extensiones** a un estudiante en particular (hoy la configuración es igual para todos).
- Cómo se trata un plazo que vence mientras el estudiante tiene un borrador abierto.

### 4. Contadores de intentos restantes

RF-06 pide "visualizar contadores de intentos restantes". En el lado del estudiante **ya existen** ("Intentos de revisión: X de Y", "Intentos usados: X de Y"). Un contador **por estudiante en el panel del profesor** requiere datos de varios estudiantes, que hoy no existen: los servicios actuales guardan el progreso de un único estudiante, sin identificador. Es una evolución del panel docente de seguimiento, no de esta pantalla.

### 5. Conectar el backend

1. En `workPacingService.ts`, reemplazar el cuerpo de cada método por la llamada Axios de su `TODO`, sin cambiar las firmas.
2. Eliminar la latencia simulada y las funciones de `localStorage`.
3. Mantener los códigos de `WorkPacingError` en las respuestas de error, para que `useWorkPacing` siga mostrando los mismos mensajes.
4. El backend debe **repetir las validaciones** (intentos de 1 a 10, fechas reales y orden de plazos): la validación del frontend solo sirve para avisar rápido al usuario.
5. Con un backend, la configuración es **compartida**: lo que el profesor guarde lo verán los estudiantes en cualquier navegador. Hoy no es así: el profesor y el estudiante solo comparten la configuración si usan **el mismo navegador**.

### 6. Documentación a actualizar cuando se integre

- `CLAUDE.md`: agregar la clave `reflexia_work_pacing` a las claves de `localStorage` y anotar que HU-06 está integrada, indicando si ya llega a los estudiantes.
- `AI_GUIDELINES.md` §11: la pregunta "¿2 o 3 intentos?" pasa a ser una decisión del profesor (1 a 10 en este panel).

---

## Discrepancias y pendientes del módulo

| Tema | Detalle | Referencia |
|---|---|---|
| La configuración no llega a los estudiantes | Los servicios de HU-03 y HU-04 usan valores fijos. Ver "Modificaciones futuras" § 1 | RF-06 |
| Valores por defecto duplicados | Los plazos originales están fijos en `criticalIncidentService` y los lee el panel. Conviene una única fuente (`DEFAULT_PACING`). Ver § 2 | Coordinación con HU-03 |
| Plazos sin efecto | Pasada la fecha límite no se bloquea nada. Ver § 3 | Por definir con la cliente |
| Límite de intentos | El rango de 1 a 10 es provisional. `AI_GUIDELINES` §11 deja abierto si son 2 o 3 | `AI_GUIDELINES.md` §11 |
| Sin plazo para el marco teórico | HU-04 no tiene el concepto de fecha límite; el panel permite configurarla pero nada la muestra | Coordinación con HU-04 |
| Mismo navegador | La configuración vive en `localStorage`, así que solo la ve quien la edita | Backend |
| Sin historial | No se registra quién cambió un plazo ni cuándo (solo la fecha del último guardado). RF-01 y la trazabilidad lo piden para otros módulos | Backend |
| Plazos sin hora | La fecha límite es solo un día, sin hora de cierre | Decisión de diseño |
| Código repetido | La tarjeta de resumen y los estilos de campo son copias de los de la whitelist. Mover a `src/components/` (regla R2) | Acordar con el equipo |
| Pantalla no revisada en dispositivos | El diseño es móvil primero, pero falta una revisión visual en 360 px y en tablet | RNF-03 |
| Backend | No existe; el servicio usa `localStorage` y cada método tiene su `TODO` de Axios | Coordinación con backend |
