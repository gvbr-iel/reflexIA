/**
 * @module views/innovations/data/innovations
 *
 * Casos de ejemplo de la biblioteca de innovaciones (HU-07). Son datos fijos
 * (no vienen de una API): cuando exista backend, se reemplazarán por una
 * llamada desde un servicio.
 */

import type { InnovationCase } from '../models/innovation'

/** Lista de casos que muestra la biblioteca. */
export const innovationCases: InnovationCase[] = [
  {
    id: 'learning-stations',
    title: 'Estaciones de aprendizaje con roles rotativos',
    category: 'Estrategias de enseñanza',
    summary:
      'Organiza una secuencia de actividades breves para que el curso explore un mismo objetivo desde distintas formas de trabajo.',
    context: 'Cursos que requieren alternar momentos de exploración, práctica y conversación.',
    challenge:
      'Una actividad única y extensa dificulta sostener la participación y atender diferentes ritmos de aprendizaje.',
    action:
      'Diseñar estaciones complementarias con consignas breves y asignar roles que roten durante la sesión.',
    implementation: [
      'Definir un objetivo de aprendizaje común y dividirlo en tareas breves.',
      'Preparar instrucciones visibles y materiales accesibles en cada estación.',
      'Rotar roles como lector, encargado de materiales y relator para distribuir la participación.',
      'Cerrar con una síntesis en la que el grupo conecte lo trabajado en las distintas estaciones.',
    ],
    expectedImpact:
      'Se espera favorecer la participación activa, la colaboración y distintas oportunidades de practicar el objetivo.',
    tags: ['participación', 'colaboración', 'diferenciación'],
  },
  {
    id: 'peer-feedback',
    title: 'Retroalimentación entre pares con pauta breve',
    category: 'Evaluación formativa',
    summary:
      'Propone usar criterios explícitos para que cada estudiante entregue una sugerencia concreta sobre el trabajo de otra persona.',
    context: 'Procesos de escritura, resolución de problemas o elaboración de productos revisables.',
    challenge:
      'La revisión suele llegar tarde o centrarse en impresiones generales que no orientan el siguiente paso.',
    action:
      'Incorporar una pausa de revisión por pares con criterios observables y una pregunta de mejora.',
    implementation: [
      'Compartir dos o tres criterios vinculados directamente con el objetivo.',
      'Modelar una sugerencia respetuosa que señale un avance y un próximo paso.',
      'Intercambiar trabajos y responder la pauta usando ejemplos del producto.',
      'Reservar tiempo para que cada autor decida cómo utilizar la retroalimentación.',
    ],
    expectedImpact:
      'Se espera que el alumnado comprenda mejor los criterios y cuente con información oportuna para revisar su trabajo.',
    tags: ['coevaluación', 'criterios', 'escritura'],
  },
  {
    id: 'multiple-ways-to-show-learning',
    title: 'Opciones diversas para demostrar lo aprendido',
    category: 'Inclusión y participación',
    summary:
      'Ofrece más de un formato para comunicar el aprendizaje, manteniendo los mismos objetivos y criterios de evaluación.',
    context: 'Unidades en las que el objetivo puede evidenciarse mediante una explicación, representación o producto.',
    challenge:
      'Un único formato de respuesta puede medir la facilidad con ese formato además del aprendizaje esperado.',
    action:
      'Permitir elegir entre alternativas equivalentes y transparentar qué evidencia debe contener cada una.',
    implementation: [
      'Precisar el aprendizaje que se evaluará antes de escoger los formatos.',
      'Proponer opciones comparables, por ejemplo, una explicación oral, un esquema comentado o un texto breve.',
      'Usar una pauta común que valore las mismas ideas centrales en cada formato.',
      'Invitar a revisar la pauta antes de elegir y durante la preparación del producto.',
    ],
    expectedImpact:
      'Se espera ampliar las vías de participación sin reducir la claridad ni la exigencia del objetivo común.',
    tags: ['accesibilidad', 'elección', 'evaluación'],
  },
  {
    id: 'local-context-challenge',
    title: 'Desafío de aprendizaje conectado con el entorno',
    category: 'Vinculación con el entorno',
    summary:
      'Conecta un objetivo curricular con una pregunta sobre el entorno cotidiano, sin exponer información personal de la comunidad.',
    context: 'Unidades que permiten observar, comparar o proponer mejoras a partir de situaciones cercanas.',
    challenge:
      'Algunos contenidos pueden percibirse como lejanos cuando se trabajan solo con ejemplos descontextualizados.',
    action:
      'Plantear una pregunta investigable y analizar información general o materiales preparados por el docente.',
    implementation: [
      'Seleccionar una pregunta conectada con el objetivo curricular y apropiada para la edad.',
      'Usar datos públicos, ficticios o previamente anonimizados; no recopilar datos identificables.',
      'Guiar la interpretación con preguntas que relacionen evidencia y contenido.',
      'Compartir conclusiones o propuestas en un formato breve acordado con el curso.',
    ],
    expectedImpact:
      'Se espera facilitar la transferencia de conceptos y dar propósito a la indagación mediante una situación reconocible.',
    tags: ['contextualización', 'indagación', 'ciudadanía'],
  },
  {
    id: 'visible-thinking-routine',
    title: 'Rutina de pensamiento para abrir y cerrar la clase',
    category: 'Estrategias de enseñanza',
    summary:
      'Usa preguntas recurrentes para hacer visibles las ideas iniciales y las conexiones que surgen durante una sesión.',
    context: 'Clases con discusión, análisis de fuentes o construcción gradual de conceptos.',
    challenge:
      'Las ideas previas y los cambios de comprensión pueden quedar implícitos si solo se solicita una respuesta final.',
    action:
      'Registrar una idea inicial, una pregunta y una conclusión al cierre para comparar el recorrido de pensamiento.',
    implementation: [
      'Presentar un estímulo breve relacionado con el contenido.',
      'Pedir una respuesta inicial individual antes de conversar en grupo.',
      'Recoger preguntas y retomarlas mientras avanza la actividad.',
      'Al cierre, invitar a reformular la idea inicial y explicar qué evidencia produjo el cambio.',
    ],
    expectedImpact:
      'Se espera fortalecer la metacognición y ayudar al docente a identificar preguntas o conceptos que requieren seguimiento.',
    tags: ['metacognición', 'diálogo', 'ideas previas'],
  },
]
