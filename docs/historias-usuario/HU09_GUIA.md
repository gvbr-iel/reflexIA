# HU-09 — Configuración de la estructura de talleres

## Objetivo

Permitir que un profesor guía configure por separado la estructura formativa de
los talleres 1 a 4, reordene y active secciones, defina el mecanismo de entrada,
edite preguntas y revise una previsualización antes de guardar.

## Interfaz

La vista `/docente/estructura-talleres` vive dentro de `TeacherLayout`. El
selector de talleres cambia el documento que se está editando sin compartir
estado entre talleres. La vista permite:

- Activar/desactivar las secciones de objetivos y contexto, formulario de
  incidente, marco teórico, retroalimentación de pares, rúbrica y banco de
  prompts.
- Reordenarlas con controles accesibles para mover arriba/abajo.
- Elegir texto libre, matriz, selección múltiple o archivo/diagrama.
- Editar preguntas orientadoras y filas de matriz.
- Crear, modificar y eliminar preguntas de alternativas, opciones y respuesta
  correcta.
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
    { "id": "incident-form", "enabled": true, "order": 1 },
    { "id": "theory-framework", "enabled": true, "order": 2 },
    { "id": "peer-feedback", "enabled": false, "order": 3 },
    { "id": "evaluation-rubric", "enabled": true, "order": 4 },
    { "id": "prompt-bank", "enabled": true, "order": 5 }
  ],
  "evaluationType": "matrix",
  "formSchema": {
    "guidingQuestions": [],
    "matrixRows": ["Situación observada", "Interpretación pedagógica"],
    "questions": [
      { "id": "q1", "prompt": "Pregunta", "options": ["A", "B"] }
    ]
  },
  "updatedAt": "2026-10-16T18:00:00.000Z",
  "updatedBy": "docente@ucen.cl"
}
```

`evaluationType` admite `text`, `matrix`, `multiple-choice` y `file`. Las
preguntas y alternativas se guardan en el documento visible al estudiante; la
respuesta correcta se mantiene aparte en
`workshopConfigurations/{workshopId}/private/answerKey`, que solo pueden leer
docentes activos. El estudiante recibe únicamente el enunciado y las opciones.
La aplicación valida las longitudes y cardinalidades antes de escribir; las
reglas de Firestore restringen los roles y los IDs de taller, además de impedir
que una configuración sin la pauta privada se lea desde una cuenta de estudiante.

Las reglas deben desplegarse en Firebase para habilitar la persistencia:

```bash
firebase deploy --only firestore:rules
```

## Integración con el asistente del estudiante

Al entrar a `/estudiante/talleres/:workshopId`, HU-03 carga la configuración del
taller desde Firestore. La secuencia de secciones respeta el orden y los estados
activados por el docente. El estudiante puede completar el relato, responder la
matriz en una tabla o contestar las preguntas de alternativas; las respuestas
dinámicas se guardan en el borrador local particionado por UID y se restauran
al volver al taller. La clave correcta de alternativas no se envía al cliente.

Los formatos de texto y matriz conservan el control de datos sensibles. El
Impulso y el contador siguen ligados a la revisión del relato libre; una matriz
o cuestionario no consume intentos de IA.

## Estado y límites actuales

El formato de archivo/diagrama no acepta archivos aún. Requiere definir
almacenamiento seguro y revisión de privacidad del contenido antes de habilitar
la recepción de documentos escolares. La sección de retroalimentación de pares
se muestra como no disponible hasta implementar el flujo compartido.

Si había una configuración previa a la separación de la pauta, la pantalla
docente la migra al abrirla; entretanto, las reglas no permiten que estudiantes
lean un documento que todavía no declare `answerKeyPrivate: true`.
