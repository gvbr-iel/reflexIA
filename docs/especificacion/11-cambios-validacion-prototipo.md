# 11. Cambios tras la validación del prototipo

Registro de los cambios que pidió la stakeholder al revisar el prototipo de ReflexIA, ordenados por pantalla, con su ubicación en el código y su relación con la especificación (documentos [04](./04-requisitos.md), [05](./05-reglas-de-negocio.md), [06](./06-decisiones-brechas-pendientes.md), [08](./08-plan-casos-de-uso.md), [09](./09-diagramas-casos-de-uso.md) y [10](./10-casos-de-uso.md)).

| Campo | Valor |
|---|---|
| Fuente | Transcripción automática de la reunión de validación del prototipo con la Dra. Marcela Brevis (en la conversación se menciona que era día 14). La transcripción tiene errores de dictado; las frases se interpretaron por contexto. |
| Fecha de este documento | 24 de octubre de 2026 |
| Estado | Borrador para revisión del equipo. **Aún no se aplica** a los documentos 01 a 10 ni al código. |

## Cómo leer este documento

- Cada cambio tiene un identificador `CAM-xx` y una ficha con: **qué cambia**, **dónde va** (archivo y elemento del código), **texto o valores** cuando se dijeron, **lo que dijo la profesora**, **conexiones** con la especificación y **estado**.
- **Estado del cambio:**
  - ✅ **Confirmado**: la profesora lo pidió o lo aprobó de forma clara.
  - 🟡 **Por confirmar**: se entiende la idea, pero el detalle (texto exacto, valor) debe confirmarse.
  - ⚠️ **Conflicto**: contradice una decisión vigente (DEC-xx) o una regla (RN-xx). Christian debe decidir.
