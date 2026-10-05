/**
 * Reflexiones de ejemplo para el panel del profesor guía (HU-02, RF-02).
 *
 * Los envíos reales de los estudiantes viven en el almacenamiento local de
 * cada cuenta, por lo que el profesor no puede leerlos sin un backend. Este
 * archivo simula ese conjunto: 8 reflexiones anónimas ("Estudiante A…") de los
 * 4 talleres, en los tres estados de revisión.
 *
 * Todos los relatos usan solo roles ("el docente", "un estudiante"): ningún
 * nombre real de persona, colegio o curso exacto (AI_GUIDELINES §8).
 *
 * La propuesta de la IA de cada reflexión se calcula con `generateImpulse`, con
 * la marca de tiempo del envío, para que siempre coincida con el texto.
 */

import type { AIFeedbackHint } from '../../../models/criticalIncident';
import type {
  Reflection,
  ReflectionContent,
  ReviewStatus,
} from '../../../models/reflection';
import { generateImpulse } from '../../../utils/impulseGenerator';

// ─────────────────────────────────────────────
// Construcción de cada reflexión
// ─────────────────────────────────────────────

/** Datos que se escriben a mano de cada reflexión. */
interface ReflectionSeed {
  id: string;
  studentAlias: string;
  workshopNumber: number;
  attemptNumber: number;
  submittedAt: string;
  content: ReflectionContent;
}

/** Cambios del profesor sobre la propuesta de la IA (solo si ya la revisó). */
interface TeacherReviewSeed {
  status: Exclude<ReviewStatus, 'pending'>;
  reviewedAt: string;
  /** Transforma los impulsos de la IA en los impulsos vigentes del docente. */
  editHints?: (hints: AIFeedbackHint[]) => AIFeedbackHint[];
  /** Comentario general del docente; si se omite se conserva el de la IA. */
  generalComment?: string;
}

/** Reemplaza el texto de la orientación con ese id (no hace nada si no existe). */
function rewordHint(id: string, message: string) {
  return (hints: AIFeedbackHint[]) =>
    hints.map((hint) => (hint.id === id ? { ...hint, message } : hint));
}

/** Calcula la propuesta de la IA y arma la reflexión con su estado de revisión. */
function createReflection(seed: ReflectionSeed, teacherReview?: TeacherReviewSeed): Reflection {
  const workshopId = `workshop-${seed.workshopNumber}`;
  const aiFeedback = generateImpulse({
    workshopId,
    attemptNumber: seed.attemptNumber,
    content: seed.content,
    createdAt: seed.submittedAt,
  });
  const aiHints = aiFeedback.hints.map((hint) => ({ ...hint }));

  return {
    id: seed.id,
    studentAlias: seed.studentAlias,
    workshopId,
    workshopNumber: seed.workshopNumber,
    attemptNumber: seed.attemptNumber,
    content: seed.content,
    submittedAt: seed.submittedAt,
    aiFeedback,
    review: teacherReview
      ? {
          status: teacherReview.status,
          hints: teacherReview.editHints ? teacherReview.editHints(aiHints) : aiHints,
          generalComment: teacherReview.generalComment ?? aiFeedback.generalComment,
          reviewedAt: teacherReview.reviewedAt,
        }
      : {
          status: 'pending',
          hints: aiHints,
          generalComment: aiFeedback.generalComment,
          reviewedAt: null,
        },
  };
}

// ─────────────────────────────────────────────
// Reflexiones de ejemplo
// ─────────────────────────────────────────────

