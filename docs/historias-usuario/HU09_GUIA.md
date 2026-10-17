# HU-09 — Configuración de la estructura de talleres

## Objetivo

Permitir que un profesor guía configure por separado la estructura formativa de
los talleres 1 a 4, reordene y active secciones, defina el mecanismo de entrada,
edite preguntas y revise una previsualización antes de guardar.

## Interfaz

La vista `/docente/estructura-talleres` vive dentro de `TeacherLayout`. El
selector de talleres cambia el documento que se está editando sin compartir
estado entre talleres. La vista permite:

- Activar/desactivar y ordenar las secciones. La plantilla predeterminada es:
  Objetivo y contexto → Rúbrica y escala de evaluación → Reconstrucción del
  incidente → Banco de prompts y análisis → Marco teórico con lecturas que
  ayudarán a resolver el taller → Retroalimentación con pares.
- Reordenarlas con controles accesibles para mover arriba/abajo.
- Elegir texto o relato descriptivo, o preguntas de alternativas.
- En el formato de alternativas, combinar preguntas de selección múltiple con
  respuesta abierta, y editar enunciados, alternativas y respuesta correcta.
- Importar preguntas de alternativas mediante un CSV; se agregan al final de
  las preguntas ya configuradas. El CSV no crea preguntas abiertas.
- Previsualizar las secciones activas y el formato seleccionado.
- Guardar los cambios o borrar la configuración del taller para volver a la
  plantilla predeterminada.

## Persistencia en Firestore

No hay un servidor HTTP propio en el proyecto. El servicio
`src/services/workshopStructureService.ts` usa Cloud Firestore directamente.
Cada configuración se almacena en `workshopConfigurations/{workshopId}` y las
reglas de `firestore.rules` permiten leerla a estudiantes/docentes activos y
escribirla o eliminarla únicamente a docentes activos.

Ejemplo del documento:

```json
{
  "workshopId": "workshop-1",
  "answerKeyPrivate": true,
  "sections": [
    { "id": "objectives-context", "enabled": true, "order": 0 },
    { "id": "evaluation-rubric", "enabled": true, "order": 1 },
    { "id": "incident-form", "enabled": true, "order": 2 },
    { "id": "prompt-bank", "enabled": true, "order": 3 },
    { "id": "theory-framework", "enabled": true, "order": 4 },
    { "id": "peer-feedback", "enabled": true, "order": 5 }
  ],
  "evaluationType": "text",
  "formSchema": {
    "guidingQuestions": [
      "¿Qué ocurrió y en qué contexto?",
      "¿Qué elementos de la práctica consideras relevantes?"
    ],
    "matrixRows": [],
    "questions": []
  },
  "updatedAt": "2026-10-16T18:00:00.000Z",
  "updatedBy": "docente@ucen.cl"
}
```

`evaluationType` admite `text` y `multiple-choice`. Las configuraciones
anteriores con matriz o archivo se interpretan como texto para mantener el
acceso a talleres ya configurados. Las preguntas y alternativas se guardan en
el documento visible al estudiante; la respuesta correcta se mantiene aparte en
`workshopConfigurations/{workshopId}/private/answerKey`, que solo pueden leer
docentes activos. Las preguntas abiertas solo guardan su enunciado y no tienen
respuesta correcta. El estudiante recibe únicamente los enunciados y las
opciones, nunca las respuestas correctas.
La aplicación valida las longitudes y cardinalidades antes de escribir; las
reglas de Firestore restringen los roles y los IDs de taller, además de impedir
que una configuración sin la pauta privada se lea desde una cuenta de estudiante.

### Importación CSV

La importación está disponible únicamente mientras el tipo de entrada sea
**Alternativas**. Cada fila crea una pregunta de selección múltiple; las
preguntas existentes (incluidas las abiertas) se conservan y las nuevas se
agregan al final. Se requiere una columna `pregunta`, al menos
`alternativa1` y `alternativa2`, y `respuestaCorrecta`. Se pueden agregar
`alternativa3` a `alternativa6`. La respuesta correcta debe coincidir exactamente
con el texto de una alternativa. Se aceptan archivos CSV separados por coma o
punto y coma, con celdas entre comillas cuando contengan el delimitador.

Ejemplo:

```csv
pregunta,alternativa1,alternativa2,alternativa3,respuestaCorrecta
"¿Qué promueve la reflexión pedagógica?","Analizar la práctica","Repetir la actividad","Evitar el diálogo","Analizar la práctica"
```

Se aceptan hasta 30 preguntas por taller entre las creadas manualmente y las
importadas. Si una fila no es válida, el archivo completo se rechaza y se
informa el número de fila que debe corregirse.

Las reglas deben desplegarse en Firebase para habilitar la persistencia:

```bash
firebase deploy --only firestore:rules
```

## Integración con el asistente del estudiante

Al entrar a `/estudiante/talleres/:workshopId`, HU-03 carga la configuración del
taller desde Firestore. La secuencia de secciones respeta el orden y los estados
activados por el docente. El estudiante puede completar el relato o contestar
las preguntas de alternativas y responder las preguntas abiertas en texto
libre; las respuestas dinámicas se guardan en el borrador local particionado
por UID y se restauran al volver al taller. La clave correcta de alternativas
no se envía al cliente. Las respuestas abiertas también pasan por el control
de datos sensibles.

El relato conserva el control de datos sensibles. El Impulso y el contador
siguen ligados a la revisión del relato libre; el cuestionario no consume
intentos de IA.

## Estado y límites actuales

La sección de retroalimentación con pares se muestra como no disponible hasta
implementar el flujo compartido.

Si había una configuración previa a la separación de la pauta, la pantalla
docente la migra al abrirla; entretanto, las reglas no permiten que estudiantes
lean un documento que todavía no declare `answerKeyPrivate: true`.