- Los textos marcados como **"Redacción propuesta"** son una propuesta del equipo basada en lo que dijo la profesora, no una cita textual.
- Los códigos DEC-xx se explican en la sección [Decisiones citadas](#decisiones-citadas).
- Al final están la [tabla de conflictos](#conflictos-con-decisiones-vigentes), las [dudas abiertas](#dudas-abiertas-para-christian), el [material que enviará la profesora](#material-que-enviará-la-profesora) y el [impacto en los documentos](#impacto-en-la-especificación).

## Decisiones citadas

Resumen de las decisiones del documento [06](./06-decisiones-brechas-pendientes.md) que se mencionan aquí, para leer este documento sin tener que abrir el 06.

### Decisiones vigentes

| ID | Qué dice | Fecha y origen | Qué cambios la tocan |
|---|---|---|---|
| DEC-01 | El cuestionario del marco teórico se aprueba con **8 de 10** aciertos (80%). Reemplaza el 100% de `AI_GUIDELINES.md` y el 7/10 que tiene hoy el código. | Lab 5, confirmado por el equipo | CAM-09 (se mantiene, reconfirmada el 24-oct) |
| DEC-02 | Los intentos del cuestionario son **ilimitados**; desde el intento 4 la nota máxima baja por bloques (4 a 6 → 5,0; 7 a 9 → 4,0). La escala aplica **solo al cuestionario**, no a los talleres. | Lab 5, aclarado por el equipo | CAM-10 (la parte "ilimitados" la reemplaza DEC-15), CAM-17 y C-02 (la profesora quiere la escala también en los talleres) |
| DEC-03 | El dominio institucional es únicamente **`@ucen.cl`**. | Equipo | CAM-05, CAM-24 (sin cambio, reconfirmado en la reunión) |
| DEC-04 | El repositorio de innovaciones **está dentro del alcance** de la versión 1.0 y ya está implementado. | Equipo | CAM-25 (sin cambio) |
| DEC-05 | El panel de la IA se llama **"El Impulso"**. El texto del Lab 5 "Orientaciones para profundizar la reflexión profesional" queda como descripción funcional. | Equipo | CAM-04 |
| DEC-07 | La eliminación definitiva de usuarios, la nota escalonada del cuestionario y las referencias APA son requisitos vigentes, aún no cubiertos por el código. | Equipo | CAM-07, CAM-10, CAM-24 |
| DEC-11 | Cada taller tiene **3 intentos de revisión** por defecto, y el profesor guía puede cambiarlos (hoy, de 1 a 3). | Christian, 22-oct-2026 | CAM-17, CAM-23 y C-02 (la profesora pide 3 + 3 + 3 con tope de nota) |
| DEC-12 | En los talleres la IA conoce la pauta y **sugiere** una nota; la nota final la pone el profesor guía. Para pasar al taller siguiente la nota debe ser **7,0**. Al agotar los intentos queda la **nota más alta** obtenida. | Christian, 23-oct-2026 | CAM-16, CAM-18 y C-03 (la profesora no quiere que se avance al agotar intentos) |
| DEC-13 | El **plazo de cada taller lo configura el profesor guía** y el taller **se cierra solo** al vencer (y se abre el siguiente, según RN-15). | Christian, 23-oct-2026 | CAM-16 y C-04 (abrir el siguiente taller sin el 100% contradice lo pedido) |
| DEC-14 | La publicación de una innovación la hace el **profesor guía**, con un **aviso para confirmar**. | Christian, 23-oct-2026 | CAM-25 (sin cambio) |

### Decisiones nuevas de esta revisión

Aún no están escritas en el documento 06; se agregan cuando se actualice la especificación.

| ID | Qué dice | Fecha y origen | Reemplaza |
|---|---|---|---|
| DEC-15 | El cuestionario del marco teórico tiene **máximo 9 intentos** en 3 bloques: intentos 1 a 3 con nota máxima 7,0, 4 a 6 con 5,0 y 7 a 9 con 4,0. Si no aprueba en el intento 9, el Taller 1 **no se desbloquea** y el profesor guía debe habilitar al estudiante después de reunirse con él. | Christian, 24-oct-2026 (acepta C-01) | La parte "intentos ilimitados" de DEC-02 y de RN-06. Cierra PEND-01 en lo que se refiere al tope desde el intento 10. |

---

## Resumen

| ID | Pantalla | Cambio | Estado |
|---|---|---|---|
| CAM-01 | Landing | "Comprende" incluye relatar por escrito el incidente crítico | ✅ (redacción 🟡) |
| CAM-02 | Landing | "Analiza" pasa a ser el análisis desde la experiencia, los pares y la teoría | ✅ (redacción 🟡) |
| CAM-03 | Landing | "Reflexión con fundamento" incorpora la experiencia de quien vivió el incidente y el aporte de los pares | ✅ |
| CAM-04 | Landing | La IA entrega orientaciones "para profundizar el análisis", no "para pensar" | ✅ |
| CAM-05 | Inicio de sesión | Activación de cuenta por correo y creación de contraseña (sin registro abierto) | ✅ (no implementado) |
| CAM-06 | Mi progreso | Barra de avance de los talleres | 🟡 Mejora opcional |
| CAM-07 | Marco teórico | Bibliografía en norma APA preparada por la profesora (sin marco teórico redactado) | ✅ |
| CAM-08 | Marco teórico | Banco real de 30 preguntas basado en esa bibliografía | ✅ |
| CAM-09 | Marco teórico | Umbral de aprobación: 8 de 10 | ✅ Confirmado por Christian |
| CAM-10 | Marco teórico | Intentos por bloques: 3 con nota máx. 7,0, 3 con máx. 5,0, 3 con máx. 4,0; después bloqueo | ✅ Aceptado (DEC-15) |
| CAM-11 | Marco teórico | Tiempo de 15 minutos, ajustable | 🟡 |
| CAM-12 | Talleres | Títulos oficiales de los 4 talleres | ✅ (confirmar con documentos) |
| CAM-13 | Talleres | Bloques Objetivo, Actividad y Producto en los 4 talleres | ✅ |
| CAM-14 | Talleres | Pasos propios por taller; Taller 1 = "Ficha del incidente" con sus preguntas | ✅ |
| CAM-15 | Talleres | Producto de cada taller (Taller 1: ficha; Taller 2: matriz de análisis de contradicciones) | ✅ |
| CAM-16 | Talleres | Solo se abre el taller siguiente con el puntaje máximo de la rúbrica | ⚠️ |
| CAM-17 | Talleres | Misma lógica de intentos por bloques que el marco teórico | ⚠️ |
| CAM-18 | Talleres / El Impulso | La IA revisa con la rúbrica del taller y dice qué elemento falta | ✅ (GAP-07) |
| CAM-19 | Talleres | "Marco de referencia" por paso, a la derecha de la pantalla | ✅ |
| CAM-20 | Talleres | Quitar el "sustento teórico" del taller y renombrar la sección de lecturas | 🟡 |
| CAM-21 | Talleres | Banco sistematizado de prompts: puede quedar | 🟡 |
| CAM-22 | Talleres | El análisis incluye la opinión de los pares | 🟡 Alcance por decidir |
| CAM-23 | Panel docente | Plazos e intentos se adaptan a los bloques; desbloqueo manual tras agotarlos | ⚠️ |
| CAM-24 | Whitelist | Mantener Revocar/Restablecer y agregar "Eliminar definitivamente" con confirmación escribiendo el correo | ✅ (GAP-03) |
| CAM-25 | Innovaciones | Repositorio solo interno (estudiantes y docentes), no en la landing | ✅ Sin cambio |
| CAM-26 | Alcance de la IA | Costo de la IA en producción (pago o modelo propio) | 🟡 Pendiente |

---

## A. Landing page (página pública `/`)

Archivo: `src/views/landingpage/LandingPage.tsx`. Todo el contenido está en dos arreglos al inicio del archivo: `cycleSteps` (tarjeta "Tu ciclo reflexivo / Aprender de la práctica") y `projectPrinciples` (sección "El proyecto"). La profesora aprobó sin cambios el título, la descripción principal ("Perfecto, muy buena descripción"), la sección "Un proceso compartido, con roles distintos" y "Privacidad como prioridad".

Después de cambiar los textos, anotar el cambio en `docs/historial/LANDINGPAGE_CAMBIOS.md`.

### CAM-01. "Comprende" incluye relatar por escrito el incidente crítico

| | |
|---|---|
| **Qué cambia** | El paso 01 del ciclo reflexivo debe decir que, además de revisar conceptos, el estudiante **relata por escrito el incidente crítico**. Para la profesora, escribir el incidente es parte de comprenderlo. |
| **Dónde va** | `LandingPage.tsx` → `cycleSteps`, elemento con `number: '01'`, campo `description`. |
| **Texto actual** | "Revisa conceptos de reflexión profesional y fortalece tus bases antes de comenzar." |
| **Texto nuevo** (redacción propuesta) | "Revisa conceptos de reflexión profesional, fortalece tus bases y relata por escrito el incidente crítico que viviste en tu práctica." |
| **Lo que dijo la profesora** | "En el comprende, además de revisar los conceptos de reflexión profesional para fortalecer las bases, también es necesario el relato escrito del incidente crítico." Al escribir lo ocurrido en el aula se comprende mejor, porque se toma distancia de la emoción del momento. "El incidente crítico es parte del comprender." |
| **Conexiones** | RF-03 (asistente de redacción), RN-09 (estructura de talleres), PEND-09 (correspondencia del método R5 con los pasos, incluida la fase "Comprende"), glosario (Método R5). No tiene caso de uso propio (página pública). |
| **Estado** | ✅ Confirmado. 🟡 Redacción exacta por confirmar. Avanza en PEND-09: el relato escrito del incidente corresponde a "Comprende". |

### CAM-02. "Analiza" pasa a ser el análisis desde la experiencia, los pares y la teoría

| | |
|---|---|
| **Qué cambia** | Como la descripción del incidente pasa a "Comprende", el paso 02 debe hablar del **análisis** del incidente: con guía paso a paso, desde la experiencia de quien lo vivió, con la opinión de los pares y con referentes teóricos. |
| **Dónde va** | `LandingPage.tsx` → `cycleSteps`, elemento con `number: '02'`, campo `description`. |
| **Texto actual** | "Describe un incidente de tu práctica con una guía paso a paso y referencias teóricas." |
| **Texto nuevo** (redacción propuesta) | "Analiza el incidente crítico con una guía paso a paso que integra tu experiencia, la opinión de tus pares y referencias teóricas." |
| **Lo que dijo la profesora** | "Luego analiza el incidente crítico con una guía paso a paso, que incluye referencias teóricas, que incluye la experiencia de quien vivió el incidente y que incluye también la opinión de pares." |
| **Conexiones** | RF-03, RN-09, PEND-09. La "opinión de pares" conecta con CAM-22 (sección "Retroalimentación con pares" aún no disponible). |
| **Estado** | ✅ Confirmado. 🟡 Redacción exacta por confirmar. Los pasos 03 "Reflexiona" y 04 "Propón" no se comentaron: quedan igual. |

### CAM-03. "Reflexión con fundamento" incorpora la experiencia propia y la de los pares

| | |
|---|---|
| **Qué cambia** | El principio "Reflexión con fundamento" debe sumar la experiencia de quien vivió el incidente y el aporte de sus pares, "todo eso junto, conectado". |
| **Dónde va** | `LandingPage.tsx` → `projectPrinciples`, elemento `title: 'Reflexión con fundamento'`, campo `description`. |
| **Texto actual** | "Un recorrido estructurado conecta la experiencia en el aula con marcos teóricos y preguntas que profundizan el análisis." |
| **Texto nuevo** (redacción propuesta) | "Un recorrido estructurado conecta la experiencia en el aula con marcos teóricos y preguntas que profundizan el análisis, e incorpora la experiencia de quien vivió el incidente y el aporte de sus pares." |
| **Lo que dijo la profesora** | "La reflexión con fundamento es con marcos teóricos, súper bien. También con la experiencia de quien vivió, y con la experiencia que tienen los pares." |
| **Conexiones** | RF-03, CAM-22 (pares). |
| **Estado** | ✅ Confirmado (la frase final la dictó casi textual). |

### CAM-04. La IA entrega orientaciones "para profundizar el análisis", no "para pensar"

| | |
|---|---|
| **Qué cambia** | Se quita la idea de que la IA "orienta para pensar". La IA no piensa por el estudiante: entrega orientaciones para **profundizar el análisis** que él realiza. |
| **Dónde va** | `LandingPage.tsx` → `projectPrinciples`, elemento `title: 'Acompañamiento que orienta'`, campo `description`. |
| **Texto actual** | "La inteligencia artificial se concibe como apoyo formativo: entrega orientaciones para pensar, sin escribir la reflexión por ti." |
| **Texto nuevo** | "La inteligencia artificial se concibe como apoyo formativo: entrega orientaciones para profundizar el análisis que realizas, sin escribir la reflexión por ti." |
| **Lo que dijo la profesora** | "Entrega orientaciones, no para pensar, para profundizar el análisis que realizas. Y ahí, sin escribir la reflexión por ti." |
| **Otros lugares a revisar** | Es el único texto con "para pensar" en `src/`. El texto de `ImpulsePanel.tsx` ("La IA te orienta sobre qué elementos faltan en tu relato. Nunca lo redacta ni lo corrige por ti.") ya es coherente. |
| **Conexiones** | RF-02, RN-12 (la IA nunca redacta ni corrige), DEC-05 (el texto "Orientaciones para profundizar la reflexión profesional" del Lab 5 queda como descripción funcional). |
| **Estado** | ✅ Confirmado. |

---

## B. Inicio de sesión y activación de cuenta

### CAM-05. Activación de cuenta por correo, sin registro abierto

| | |
|---|---|
| **Qué cambia** | Se confirma el flujo: no hay botón "Registrarse"; solo el administrador ingresa los correos autorizados. Una vez autorizado, la persona **recibe un correo de activación** y **crea su contraseña** para la plataforma. No se conecta con la cuenta Microsoft de la universidad: el correo institucional solo se usa para que lleguen los mensajes. |
| **Dónde va** | Hoy no existe. `src/services/authService.ts` solo usa `signInWithEmailAndPassword` (las cuentas se crean a mano en Firebase). Haría falta: enviar el correo al registrar en la whitelist (`whitelistService.ts` / `AddEmailModal.tsx`, por ejemplo con el enlace de restablecer contraseña de Firebase Authentication) y una pantalla o enlace para crear la contraseña. En `LoginView.tsx` no debe aparecer un enlace de registro. |
| **Lo que dijo la profesora** | Aprobó ("Perfecto") que solo ella o el administrador ingresen los correos y que la persona active su cuenta desde el correo. El equipo indicó que "todavía falta configurar eso". |
| **Conexiones** | RF-08 (autenticación), RF-01 (whitelist), RN-01, RN-02, DEC-03 (`@ucen.cl`, confirmado de nuevo en la reunión), CU-01 (Iniciar sesión), CU-03 (Registrar un correo). Diagramas D1 y D2. |
| **Estado** | ✅ Confirmado, ❌ no implementado. Propuesta: registrar una brecha nueva (GAP-12 "Activación de cuenta por correo") y agregar a CU-03 un paso "El sistema envía el correo de activación"; evaluar un caso nuevo "Activar la cuenta" en D1. |

---

## C. Panel del estudiante ("Mi progreso")

La profesora aprobó que el primer paso obligatorio sea el marco teórico y que los talleres aparezcan bloqueados hasta aprobarlo ("Perfecto", "Súper bien"). También aprobó reemplazar la rueda interactiva por un panel con Taller 1 a Taller 4.

### CAM-06. Barra de avance de los talleres (mejora opcional)

| | |
|---|---|
| **Qué cambia** | El equipo propuso agregar "más adelante" una barra de avance para que se note el progreso; la profesora respondió "Perfecto". |
| **Dónde va** | `src/views/student-dashboard/StudentDashboardView.tsx` (sección de talleres) y/o `src/views/critical-incidents/components/WorkshopSelector.tsx`. |
| **Conexiones** | CU-09 (Consultar el progreso en el panel), RF-P01, RNF-04 (usabilidad), DEC-11 (la rueda 360° ya se descartó). Diagrama D5. |
| **Estado** | 🟡 Mejora opcional, no bloquea la entrega. |

---

## D. Marco teórico (`/estudiante/marco-teorico`)

Archivos: `src/views/theory-verification/TheoryQuizView.tsx`, `components/QuizEngine.tsx`, `components/ScoreCard.tsx`, `hooks/useTheoryQuiz.ts`, `src/services/theoryQuizService.ts` (banco de preguntas de ejemplo `q-01` a `q-30`) y `src/models/theoryQuiz.ts` (`DEFAULT_QUIZ_CONFIG`).

### CAM-07. Bibliografía en norma APA preparada por la profesora

| | |
|---|---|
| **Qué cambia** | El marco teórico **no** será un texto redactado dentro de la plataforma. La profesora preparará una **bibliografía en norma APA** que da sustento teórico. El estudiante debe **buscar y leer** esos artículos por su cuenta ("para que también hagan ese ejercicio de buscar") antes de rendir la evaluación. |
| **Dónde va** | `TheoryQuizView.tsx`: agregar, antes del botón "Comenzar evaluación", una sección "Bibliografía" con la lista de referencias APA. Los datos pueden ir en un archivo propio (por ejemplo `src/views/theory-verification/data/bibliography.ts`) o en Firestore si la profesora los editará. |
| **Valores** | Lista de referencias APA (las enviará la profesora). |
| **Lo que dijo la profesora** | "Puedo preparar una bibliografía que les dé sustento teórico para que ellos vayan, busquen […] Lo configuro con norma APA. […] Eso me gustaría más que yo preparar un marco teórico." |
| **Conexiones** | RF-04, RN-07, GAP-04, DEC-07 (RF-NEW-03), CU-07 (Estudiar el marco teórico), diagrama D3, HU-04. |
| **Estado** | ✅ Confirmado. ⚠️ Detalle: RN-07 y CU-07 dicen "con enlaces DOI", pero la profesora quiere que el estudiante busque los artículos. Ver duda D-05. |

### CAM-08. Banco real de 30 preguntas

| | |
|---|---|
| **Qué cambia** | Las 30 preguntas de ejemplo se reemplazan por 30 preguntas que la profesora redactará a partir de la bibliografía de CAM-07. Se mantiene que cada intento toma 10 al azar. |
| **Dónde va** | `src/services/theoryQuizService.ts`, arreglo del banco (`q-01` a `q-30`). Cada pregunta usa el tipo `QuizQuestion` de `models/theoryQuiz.ts` (`statement`, `options`, `correctOptionId`, `explanation`). |
| **Conexiones** | RF-04, RN-05, CU-08 (Rendir la evaluación diagnóstica), HU-04. |
| **Estado** | ✅ Confirmado. Depende del material de la profesora. |

### CAM-09. Umbral de aprobación: 8 de 10

| | |
|---|---|
| **Qué cambia** | Se debe pasar de 7 a 8 respuestas correctas, como ya dice DEC-01. |
| **Dónde va** | `src/models/theoryQuiz.ts` → `DEFAULT_QUIZ_CONFIG.passingScore: 7` pasa a `8` (y actualizar el comentario de `QuizConfig.passingScore`). Los textos de `TheoryQuizView.tsx` y `ScoreCard.tsx` leen el valor de la configuración, no hay que tocarlos. |
| **Lo que dijo la profesora** | Ante "¿al menos 7 de 10?" respondió "No, 8", y luego "No, 7 […] 7, 8, ya. Más o menos." La transcripción es ambigua. |
| **Conexiones** | RF-04, RN-05, DEC-01, GAP-01, CU-08. |
| **Estado** | ✅ Confirmado por Christian (24-oct-2026): se aprueba con **8 de 10**. Se mantiene DEC-01 sin cambios. |

### CAM-10. Intentos por bloques y bloqueo al agotarlos

| | |
|---|---|
| **Qué cambia** | Los intentos dejan de ser 3 fijos (código) o ilimitados (DEC-02). La profesora definió **3 bloques de 3 intentos**: intentos 1 a 3 con nota máxima **7,0**; si no aprueba, intentos 4 a 6 con nota máxima **5,0**; si tampoco, intentos 7 a 9 con nota máxima **4,0**. Si no aprueba en el intento 9, **no se desbloquea el Taller 1** y el estudiante debe reunirse con la profesora. Se descarta la idea anterior de mostrarlo como reprobado y desbloquear igual. |
| **Dónde va** | `src/models/theoryQuiz.ts`: `DEFAULT_QUIZ_CONFIG.maxAttempts: 3` pasa a 9 y se agrega la escala de nota máxima por bloque (por ejemplo `gradeCaps: [{ fromAttempt: 1, maxGrade: 7.0 }, { fromAttempt: 4, maxGrade: 5.0 }, { fromAttempt: 7, maxGrade: 4.0 }]`). `theoryQuizService.ts`: calcular la nota con tope. `TheoryQuizView.tsx` y `ScoreCard.tsx`: mostrar en qué bloque está y la nota máxima posible, y cambiar el mensaje final "Has agotado tus {maxAttempts} intentos. Contacta a tu profesor guía para recibir orientación." por uno que diga que debe reunirse con su profesor guía para que lo habilite. |
| **Lo que dijo la profesora** | "Estoy pensando en alguien que no logra hacerlo […] si se les desbloquea, les va a dar lo mismo intentar […] Necesito que no se les desbloquee." "3 oportunidades para rendir la evaluación; si no lo logra, 3 más con nota máxima un 5; si no lo logra, 3 más con nota máxima un 4, y ahí tendrá que [reunirse conmigo]." |
| **Conexiones** | RF-04, RN-06, DEC-02, GAP-02, GAP-09, PEND-01 (el tope "desde el intento 10" deja de existir: no hay intento 10), CU-08, diagrama D3. Conecta con CAM-23 (habilitación manual por el docente). |
| **Estado** | ✅ Aceptado por Christian (24-oct-2026) al resolver el conflicto C-01: queda registrado como **DEC-15**, que reemplaza la parte "intentos ilimitados" de DEC-02. Las notas máximas por bloque (7,0 / 5,0 / 4,0) se mantienen. Falta saber cómo se calcula la nota dentro del tope (PEND-01, duda D-03) y cómo habilita el docente al estudiante bloqueado (duda D-02). |

### CAM-11. Tiempo de 15 minutos, ajustable

| | |
|---|---|
| **Qué cambia** | Se mantienen 15 minutos; la profesora dijo que "lo puede ir ajustando". |
| **Dónde va** | Hoy fijo en `DEFAULT_QUIZ_CONFIG.timeLimitSeconds = 15 * 60`. Si el docente lo ajustará, agregar el campo a la tarjeta del marco teórico en `src/views/work-pacing/components/ActivityPacingCard.tsx` y a `models/workPacing.ts`. |
| **Conexiones** | RF-04, RF-06, CU-15 (Configurar plazos e intentos). |
| **Estado** | 🟡 Los 15 minutos están confirmados; el ajuste por el docente es opcional (duda D-08). |

**Sin cambio:** la pantalla de resultado muestra el porcentaje (por ejemplo 100%); ante la pregunta de si mostrar nota 7,0 o porcentaje, la profesora respondió "No, está bien". Cuando exista la nota con tope (CAM-10), conviene mostrar ambos.

---

## E. Talleres (`/estudiante/talleres/:workshopId`)

Archivos principales: `src/services/criticalIncidentService.ts` (`WORKSHOP_DEFINITIONS` con títulos y descripciones, y `REFERENCES`), `src/models/criticalIncident.ts` (`INCIDENT_STEPS`, los 4 pasos iguales para todos los talleres), `src/views/critical-incidents/components/IncidentWizard.tsx` (secciones del taller), `TheoryReferenceSidebar.tsx`, `ImpulsePanel.tsx`, `src/utils/impulseGenerator.ts` y `src/models/workshopStructure.ts` (secciones configurables por el docente, RF-P02).

La profesora va a reenviar los documentos de los 4 talleres al Drive compartido con un formato único (ver [material](#material-que-enviará-la-profesora)). Varios cambios de esta sección dependen de ese material.

### CAM-12. Títulos oficiales de los 4 talleres

| | |
|---|---|
| **Qué cambia** | Los talleres son siempre 4 (no aumentarán). Cada uno debe mostrar su nombre oficial en vez de los temas actuales. |
| **Dónde va** | `criticalIncidentService.ts` → `WORKSHOP_DEFINITIONS`, campos `topic` y `subtitle` de cada taller (hoy: "Contexto e inicio del incidente", "Descripción del hecho y actores", "Relevancia pedagógica y dilema", "Propuesta de innovación y cambio"). |
| **Valores** (según la reunión) | Taller 1: **Identificación del incidente crítico**. Taller 2: **Del aula a la transformación profesional** (la profesora también lo describió como "pasar de la descripción a la construcción analítica"). Taller 3: **Confrontación teórica**. Taller 4: **Transformación de la práctica e innovación pedagógica** (se dictó "Transformación de la práctica de innovación pedagógica"). |
| **Conexiones** | RF-03, RN-09, GAP-11, CU-10 (Redactar el relato de un taller), diagrama D4. |
| **Estado** | ✅ Confirmado. 🟡 Copiar los nombres exactos de los documentos que enviará la profesora. |

### CAM-13. Objetivo, Actividad y Producto en los 4 talleres

| | |
|---|---|
| **Qué cambia** | Cada taller debe mostrar tres bloques separados: **Objetivo**, **Actividad** y **Producto**, para que el estudiante los distinga. El Taller 4 hoy no tiene objetivo; la profesora lo redactará. |
| **Dónde va** | `IncidentWizard.tsx`, sección `case 'objectives-context'` (hoy un solo bloque "Objetivo y contexto" con `workshop.description` y `workshop.topic`): reemplazar por tres bloques. En el modelo `Workshop` (`models/criticalIncident.ts`) agregar los campos `objective`, `activity` y `product`, y llenarlos en `WORKSHOP_DEFINITIONS`. Si el docente puede editarlos, también en `models/workshopStructure.ts` (`WORKSHOP_SECTIONS`) y `WorkshopStructureView.tsx`. |
| **Lo que dijo la profesora** | "Cada taller tiene objetivo, actividad y producto, y ellos tienen que diferenciarlo." "Te voy a colocar el objetivo del 4 para que todos tengan objetivo, actividad y producto." |
| **Conexiones** | RF-03, RN-09, GAP-11, RF-P02, CU-10, CU-16 (Configurar la estructura de un taller). |
| **Estado** | ✅ Confirmado. Cierra la parte "bloques Objetivo/Actividad/Producto" de GAP-11 cuando se implemente. |

### CAM-14. Pasos propios por taller; el Taller 1 es la "Ficha del incidente"

| | |
|---|---|
| **Qué cambia** | Hoy todos los talleres usan los mismos 4 pasos (Contexto, Descripción del hecho, Actores e influencia, Relevancia pedagógica). La profesora dijo que **cada taller es distinto** y que sus pasos salen de su documento. En el Taller 1, el formulario es la **"Ficha del incidente"** (título "Identificación del incidente crítico") y se completa respondiendo preguntas guía. |
| **Dónde va** | `models/criticalIncident.ts` → `INCIDENT_STEPS` (pasos fijos) debe pasar a ser una lista de pasos **por taller**. La estructura configurable (`WorkshopFormSchema.guidingQuestions` en `models/workshopStructure.ts`, `ConfiguredIncidentStepForm.tsx`) ya permite pasos dinámicos y puede servir de base. Título del formulario del Taller 1: "Ficha del incidente". |
| **Valores del Taller 1** (preguntas que leyó la profesora) | 1. ¿Qué ocurrió? 2. ¿Quiénes participaron? 3. ¿Por qué fue significativo? 4. ¿Qué emoción generó? / ¿Qué sentí? 5. ¿Qué querían los estudiantes? |
| **Lo que dijo la profesora** | "Hay que poner ficha del incidente […] Tienen que copiar lo textual." "Tienen que completar la ficha respondiendo a estas preguntas." "En el Taller 1 tiene como producto escribir una ficha con todos estos elementos." |
| **Conexiones** | RF-03, RN-09 (hoy fija las 4 secciones del relato: hay que reescribirla), GAP-11, RF-P02, CU-10, CU-11 (la detección de datos sensibles revisa todos los pasos), CU-12, glosario (agregar "Ficha del incidente"). `impulseGenerator.ts` también usa `INCIDENT_STEPS`. |
| **Estado** | ✅ Confirmado para el Taller 1. Los pasos de los talleres 2, 3 y 4 vienen en los documentos de la profesora. ⚠️ Cambia RN-09. |

### CAM-15. Producto de cada taller

| | |
|---|---|
| **Qué cambia** | Cada taller entrega un producto distinto que la IA revisa con la rúbrica. Taller 1: **ficha** del incidente con todos sus elementos. Taller 2: **matriz de análisis de contradicciones**. Talleres 3 y 4: según sus documentos. |
| **Dónde va** | Bloque "Producto" de CAM-13. Para la matriz del Taller 2 ya existe `ConfiguredMatrixForm.tsx` (filas configurables en `formSchema.matrixRows`). |
| **Conexiones** | RF-03, RN-09, CU-10, CU-16. |
| **Estado** | ✅ Confirmado para los talleres 1 y 2. |

### CAM-16. Solo se abre el taller siguiente con el puntaje máximo de la rúbrica

| | |
|---|---|
| **Qué cambia** | Cada taller se revisa con su rúbrica, y el siguiente **solo se abre si el estudiante obtiene el puntaje máximo** (equivale a nota 7,0), porque eso indica que su texto tiene "todos los elementos constitutivos" de esa etapa. Ejemplo: la rúbrica del Taller 1 tiene **24 puntos**; con 24 pasa al Taller 2. |
| **Dónde va** | Lógica de desbloqueo en `src/hooks/useWorkshops.ts` / `src/services/studentProgressService.ts` y estado del taller en `criticalIncidentService.ts`. Rúbricas: sección `evaluation-rubric` de `IncidentWizard.tsx` y la configuración docente. |
| **Lo que dijo la profesora** | "No se le puede abrir el taller siguiente si no tiene perfecto el taller uno, no se le puede abrir el dos, y así sucesivamente." "24 puntos puede pasar al taller dos." Sobre la nota: "Si yo la coloco, no hay problema", pero "me interesa que el estudiante vaya incorporando todos los elementos necesarios para pasar a la etapa siguiente". |
| **Conexiones** | RF-06, RN-08, RN-14, RN-15, RN-16, DEC-12, DEC-13, GAP-05, CU-13 (Cerrar un taller por intentos agotados o plazo vencido), CU-14 (Revisar y validar una reflexión). Diagramas D4 y D6. |
| **Estado** | ⚠️ Conflicto con RN-14 y DEC-12 (hoy se avanza también al agotar intentos) y con RN-15 / DEC-13 (al vencer el plazo se abre el siguiente). Ver conflictos C-03 y C-04 y duda D-01 (quién decide el 100%: la IA o el docente). |

### CAM-17. Misma lógica de intentos por bloques en los talleres

| | |
|---|---|
| **Qué cambia** | Los talleres siguen la misma lógica que el marco teórico (CAM-10): 3 intentos para lograr el 100% con nota máxima 7,0; si no, el estudiante "reacomoda el texto" y tiene 3 intentos más con nota máxima 5,0; si no, 3 más con nota máxima 4,0. En cada intento la IA debe decirle qué le falta (por ejemplo, "le falta describir el contexto"). |
| **Dónde va** | `models/criticalIncident.ts` (`DEFAULT_WORKSHOP_CONFIG.maxAttemptsPerWorkshop: 3`), `hooks/useImpulse.ts` (contador e `isExhausted`), `ImpulsePanel.tsx` (mostrar bloque y nota máxima), `DraftManager.tsx` (contador de intentos). |
| **Lo que dijo la profesora** | "Y para todos los talleres, la misma lógica." "Si no lo logra el 100% la primera […] tiene una nueva posibilidad de reacomodar el texto […] con nota máxima un 5; si no lo logra, reacomoda el texto, con nota máxima un 4." |
| **Conexiones** | RF-06, RN-11, RN-14, DEC-02 (dice que la escala aplica **solo** al cuestionario), DEC-11 (3 intentos por taller), DEC-12, CU-12, CU-13, CU-15. |
| **Estado** | ⚠️ Conflicto con DEC-02 y DEC-11. Ver conflicto C-02. |

### CAM-18. "El Impulso" revisa con la rúbrica del taller

| | |
|---|---|
| **Qué cambia** | Se confirma que el impulso solo se puede pedir después de completar todas las preguntas del taller (ya funciona así). Las orientaciones deben salir de los **elementos de la rúbrica** de cada taller y decir qué elemento falta, en lugar de las reglas genéricas actuales. |
| **Dónde va** | `src/utils/impulseGenerator.ts` (hoy simulado con reglas por paso) y, cuando exista, la llamada a la IA real en `src/services/openRouterService.ts` con la rúbrica del taller en el prompt. |
| **Lo que dijo la profesora** | "Lo que yo quiero es que la IA se apoye en esos elementos constitutivos, a través de esa rúbrica." Preguntó si las orientaciones de la demo salían de la pauta; el equipo explicó que eran simulación. |
| **Conexiones** | RF-02, RN-12, RN-16, GAP-07, DEC-12, CU-12 (Solicitar un impulso), CU-14. |
| **Estado** | ✅ Confirmado. No implementado (GAP-07). Depende de las rúbricas de cada taller. |

### CAM-19. "Marco de referencia" por paso, al lado derecho

| | |
|---|---|
| **Qué cambia** | Cada paso de cada taller tiene su propio **marco de referencia** (lecturas que ayudan a analizar ese paso), y debe verse **a la derecha de la pantalla**. La profesora los redactará al final de cada documento de taller. |
| **Dónde va** | `IncidentWizard.tsx`: hoy el panel de referencias se dibuja como una sección más dentro del flujo (`case 'theory-framework'`), aunque el comentario del archivo dice que en pantallas anchas va a la derecha. Hay que dejar el formulario a la izquierda y `TheoryReferenceSidebar` fijo a la derecha en pantallas anchas (en móvil, plegable debajo del formulario). Contenido: `REFERENCES` en `criticalIncidentService.ts` (hoy parafraseos provisionales marcados "[POR DEFINIR]"), indexado por taller y por paso. |
| **Lo que dijo la profesora** | "Te voy a escribir en cada uno de los talleres la referencia que va al lado derecho." "Marcos de referencia de cada taller […] para colocar al lado derecho de ReflexIA." |
| **Conexiones** | RF-03 ("panel lateral derecho de referencias"), RN-09, GAP-11, CU-10. |
| **Estado** | ✅ Confirmado. Cierra la parte "panel a la derecha" de GAP-11 cuando se implemente. |

### CAM-20. Quitar el "sustento teórico" del taller y renombrar la sección de lecturas

| | |
|---|---|
| **Qué cambia** | La profesora sugirió quitar del taller el texto de "sustento teórico" (la fundamentación teórica que traen algunos documentos de taller), porque lo teórico se trabaja en el marco teórico. Lo que queda en el taller es el marco de referencia de CAM-19. Para evitar confusión con el módulo "Marco teórico", conviene renombrar la sección. |
| **Dónde va** | `IncidentWizard.tsx` (encabezado de `case 'theory-framework'`) y `models/workshopStructure.ts` (`label` de `theory-framework`): "Marco teórico con lecturas que ayudarán a resolver el taller" pasa a **"Marco de referencia"** (redacción propuesta). |
| **Lo que dijo la profesora** | "Este sustento teórico quizás deberíamos sacarlo, porque eso [va] al marco teórico." El equipo respondió que existe el apartado "marco de referencia" con lecturas que ayudan a analizar los pasos, y ella lo aceptó. |
| **Conexiones** | RF-03, RF-04, CU-07, CU-10, CU-16, glosario (diferenciar "marco teórico" y "marco de referencia"). |
| **Estado** | 🟡 La transcripción es ambigua ("eso no va a ir al marco teórico"). Confirmar (duda D-06). |

### CAM-21. Banco sistematizado de prompts

| | |
|---|---|
| **Qué cambia** | La profesora había pedido un "banco sistematizado de prompts utilizados". Primero dijo "eso no va" y luego "podría ser, sí, por qué no". |
| **Dónde va** | Sección `prompt-bank` de `IncidentWizard.tsx` y `models/workshopStructure.ts` ("Banco de prompts y análisis"), que ya existe y el docente puede activar o desactivar. |
| **Conexiones** | RF-P02, CU-16. |
| **Estado** | 🟡 Se mantiene como sección opcional configurable. Sin cambio de código por ahora. |

### CAM-22. El análisis incluye la opinión de los pares

| | |
|---|---|
| **Qué cambia** | La profesora insistió en que el análisis incluye la opinión de los colegas (pares). Hoy la sección "Retroalimentación con pares" existe pero muestra "aún no está disponible en la plataforma". |
| **Dónde va** | `IncidentWizard.tsx`, `case 'peer-feedback'`. |
| **Conexiones** | RF-03, CAM-02, CAM-03. No hay requisito ni caso de uso para esto: si entra al alcance, sería un requisito nuevo (RF-P03) y un caso nuevo en D4. |
| **Estado** | 🟡 Por decidir si se implementa en la plataforma o si la opinión de pares ocurre fuera (en clase) y el estudiante la registra en su texto (duda D-07). |

---

## F. Panel docente (`/docente`)

La profesora aprobó el panel de seguimiento, la vista de reflexiones con la nota sugerida por la IA y la edición de la nota oficial ("Ah, súper bueno"), la configuración de plazos del marco teórico y de cada taller, y la vista de innovaciones. También le pareció bien que todo sea responsive (RNF-03).

### CAM-23. Plazos e intentos adaptados a los bloques; habilitación manual

| | |
|---|---|
| **Qué cambia** | La pantalla "Plazos e intentos" hoy permite de 1 a 3 intentos por actividad. Con los bloques de CAM-10 y CAM-17 cambia lo que se configura (¿intentos por bloque?, ¿número de bloques?). Además, si un estudiante agota los 9 intentos sin aprobar queda bloqueado y debe reunirse con la profesora: hace falta una acción del profesor guía para **habilitarlo** (dar más intentos o desbloquear la siguiente etapa). |
| **Dónde va** | `src/views/work-pacing/` (`ActivityPacingCard.tsx`, `DeadlinesView.tsx`), `models/workPacing.ts` (`PACING_LIMITS = { minAttempts: 1, maxAttempts: 3 }`). La habilitación manual podría ir en el detalle del estudiante del panel docente (`src/views/teacher-dashboard/`) o en "Reflexiones". |
| **Lo que dijo la profesora** | "Necesitan reunirse conmigo." Ante "¿y eso igual lo desbloquea usted, cierto?" respondió "Sí". |
| **Conexiones** | RF-06, RN-11, RN-14, DEC-11, CU-15 (Configurar plazos e intentos), CU-17 (Seguir el avance). Posible caso nuevo: **"Habilitar a un estudiante bloqueado"** (Profesor guía) en D6. |
| **Estado** | ⚠️ Para el marco teórico ya rige DEC-15 (C-01 aceptado); para los talleres depende de C-02. Ver duda D-02. |

---

## G. Administración de la whitelist (`/admin/whitelist`)

### CAM-24. Mantener Revocar/Restablecer y agregar "Eliminar definitivamente"

| | |
|---|---|
| **Qué cambia** | Primero la profesora pidió eliminar en vez de revocar ("revocado no me sirve", los estudiantes que terminan o dejan la asignatura se eliminan). El equipo propuso mantener **Revocar** y **Restablecer** (por si hay un error) y agregar al lado **"Eliminar definitivamente"** con más pasos de confirmación, por ejemplo **escribir el correo** del usuario para confirmar. La profesora aceptó ("Mejor, porque me puedo equivocar") y pidió mantener también la revocación, porque deja registro de quién estuvo. |
| **Dónde va** | `src/views/admin-whitelist/components/WhitelistTable.tsx`: nuevo botón "Eliminar definitivamente" junto a "Revocar"/"Restablecer". Nuevo modal (por ejemplo `DeleteAccessModal.tsx`, basado en `RevokeAccessModal.tsx`) con: 1) advertencia de que no se puede deshacer; 2) campo para escribir el correo exacto, con el botón de confirmar deshabilitado hasta que coincida. `hooks/useWhitelist.ts` y `services/whitelistService.ts`: función para borrar el documento de la colección `whitelist`. |
| **Valores** | Confirmación escribiendo el **correo** (la profesora mencionó "el nombre del estudiante o el correo"; el correo es único y más seguro). |
| **Conexiones** | RF-01, RN-03, RN-04, DEC-07 (RF-NEW-01), GAP-03, CU-05 (Revocar o restablecer un acceso), CU-06 (Eliminar definitivamente a un usuario, cuyo paso 5 ya propone "volver a escribir el correo"), diagrama D2, HU-01. |
| **Estado** | ✅ Confirmado. Coincide con RN-03 y CU-06; no hay conflicto. Solo fijar en CU-06 que la segunda confirmación es escribir el correo. Duda menor D-09: ¿la eliminación aplica solo a estudiantes (como dice CU-06) o a cualquier rol? |

**Sin cambio:** dominio único `@ucen.cl` (DEC-03), los tres roles, que un administrador pueda crear otro administrador, los filtros por estado y el resumen de accesos.

---

## H. Repositorio de innovaciones

### CAM-25. Solo interno por ahora

| | |
|---|---|
| **Qué cambia** | Nada en el código. Se confirma que las innovaciones (trabajos destacados) se ven **solo dentro de la plataforma**, para estudiantes y docentes, y **no** en la landing pública "de momento". Se aprobó el filtro por estrategia. |
| **Dónde va** | `src/views/innovations/` (rutas `/estudiante/innovaciones` y `/docente/innovaciones`). No agregar una sección de innovaciones a `LandingPage.tsx`. |
| **Conexiones** | RF-07, RN-18, DEC-04, DEC-14, CU-18, CU-19, diagrama D7. |
| **Estado** | ✅ Confirmado, sin cambio. Anotar en 01 (visión y alcance) que la publicación externa queda fuera por ahora. |

---

## I. Alcance de la IA

### CAM-26. Costo de la IA en producción

| | |
|---|---|
| **Qué cambia** | El equipo explicó que la IA usa un servicio gratuito (OpenRouter) cuyos tokens se agotan rápido y que en la demo la detección de datos sensibles no alcanzó a responder. Si el proyecto se usa de verdad, hay que pagar un servicio de IA o montar un modelo propio. La profesora lo aceptó como tema pendiente. |
| **Dónde va** | `src/services/openRouterService.ts` (rotación de modelos gratuitos). Documentar en 01 (visión y alcance) como riesgo y supuesto de la versión 1.0. |
| **Conexiones** | RF-02, RF-05, RNF-01 (≤ 2 s), RNF-05 (≤ 10 s), GAP-06, GAP-07, CU-11, CU-12. |
| **Estado** | 🟡 Pendiente de financiamiento. Propuesta: registrar PEND-11 "Proveedor y costo de la IA en producción". |

---

## Conflictos con decisiones vigentes

| ID | Decisión o regla vigente | Lo que dijo la profesora | Propuesta |
|---|---|---|---|
| C-01 | **DEC-02 / RN-06**: intentos del cuestionario ilimitados, nota máxima por bloques (1-3: 7,0; 4-6: 5,0; 7-9: 4,0). | Máximo 9 intentos en 3 bloques; al fallar el 9 no se desbloquea y debe reunirse con ella. | Reemplazar "ilimitados" por "máximo 9, luego habilitación manual del profesor guía". Las notas por bloque se mantienen. Cierra PEND-01 en la parte "desde el intento 10". **✅ Aceptada por Christian (24-oct-2026) → DEC-15.** |
| C-02 | **DEC-02**: la escala por bloques aplica **solo al cuestionario**. **DEC-11 / RN-11**: 3 intentos por taller (modificables de 1 a 3). | "Para todos los talleres, la misma lógica": 3 + 3 (máx. 5,0) + 3 (máx. 4,0). | Extender la escala a los talleres y redefinir DEC-11 y RN-11. |
| C-03 | **RN-14 / DEC-12**: se avanza al taller siguiente con 7,0 **o al agotar los intentos**, quedando la nota más alta. | "No se le puede abrir el taller siguiente si no tiene perfecto el taller uno." "Necesito que no se les desbloquee." | Avanzar **solo** con el puntaje máximo; al agotar los 9 intentos, bloqueo y habilitación manual. La "nota más alta" sigue sirviendo como nota registrada. |
| C-04 | **RN-15 / DEC-13**: al vencer el plazo, el taller se cierra solo, queda la nota más alta o 1,0, y **se abre el siguiente**. | No habló del plazo vencido, pero rechazó cualquier desbloqueo sin el 100%. | Mantener el cierre automático y la nota, pero **no abrir** el taller siguiente. Confirmar con la profesora (duda D-02). |
| C-05 | **RN-09**: el relato tiene 4 secciones fijas (Contexto, Descripción del hecho, Actores e influencia, Relevancia pedagógica) en todos los talleres. | Cada taller es distinto; el Taller 1 es una ficha con 5 preguntas propias. | Reescribir RN-09: cada taller define sus pasos según su documento. |
| C-06 | **RN-07 / CU-07**: lista APA **con enlaces DOI**. | Bibliografía APA; los estudiantes buscan los artículos. | Mostrar la referencia APA; DOI o enlace solo si la profesora lo incluye (duda D-05). |

Nota: la profesora **no** contradijo DEC-12 en cuanto a la nota: aceptó que la IA sugiera y que ella ponga la nota final ("Si yo lo coloco, no hay problema"). Tampoco hay conflicto en la whitelist: lo pedido coincide con RN-03 y CU-06.

## Dudas abiertas para Christian

Cada duda trae una recomendación para avanzar si no hay respuesta.

| ID | Pregunta | Recomendación |
|---|---|---|
| D-01 | ¿Quién decide que el taller está "perfecto" para abrir el siguiente: el puntaje máximo de la IA según la rúbrica, o la nota 7,0 que valida el profesor guía? | Que lo abra la nota 7,0 validada por el profesor guía (DEC-12 ya dice que la nota oficial es del docente) y que la IA solo indique qué falta. |
| D-02 | Cuando se agotan los 9 intentos o vence el plazo, ¿cómo se habilita al estudiante? ¿El profesor guía le da más intentos, le abre el siguiente taller, o ambas? | Agregar una acción "Habilitar" en el panel docente que abra la siguiente etapa con la nota registrada, y un caso de uso nuevo en D6. |
| D-03 | ¿Cómo se calcula la nota del cuestionario dentro del tope del bloque (PEND-01)? Por ejemplo, 8/10 en el intento 5: ¿5,0 o una escala hasta 5,0? | Nota = mínimo entre la nota por aciertos (escala 1,0 a 7,0) y el tope del bloque. |
| ~~D-04~~ | ~~¿El umbral es 8 o 7 de 10?~~ | **Resuelta:** 8 de 10 (Christian, 24-oct-2026; se mantiene DEC-01). |
| D-05 | ¿La bibliografía lleva enlaces (DOI) o solo la referencia APA para que el estudiante busque? | Mostrar el enlace solo cuando la profesora lo incluya; no exigir DOI. |
| D-06 | ¿Se quita del taller el "sustento teórico" de los documentos? | Sí: en el taller solo queda Objetivo, Actividad, Producto, pasos y Marco de referencia. |
| D-07 | ¿La opinión de los pares se hace dentro de la plataforma? | Dejarlo fuera de la versión 1.0 y registrarlo como evolución prevista; el estudiante la incorpora en su texto. |
| D-08 | ¿El profesor guía podrá ajustar los 15 minutos del cuestionario? | Sí, como campo opcional en "Plazos e intentos". |
| D-09 | ¿"Eliminar definitivamente" aplica solo a estudiantes o a cualquier rol? | Solo estudiantes, como dice CU-06. |
| D-10 | DEC-11 a DEC-13 son del 22 y 23 de octubre. Si la entrevista fue antes (se menciona el día 14), ¿se mantienen esas decisiones o prevalece lo dicho por la profesora? | Prevalece la stakeholder en lo pedagógico; registrar decisiones nuevas (DEC-15 en adelante) que reemplacen lo necesario. |

## Material que enviará la profesora

Estos cambios no se pueden terminar hasta recibirlo. Lo subirá al Drive compartido del proyecto (carpeta "Reflexión…"), borrando la versión anterior para evitar confusiones.

| Material | Cambios que dependen |
|---|---|
| Documentos de los 4 talleres con el mismo formato (Objetivo, Actividad, Producto) y el objetivo nuevo del Taller 4 | CAM-12, CAM-13, CAM-14, CAM-15 |
| Rúbrica de cada taller (el Taller 1 tiene 24 puntos) | CAM-16, CAM-18 |
| Marco de referencia de cada paso de cada taller (al final de cada documento) | CAM-19 |
| Bibliografía del marco teórico en norma APA | CAM-07 |
| 30 preguntas basadas en esa bibliografía | CAM-08 |

## Impacto en la especificación

Qué habría que actualizar cuando Christian apruebe los cambios (no se ha tocado ninguno):

| Documento | Cambios |
|---|---|
| 01 Visión y alcance | Innovaciones solo internas (CAM-25); riesgo de costo de la IA (CAM-26); opinión de pares como evolución prevista si se decide (CAM-22). |
| 02 Glosario | Fases del método R5: "Comprende" incluye el relato escrito del incidente y "Analiza" el análisis desde experiencia, pares y teoría (CAM-01, CAM-02). Nuevos términos: "Ficha del incidente", "Marco de referencia" (distinto de "Marco teórico"), "Bloque de intentos". |
| 04 Requisitos | RF-03 (pasos por taller, Objetivo/Actividad/Producto, panel derecho), RF-04 (9 intentos en bloques, bibliografía APA), RF-06 (avance solo con 100%, habilitación manual), RF-08 (activación por correo). Posibles RF-P03 (pares) y requisito de habilitación docente. |
| 05 Reglas de negocio | RN-06, RN-07, RN-09, RN-11, RN-14, RN-15 (ver conflictos C-01 a C-06). |
| 06 Decisiones, brechas y pendientes | Agregar DEC-15 (C-01) y las decisiones que resulten de C-02 a C-06; cerrar PEND-01 (parte del intento 10) y PEND-09 (Comprende/Analiza); nuevas brechas GAP-12 (activación de cuenta) y la de habilitación manual; PEND-11 (costo de la IA). |
| 07 Trazabilidad | Agregar los cambios a las filas de RF-01, RF-03, RF-04, RF-06 y RF-08. |
| 08 Plan de casos de uso | Agregar al catálogo los casos nuevos si se aprueban ("Activar la cuenta" en D1, "Habilitar a un estudiante bloqueado" en D6). |
| 09 Diagramas | D1 (activar cuenta), D3 (CU-08 con bloqueo al intento 9), D4 (CU-13 sin apertura automática del siguiente taller), D6 (habilitación manual). |
| 10 Casos de uso | CU-03 (envío del correo de activación), CU-06 (segunda confirmación = escribir el correo), CU-07 (bibliografía APA sin DOI obligatorio), CU-08 (bloques de intentos y bloqueo), CU-10 (pasos por taller, ficha del incidente, Objetivo/Actividad/Producto), CU-12 (impulso con rúbrica y bloques), CU-13 (no abre el siguiente taller), CU-15 (configuración por bloques), CU-16 (secciones Objetivo/Actividad/Producto y Marco de referencia). |
| Otros | `AI_GUIDELINES.md` y guías `HU03_GUIA.md`, `HU04_GUIA.md`, `HU06_GUIA.md` (intentos y pasos), `docs/historial/LANDINGPAGE_CAMBIOS.md` (textos de la landing). |
