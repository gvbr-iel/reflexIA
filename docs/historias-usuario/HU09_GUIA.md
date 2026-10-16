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
    "questions": []
  },
  "updatedAt": "2026-10-16T18:00:00.000Z",
  "updatedBy": "docente@ucen.cl"
}
```

`evaluationType` admite `text`, `matrix`, `multiple-choice` y `file`. Cada
elemento de `formSchema.questions` contiene `id`, `prompt`, `options` y
`correctOptionIndex`. La aplicación valida las longitudes y cardinalidades
antes de escribir; las reglas de Firestore limitan roles, IDs de taller, las
secciones y el tamaño de las listas.

Las reglas deben desplegarse en Firebase para habilitar la persistencia:

```bash
firebase deploy --only firestore:rules
```

## Estado y límites actuales

La configuración se guarda y la vista previa representa las secciones y el
formato elegidos. El formulario de captura que ya usa el estudiante en
`/estudiante/talleres/:workshopId` todavía corresponde al asistente HU-03 y no
consume estas configuraciones. Su integración requiere adaptar el modelo de
borradores y conservar la detección de datos sensibles, el guardado por UID y
el contador de intentos. La carga real de archivos/diagramas también requiere
definir almacenamiento y validaciones; el selector de archivo de la vista
previa es solo ilustrativo.