export const sampleReflections: Reflection[] = [
  // Taller 1 · pendiente · relato con varias omisiones
  createReflection({
    id: 'reflection-001',
    studentAlias: 'Estudiante A',
    workshopNumber: 1,
    attemptNumber: 1,
    submittedAt: '2026-09-28T14:20:00.000Z',
    content: {
      context:
        'Era una clase de Lenguaje con un curso de básica que venía trabajando textos narrativos hace semanas.',
      description:
        'Durante la lectura en voz alta, un estudiante se negó a leer y el resto del curso comenzó a reírse de él, por lo que la actividad se detuvo por varios minutos.',
      actors:
        'Participaron el estudiante que no quiso leer, sus compañeros de curso y la docente a cargo, que intentó retomar la lectura.',
      relevance:
        'Me parece importante porque muestra cómo las burlas afectan la participación de los estudiantes en la clase.',
    },
  }),

  // Taller 1 · validada · relato casi completo
  createReflection(
    {
      id: 'reflection-002',
      studentAlias: 'Estudiante B',
      workshopNumber: 1,
      attemptNumber: 2,
      submittedAt: '2026-09-29T16:05:00.000Z',
      content: {
        context:
          'Segundo medio de 35 estudiantes en una sala con proyector y conexión a internet inestable; el curso ya tenía conocimientos previos de funciones lineales de la unidad anterior.',
        description:
          'Mientras resolvían un ejercicio en parejas, dos estudiantes discutieron sobre el procedimiento y uno decidió abandonar la actividad; finalmente el docente medió y retomaron el trabajo.',
        actors:
          'El docente, los dos estudiantes en conflicto y yo como practicante; la presión por terminar a tiempo influyó en el tono de la discusión y yo decidí observar antes de intervenir.',
        relevance:
          'Es relevante porque aprendí a mediar sin imponer una solución; según Dewey, la reflexión surge ante una duda real.',
      },
    },
    { status: 'validated', reviewedAt: '2026-10-01T10:30:00.000Z' },
  ),

  // Taller 2 · pendiente
  createReflection({
    id: 'reflection-003',
    studentAlias: 'Estudiante C',
    workshopNumber: 2,
    attemptNumber: 1,
    submittedAt: '2026-10-01T13:10:00.000Z',
    content: {
      context:
        'Séptimo básico de 32 estudiantes en la sala de laboratorio del establecimiento, que cuenta con pocos microscopios; el curso ya había visto la estructura de la célula en la unidad anterior.',
      description:
        'Cuando repartimos los microscopios, un grupo comenzó a empujarse por conseguir uno y se cayó una de las muestras al suelo, por lo que el docente detuvo la actividad.',
      actors:
        'El docente a cargo, el grupo que discutía por el material y el resto del curso que observaba; la escasez de materiales influyó en el conflicto y yo ayudé a ordenar el espacio.',
      relevance:
        'Es importante porque muestra que la falta de recursos puede generar conflictos y afectar el aprendizaje, y podría proponer turnos rotativos para el uso del material.',
    },
  }),

  // Taller 2 · editada · último intento
  createReflection(
    {
      id: 'reflection-004',
      studentAlias: 'Estudiante D',
      workshopNumber: 2,
      attemptNumber: 3,
      submittedAt: '2026-10-02T15:40:00.000Z',
      content: {
        context:
          'Un octavo básico de unos 40 estudiantes en una sala pequeña con las mesas muy juntas, que habían trabajado previamente la unidad sobre la Revolución Industrial.',
        description:
          'Durante el debate sobre las condiciones de trabajo, un estudiante dijo una frase ofensiva hacia un compañero y el curso guardó silencio; el docente pidió disculpas al grupo y siguió con la clase.',
        actors:
          'El estudiante que hizo el comentario, el compañero afectado, el docente y el resto del curso; el silencio del grupo influyó en que nadie interviniera, y yo como practicante no supe cómo reaccionar.',
        relevance:
          'Es relevante porque aprendí que la convivencia también se enseña; según Schön, reflexionar en la acción permite ajustar la respuesta, aunque aún no sé qué estrategia aplicar.',
      },
    },
    {
      status: 'edited',
      reviewedAt: '2026-10-03T09:15:00.000Z',
      editHints: rewordHint(
        'description-outcome',
        'Cuenta qué pasó con el estudiante afectado después del comentario: ¿hubo alguna acción de apoyo o seguimiento?',
      ),
      generalComment:
        'Buen análisis de la influencia del grupo. Falta precisar el cierre de la situación y cómo se acompañó al estudiante afectado.',
    },
  ),

  // Taller 3 · pendiente
  createReflection({
    id: 'reflection-005',
    studentAlias: 'Estudiante E',
    workshopNumber: 3,
    attemptNumber: 1,
    submittedAt: '2026-10-03T12:00:00.000Z',
    content: {
      context:
        'Sexto básico con 25 estudiantes en la sala de arte, que tiene mesas amplias y materiales de pintura; el curso ya conocía las técnicas básicas por la unidad de color.',
      description:
        'Mientras pintaban, una estudiante comenzó a llorar porque su trabajo se manchó, y otro compañero se rió; la docente se acercó, conversó con ambos y finalmente la actividad continuó.',
      actors:
        'La estudiante afectada, el compañero que se rió, la docente y yo como practicante; el ambiente competitivo del curso influyó en la burla y yo decidí acompañar a la estudiante.',
      relevance:
        'Es significativo porque comprendí que el error también es parte del aprendizaje, y según Tripp un incidente crítico revela supuestos propios que conviene revisar.',
    },
  }),

  // Taller 3 · validada
  createReflection(
    {
      id: 'reflection-006',
      studentAlias: 'Estudiante F',
      workshopNumber: 3,
      attemptNumber: 2,
      submittedAt: '2026-10-01T17:25:00.000Z',
      content: {
        context:
          'Cuarto básico de 30 estudiantes en una sala con pizarra y sin recursos tecnológicos, que ya habían trabajado la unidad de multiplicación.',
        description:
          'Durante la resolución de problemas, varios estudiantes dijeron que no entendían y comenzaron a conversar entre ellos; la docente repitió la explicación y finalmente solo algunos lograron continuar.',
        actors:
          'La docente, los estudiantes que no comprendían y los que sí lo lograron; el ritmo acelerado de la clase influyó en la confusión y yo me sentí sin herramientas para ayudar.',
        relevance:
          'Es importante porque aprendí a detectar cuándo el ritmo no se ajusta al grupo, y podría proponer actividades diferenciadas, pero aún no lo conecto con las lecturas del curso.',
      },
    },
    {
      status: 'validated',
      reviewedAt: '2026-10-02T11:00:00.000Z',
      editHints: rewordHint(
        'relevance-theory',
        'Elige uno de los marcos de la barra lateral y explica con tus palabras cómo ayuda a entender lo que ocurrió con el ritmo de la clase.',
      ),
    },
  ),

  // Taller 4 · editada
  createReflection(
    {
      id: 'reflection-007',
      studentAlias: 'Estudiante G',
      workshopNumber: 4,
      attemptNumber: 1,
      submittedAt: '2026-10-04T10:45:00.000Z',
      content: {
        context:
          'Tercero medio de 28 estudiantes en una sala con proyector; el curso tenía poca motivación por la lectura y ya había trabajado previamente textos argumentativos.',
        description:
          'Cuando propuse leer en voz alta, varios estudiantes dijeron que era aburrido y sacaron sus celulares; la docente me pidió continuar y finalmente se quedaron solo unos pocos.',
        actors:
          'La docente, los estudiantes desmotivados y yo como practicante; la falta de interés del grupo influyó en mi decisión de cambiar la actividad.',
        relevance:
          'Es relevante porque comprendí que la motivación condiciona el aprendizaje; podría proponer clubes de lectura con textos elegidos por ellos, aunque todavía no tengo un respaldo claro.',
      },
    },
    {
      status: 'edited',
      reviewedAt: '2026-10-05T08:50:00.000Z',
      editHints: rewordHint(
        'relevance-theory',
        'Tu propuesta de clubes de lectura es interesante: busca en la literatura del curso qué dice sobre la motivación para respaldarla.',
      ),
    },
  ),

  // Taller 1 · pendiente · un paso demasiado breve
  createReflection({
    id: 'reflection-008',
    studentAlias: 'Estudiante H',
    workshopNumber: 1,
    attemptNumber: 1,
    submittedAt: '2026-10-05T09:30:00.000Z',
    content: {
      context: 'Clase de Música con un curso de básica.',
      description:
        'Durante el ensayo de una canción, la mitad del curso dejó de participar porque los instrumentos no alcanzaban para todos, y luego la docente decidió organizar turnos.',
      actors:
        'La docente, los estudiantes sin instrumento y yo como practicante, que observé la clase desde el fondo; la escasez de instrumentos influyó en la participación.',
      relevance:
        'Es importante porque aprendí que la planificación de los recursos condiciona la participación; según Dewey, la experiencia debe ser inclusiva. Podría proponer estaciones rotativas.',
    },
  }),
];
