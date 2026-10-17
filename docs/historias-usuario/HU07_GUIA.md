# HU-07 — Biblioteca de innovaciones pedagógicas

## Historia de usuario

**Como** estudiante y profesor guía,
**quiero** consultar trabajos reales realizados en los talleres y publicados de forma anónima,
**para** conocer propuestas de innovación pedagógica desarrolladas en la práctica.

## Criterios de aceptación

1. Estudiantes y docentes activos pueden consultar la biblioteca.
2. Cada trabajo publicado corresponde a una entrega real de un taller con nota oficial igual o superior a 6,0.
3. Antes de aparecer en la biblioteca, un docente revisa y anonimiza el producto.
4. Los trabajos se pueden buscar y filtrar por taller y por etiquetas del estilo de innovación.
5. El catálogo público no incluye correo, UID ni nombre del autor.
6. Las entregas sin nota vinculada, con nota inferior a 6,0 o ya publicadas no pueden volver a publicarse.
7. La interfaz puede ofrecer ejemplos demostrativos, siempre en una sección separada y señalados como ficticios; no deben confundirse con publicaciones auténticas ni mostrar notas.

## Flujo implementado

1. El estudiante completa el asistente del taller y elige **Enviar trabajo a revisión** al finalizar.
2. Para texto y respuestas abiertas, el envío solo se habilita después de superar la comprobación de datos sensibles. Las respuestas de alternativas no incluyen texto libre que requiera ese análisis.
3. La entrega se guarda en `workshopSubmissions/{uid}_{workshopId}`. Es privada: el estudiante propietario puede leerla y los docentes activos pueden revisarla. No se publica ni se añade automáticamente a la biblioteca.
4. En `/docente/innovaciones`, el docente puede asignar una nota oficial cuando esa entrega aún no tiene una evaluación vinculada. La nota se guarda en `evaluations/{correo}.workshops.{workshopId}` junto con `sourceSubmissionId`.
5. Solo si la nota vinculada es 6,0 o superior se habilita el editor de publicación. El docente redacta un título y resumen anónimos, edita el producto, agrega etiquetas y confirma la revisión de privacidad.
6. La publicación se guarda en `publishedInnovations/{id}` con el taller, la nota, el producto editado, las etiquetas y la fecha; no contiene identificadores del estudiante. La biblioteca de estudiante y docente solo consulta documentos aprobados con nota igual o superior a 6,0.

Las notas antiguas o provenientes de una evaluación que no identifica esta entrega no se reutilizan como evidencia de elegibilidad. Tampoco se sobrescribe una nota oficial existente desde este flujo. Esto evita convertir las reflexiones de ejemplo del panel docente en trabajos auténticos.

El campo `sourceSubmissionId` vincula la evaluación oficial con el documento de entrega. Las reflexiones revisadas por el flujo de ejemplos no contienen ese vínculo y, por ello, no habilitan automáticamente su publicación como innovación.

### Ejemplos pedagógicos

La biblioteca incluye cuatro ejemplos demostrativos, uno por etapa del ciclo:

- **Identificar:** observar distintas oportunidades de participación y formular una pregunta de indagación.
- **Analizar:** contrastar lo planificado con lo ocurrido y explorar factores pedagógicos.
- **Teorizar:** vincular retroalimentación, evaluación formativa y autorregulación.
- **Transformar:** proponer opciones para demostrar aprendizajes y recoger evidencias para mejorar la intervención.

Son textos ficticios creados para orientar la navegación y mostrar formatos posibles. Aparecen en una sección aparte, con la etiqueta **Ejemplo**, sin nota ni afirmaciones de resultados reales; no se almacenan en Firestore ni cuentan como publicaciones.

## Modelo de datos

Ejemplo de entrega privada:

```json
{
  "studentUid": "uid-del-estudiante",
  "studentEmail": "estudiante@ucen.cl",
  "workshopId": "workshop-2",
  "content": {
    "context": "",
    "description": "",
    "actors": "",
    "relevance": ""
  },
  "responses": [
    {
      "prompt": "¿Qué tensión observas entre lo planificado y lo ocurrido?",
      "response": "Descripción de la respuesta",
      "type": "open-ended"
    }
  ],
  "submittedAt": "2026-01-30T12:00:00.000Z",
  "publishedInnovationId": null
}
```

Ejemplo de documento público:

```json
{
  "workshopId": "workshop-2",
  "grade": 6.2,
  "title": "Estrategias para responder a situaciones imprevistas",
  "summary": "Propuesta que ajusta la planificación según la participación observada.",
  "productType": "Análisis de incidente y propuesta pedagógica",
  "work": "Versión revisada y anonimizada del producto",
  "tags": ["Planificación y realidad", "Reflexión crítica"],
  "publishedAt": "2026-01-30T12:00:00.000Z",
  "approved": true
}
```

## Seguridad y configuración de Firebase

- Las reglas de [`firestore.rules`](../../firestore.rules) limitan la lectura de entregas al estudiante propietario y a docentes activos; la biblioteca es legible por estudiantes y docentes activos.
- [`firebase.json`](../../firebase.json) conecta las reglas y los índices del repositorio con Firebase CLI. Despliega ambos con:

```bash
firebase use <id-del-proyecto>
firebase deploy --only firestore:rules,firestore:indexes
```

- El índice compuesto de `publishedInnovations` está declarado en [`firestore.indexes.json`](../../firestore.indexes.json).
- La política de consentimiento adicional del estudiante para la difusión de trabajos debe ser definida por la institución antes de publicar datos reales en producción.

## Validación manual

1. Configurar Firebase Authentication y Firestore, publicar reglas e índice y autorizar perfiles activos de estudiante y docente.
2. Iniciar sesión como estudiante, completar un taller, superar la revisión de datos sensibles cuando corresponda y enviar el producto.
3. Iniciar sesión como docente y abrir `/docente/innovaciones`. Verificar que la entrega aparece con su estado de evaluación y que es posible asignar su nota oficial.
4. Asignar una nota menor que 6,0 y confirmar que no se ofrece publicar el trabajo.
5. En una entrega sin nota oficial previa, asignar una nota de 6,0 o superior. Editar el producto para anonimizarlo, agregar etiquetas y confirmar la revisión; publicarlo.
6. Abrir `/estudiante/innovaciones` y `/docente/innovaciones`: comprobar que se presenta el producto publicado, que se filtra por taller y etiqueta y que el detalle no expone correo ni UID.
7. Confirmar que el trabajo deja de aparecer en la lista de pendientes después de publicarse y que los estados de carga, error y catálogo vacío son comprensibles.
8. Probar las dos vistas a 360 px y comprobar que no aparece desplazamiento horizontal.
