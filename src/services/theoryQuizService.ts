/**
 * @module services/theoryQuizService
 *
 * Capa de servicio para la Historia de Usuario 4:
 * Verificación del dominio del marco teórico (REF-21 / RF-04).
 *
 * Responsabilidades:
 * - Obtener las preguntas para un intento (selección aleatoria).
 * - Enviar las respuestas de un intento y recibir el resultado.
 * - Consultar el estado de aprobación del estudiante.
 * - Consultar el historial de intentos.
 *
 * Estado actual: **mock local con localStorage**.
 * Cuando el backend esté disponible, se reemplazan las funciones
 * internas por llamadas Axios/Fetch sin cambiar la firma pública.
 *
 * Regla R4 (AI_GUIDELINES §9): las vistas y componentes NO llaman
 * a la API directamente; lo hacen a través de este servicio.
 */

import type {
  QuizQuestion,
  QuizAttempt,
  QuizAnswer,
  QuizConfig,
  TheoryApprovalStatus,
  FetchQuestionsResponse,
  SubmitAttemptPayload,
  SubmitAttemptResponse,
} from '../models/theoryQuiz';

import { DEFAULT_QUIZ_CONFIG } from '../models/theoryQuiz';
import { readUserStorage, writeUserStorage } from '../utils/userStorage';

// ─────────────────────────────────────────────
// Claves de localStorage (mock temporal)
// ─────────────────────────────────────────────

const STORAGE_KEYS = {
  ATTEMPTS: 'reflexia_theory_attempts',
  APPROVAL: 'reflexia_theory_approval',
} as const;

// ─────────────────────────────────────────────
// Banco de preguntas embebido (mock)
// ─────────────────────────────────────────────
// TODO: Reemplazar por endpoint GET /api/theory-quiz/questions
// cuando el backend esté disponible. El backend debe seleccionar
// las preguntas aleatorias y no exponer el banco completo.

const QUESTION_BANK: QuizQuestion[] = [
  {
    id: 'q-01',
    statement: '¿Qué es la reflexión profesional en el contexto de la práctica pedagógica?',
    options: [
      { id: 'a', label: 'Un proceso de autoevaluación superficial sobre el desempeño laboral.' },
      { id: 'b', label: 'Un proceso sistemático de análisis crítico de la propia práctica docente para mejorarla.' },
      { id: 'c', label: 'Una revisión administrativa de los contenidos enseñados en clase.' },
      { id: 'd', label: 'Un requisito burocrático para cumplir con las normativas institucionales.' },
    ],
    correctOptionId: 'b',
    explanation: 'La reflexión profesional implica un análisis sistemático y crítico de la práctica docente, orientado a la mejora continua basada en evidencia y teoría pedagógica.',
  },
  {
    id: 'q-02',
    statement: '¿Cuál es el propósito principal de un incidente crítico en la reflexión docente?',
    options: [
      { id: 'a', label: 'Documentar errores para fines disciplinarios.' },
      { id: 'b', label: 'Identificar un momento significativo de la práctica para analizarlo en profundidad.' },
      { id: 'c', label: 'Reportar problemas de infraestructura escolar.' },
      { id: 'd', label: 'Evaluar el rendimiento académico de los estudiantes.' },
    ],
    correctOptionId: 'b',
    explanation: 'Un incidente crítico es un evento significativo de la práctica docente que, al ser analizado en profundidad, permite extraer aprendizajes y transformar la práctica pedagógica.',
  },
  {
    id: 'q-03',
    statement: 'Según Donald Schön, ¿qué diferencia la "reflexión en la acción" de la "reflexión sobre la acción"?',
    options: [
      { id: 'a', label: 'La primera ocurre durante la práctica y la segunda después de ella.' },
      { id: 'b', label: 'La primera es teórica y la segunda es práctica.' },
      { id: 'c', label: 'La primera es individual y la segunda es grupal.' },
      { id: 'd', label: 'No hay diferencia; son sinónimos.' },
    ],
    correctOptionId: 'a',
    explanation: 'Schön distingue entre reflexionar mientras se actúa (ajustes en tiempo real) y reflexionar después de la acción (análisis retrospectivo para extraer aprendizajes).',
  },
  {
    id: 'q-04',
    statement: '¿Qué elemento es fundamental en el análisis de un incidente crítico?',
    options: [
      { id: 'a', label: 'La opinión personal sin fundamento teórico.' },
      { id: 'b', label: 'El contexto, los actores involucrados y la relevancia pedagógica.' },
      { id: 'c', label: 'Únicamente la descripción cronológica de los hechos.' },
      { id: 'd', label: 'La calificación numérica del desempeño estudiantil.' },
    ],
    correctOptionId: 'b',
    explanation: 'El análisis de un incidente crítico requiere considerar el contexto (alumnos, infraestructura, conocimientos previos), los actores y su influencia, y la relevancia pedagógica del evento.',
  },
  {
    id: 'q-05',
    statement: '¿Por qué es importante la anonimización de datos en los relatos reflexivos?',
    options: [
      { id: 'a', label: 'Para cumplir con las normativas de privacidad y proteger la identidad de los involucrados.' },
      { id: 'b', label: 'Para hacer los relatos más interesantes literariamente.' },
      { id: 'c', label: 'No es importante; los nombres reales mejoran la veracidad del relato.' },
      { id: 'd', label: 'Solo es necesaria si el relato se publica en redes sociales.' },
    ],
    correctOptionId: 'a',
    explanation: 'La anonimización protege la identidad de estudiantes, docentes y establecimientos, cumpliendo con la Ley 21.719 de Protección de Datos Personales y las normativas éticas de la práctica profesional.',
  },
  {
    id: 'q-06',
    statement: '¿Qué caracteriza a una innovación pedagógica derivada de la reflexión profesional?',
    options: [
      { id: 'a', label: 'Adoptar la última tecnología disponible sin evaluar su pertinencia.' },
      { id: 'b', label: 'Proponer cambios fundamentados en el análisis reflexivo y sustentados teóricamente.' },
      { id: 'c', label: 'Copiar estrategias exitosas de otros contextos sin adaptarlas.' },
      { id: 'd', label: 'Mantener las mismas prácticas pero con materiales diferentes.' },
    ],
    correctOptionId: 'b',
    explanation: 'Una innovación pedagógica genuina surge del análisis reflexivo de la propia práctica y se sustenta en teoría educativa, proponiendo cambios contextualizados y fundamentados.',
  },
  {
    id: 'q-07',
    statement: '¿Cuál es el rol de la retroalimentación formativa en el proceso de reflexión?',
    options: [
      { id: 'a', label: 'Calificar numéricamente el desempeño del estudiante.' },
      { id: 'b', label: 'Orientar al estudiante para profundizar su análisis sin escribir por él.' },
      { id: 'c', label: 'Corregir y reescribir los textos del estudiante.' },
      { id: 'd', label: 'Aprobar o reprobar automáticamente las reflexiones.' },
    ],
    correctOptionId: 'b',
    explanation: 'La retroalimentación formativa orienta al estudiante mediante "impulsos" que señalan qué elementos profundizar, sin redactar ni corregir el texto por él.',
  },
  {
    id: 'q-08',
    statement: '¿Qué se entiende por "ciclo reflexivo" en la práctica profesional docente?',
    options: [
      { id: 'a', label: 'Un proceso lineal que se realiza una sola vez al final del semestre.' },
      { id: 'b', label: 'Un proceso iterativo de observación, análisis, planificación y acción para la mejora continua.' },
      { id: 'c', label: 'La repetición mecánica de las mismas actividades pedagógicas.' },
      { id: 'd', label: 'Un trámite administrativo que se completa al inicio de cada práctica.' },
    ],
    correctOptionId: 'b',
    explanation: 'El ciclo reflexivo es un proceso iterativo donde el docente observa su práctica, analiza críticamente los eventos, planifica mejoras y las implementa, generando aprendizaje continuo.',
  },
  {
    id: 'q-09',
    statement: '¿Qué papel cumple el marco teórico en la reflexión profesional?',
    options: [
      { id: 'a', label: 'Es un adorno académico sin aplicación práctica.' },
      { id: 'b', label: 'Proporciona fundamentos conceptuales para analizar la práctica con rigor.' },
      { id: 'c', label: 'Reemplaza la experiencia práctica del docente.' },
      { id: 'd', label: 'Solo sirve para las evaluaciones escritas, no para la práctica real.' },
    ],
    correctOptionId: 'b',
    explanation: 'El marco teórico brinda herramientas conceptuales que permiten analizar la práctica docente con rigor, fundamentando las observaciones en literatura pedagógica y no solo en la intuición.',
  },
  {
    id: 'q-10',
    statement: '¿Qué aspecto del contexto es relevante al describir un incidente crítico?',
    options: [
      { id: 'a', label: 'Solo la infraestructura del establecimiento.' },
      { id: 'b', label: 'Las características de los alumnos, la infraestructura y los conocimientos previos.' },
      { id: 'c', label: 'Únicamente los datos personales de los alumnos involucrados.' },
      { id: 'd', label: 'El clima del día en que ocurrió el incidente.' },
    ],
    correctOptionId: 'b',
    explanation: 'El contexto incluye las características de los alumnos, la infraestructura disponible y los conocimientos previos, elementos que inciden directamente en la práctica pedagógica.',
  },
  {
    id: 'q-11',
    statement: '¿Qué nivel de reflexión implica cuestionar las premisas y valores subyacentes a la propia práctica?',
    options: [
      { id: 'a', label: 'Reflexión técnica.' },
      { id: 'b', label: 'Reflexión descriptiva.' },
      { id: 'c', label: 'Reflexión crítica.' },
      { id: 'd', label: 'Reflexión superficial.' },
    ],
    correctOptionId: 'c',
    explanation: 'La reflexión crítica va más allá de describir o evaluar técnicamente: cuestiona los supuestos, valores y estructuras de poder que subyacen a la práctica docente.',
  },
  {
    id: 'q-12',
    statement: '¿Cuál es la diferencia entre un relato descriptivo y un relato reflexivo?',
    options: [
      { id: 'a', label: 'No hay diferencia; ambos narran lo que sucedió.' },
      { id: 'b', label: 'El descriptivo narra hechos; el reflexivo analiza e interpreta su significado pedagógico.' },
      { id: 'c', label: 'El descriptivo es más largo; el reflexivo es breve.' },
      { id: 'd', label: 'El descriptivo usa datos cuantitativos; el reflexivo usa poesía.' },
    ],
    correctOptionId: 'b',
    explanation: 'El relato reflexivo trasciende la mera narración de hechos al incorporar análisis, interpretación y conexión con fundamentos teóricos sobre su significado pedagógico.',
  },
  {
    id: 'q-13',
    statement: '¿Qué implica la "actuación mejorada" como resultado del ciclo reflexivo?',
    options: [
      { id: 'a', label: 'Repetir las mismas prácticas con mayor rapidez.' },
      { id: 'b', label: 'Proponer e implementar cambios pedagógicos fundamentados en la reflexión realizada.' },
      { id: 'c', label: 'Obtener una mejor calificación en la evaluación docente.' },
      { id: 'd', label: 'Cambiar de establecimiento educacional.' },
    ],
    correctOptionId: 'b',
    explanation: 'La actuación mejorada es la propuesta concreta de innovación pedagógica que surge del análisis reflexivo, fundamentada teóricamente y orientada a transformar la práctica.',
  },
  {
    id: 'q-14',
    statement: '¿Por qué la reflexión profesional debe estar respaldada por literatura pedagógica?',
    options: [
      { id: 'a', label: 'Porque es un requisito formal sin valor real.' },
      { id: 'b', label: 'Para que el análisis trascienda la opinión personal y tenga rigor académico.' },
      { id: 'c', label: 'Para aumentar la extensión del texto escrito.' },
      { id: 'd', label: 'Solo es necesario en investigaciones de posgrado.' },
    ],
    correctOptionId: 'b',
    explanation: 'El respaldo bibliográfico permite que la reflexión tenga fundamento teórico, otorgando rigor al análisis y evitando que las conclusiones dependan solo de la intuición o la experiencia personal.',
  },
  {
    id: 'q-15',
    statement: '¿Qué función cumple el profesor guía en el proceso de reflexión del estudiante en práctica?',
    options: [
      { id: 'a', label: 'Escribir las reflexiones en nombre del estudiante.' },
      { id: 'b', label: 'Monitorear el avance, orientar la profundización y validar la retroalimentación.' },
      { id: 'c', label: 'Calificar únicamente con nota numérica sin comentarios.' },
      { id: 'd', label: 'Desentenderse del proceso hasta la entrega final.' },
    ],
    correctOptionId: 'b',
    explanation: 'El profesor guía acompaña el proceso monitoreando el avance semanal, orientando la profundización del análisis y validando (o editando) la retroalimentación generada por el sistema.',
  },
  {
    id: 'q-16',
    statement: '¿Qué aporta la socialización de las reflexiones en la clase semanal?',
    options: [
      { id: 'a', label: 'Nada relevante; es una pérdida de tiempo.' },
      { id: 'b', label: 'Permite el aprendizaje entre pares y enriquece el análisis con múltiples perspectivas.' },
      { id: 'c', label: 'Sirve únicamente para comparar calificaciones.' },
      { id: 'd', label: 'Es un espacio solo para quejas sobre las escuelas de práctica.' },
    ],
    correctOptionId: 'b',
    explanation: 'La socialización en clase permite compartir experiencias, aprender de los análisis de los compañeros y enriquecer la propia reflexión con perspectivas diversas.',
  },
  {
    id: 'q-17',
    statement: '¿Qué característica debe tener una pregunta reflexiva eficaz?',
    options: [
      { id: 'a', label: 'Debe poder responderse con "sí" o "no".' },
      { id: 'b', label: 'Debe invitar al análisis profundo y la conexión con fundamentos teóricos.' },
      { id: 'c', label: 'Debe ser lo más ambigua posible.' },
      { id: 'd', label: 'Debe referirse exclusivamente a datos cuantitativos.' },
    ],
    correctOptionId: 'b',
    explanation: 'Las preguntas reflexivas eficaces son abiertas, invitan a profundizar el análisis y promueven la conexión entre la experiencia práctica y los fundamentos teóricos.',
  },
  {
    id: 'q-18',
    statement: '¿Por qué se limitan los intentos de revisión por taller en la plataforma?',
    options: [
      { id: 'a', label: 'Para reducir costos de procesamiento computacional.' },
      { id: 'b', label: 'Para fomentar un análisis pausado y riguroso en cada entrega.' },
      { id: 'c', label: 'Para castigar a los estudiantes que cometen errores.' },
      { id: 'd', label: 'No hay razón pedagógica; es una limitación técnica.' },
    ],
    correctOptionId: 'b',
    explanation: 'Limitar los intentos promueve que el estudiante reflexione con cuidado antes de enviar, evitando entregas impulsivas y fomentando la rigurosidad en el análisis (RF-06).',
  },
  {
    id: 'q-19',
    statement: '¿Qué modelo teórico propone niveles progresivos de reflexión (técnica, práctica y crítica)?',
    options: [
      { id: 'a', label: 'La taxonomía de Bloom.' },
      { id: 'b', label: 'Los niveles de reflexión de Van Manen.' },
      { id: 'c', label: 'La pirámide de Maslow.' },
      { id: 'd', label: 'El modelo de inteligencias múltiples de Gardner.' },
    ],
    correctOptionId: 'b',
    explanation: 'Van Manen propone tres niveles de reflexión: técnica (eficacia de medios), práctica (clarificación de supuestos) y crítica (cuestionamiento de valores y estructuras de poder).',
  },
  {
    id: 'q-20',
    statement: '¿Qué se entiende por "sustento teórico" en el contexto de los talleres prácticos?',
    options: [
      { id: 'a', label: 'Copiar definiciones de un diccionario.' },
      { id: 'b', label: 'Vincular el análisis del incidente con autores, teorías y evidencia pedagógica pertinente.' },
      { id: 'c', label: 'Incluir citas decorativas sin conexión con el análisis.' },
      { id: 'd', label: 'Mencionar cualquier libro leído durante la carrera.' },
    ],
    correctOptionId: 'b',
    explanation: 'El sustento teórico implica conectar el análisis del incidente con teorías y autores pertinentes, demostrando cómo los fundamentos pedagógicos iluminan la comprensión de la práctica.',
  },
  {
    id: 'q-21',
    statement: '¿Qué competencia se desarrolla al analizar la influencia de los actores en un incidente crítico?',
    options: [
      { id: 'a', label: 'Competencia en gestión administrativa.' },
      { id: 'b', label: 'Capacidad de comprender las dinámicas relacionales y su impacto en la práctica pedagógica.' },
      { id: 'c', label: 'Habilidad para elaborar informes estadísticos.' },
      { id: 'd', label: 'Competencia en resolución de conflictos laborales.' },
    ],
    correctOptionId: 'b',
    explanation: 'Analizar la influencia de los actores desarrolla la capacidad de comprender cómo las relaciones interpersonales y los roles afectan las dinámicas pedagógicas en el aula.',
  },
  {
    id: 'q-22',
    statement: '¿Cuál es la diferencia entre reflexión individual y reflexión colaborativa?',
    options: [
      { id: 'a', label: 'La individual es más valiosa porque no tiene sesgo.' },
      { id: 'b', label: 'La individual es introspectiva; la colaborativa incorpora perspectivas de pares y mentores.' },
      { id: 'c', label: 'La colaborativa reemplaza completamente la necesidad de reflexionar solo.' },
      { id: 'd', label: 'No existe diferencia significativa entre ambas.' },
    ],
    correctOptionId: 'b',
    explanation: 'La reflexión individual permite la introspección personal, mientras que la colaborativa enriquece el análisis al incorporar múltiples perspectivas, ambas siendo complementarias.',
  },
  {
    id: 'q-23',
    statement: '¿Qué riesgo conlleva una reflexión sin fundamento teórico?',
    options: [
      { id: 'a', label: 'Ninguno; la experiencia personal es suficiente.' },
      { id: 'b', label: 'Quedarse en una descripción superficial sin análisis profundo ni rigor.' },
      { id: 'c', label: 'Hacer reflexiones demasiado largas.' },
      { id: 'd', label: 'Obtener mejor calificación por ser más auténtico.' },
    ],
    correctOptionId: 'b',
    explanation: 'Sin fundamento teórico, la reflexión tiende a quedarse en lo anecdótico y descriptivo, sin alcanzar la profundidad analítica necesaria para transformar la práctica.',
  },
  {
    id: 'q-24',
    statement: '¿Qué significa que el proceso de reflexión sea "asincrónico" en esta plataforma?',
    options: [
      { id: 'a', label: 'Que se realiza exclusivamente en la sala de clases.' },
      { id: 'b', label: 'Que el estudiante puede redactar su reflexión en su propio tiempo, fuera de la clase.' },
      { id: 'c', label: 'Que no tiene plazos de entrega.' },
      { id: 'd', label: 'Que no requiere conexión a internet.' },
    ],
    correctOptionId: 'b',
    explanation: 'El trabajo asincrónico permite al estudiante redactar con calma en casa, en su propio tiempo, complementándose con la socialización sincrónica en la clase semanal.',
  },
  {
    id: 'q-25',
    statement: '¿Por qué la plataforma utiliza un flujo lineal de desbloqueo progresivo?',
    options: [
      { id: 'a', label: 'Por limitaciones técnicas del sistema.' },
      { id: 'b', label: 'Para asegurar que cada etapa se construya sobre las competencias adquiridas en la anterior.' },
      { id: 'c', label: 'Para dificultar el avance de los estudiantes.' },
      { id: 'd', label: 'No hay razón pedagógica para esta decisión.' },
    ],
    correctOptionId: 'b',
    explanation: 'El desbloqueo lineal garantiza un andamiaje progresivo: el dominio del marco teórico precede a la práctica reflexiva, asegurando bases conceptuales sólidas.',
  },
  {
    id: 'q-26',
    statement: '¿Qué es un "impulso" en el contexto de la retroalimentación de esta plataforma?',
    options: [
      { id: 'a', label: 'Una corrección automática del texto del estudiante.' },
      { id: 'b', label: 'Una orientación que señala qué elementos faltan o pueden profundizarse, sin dar la respuesta.' },
      { id: 'c', label: 'Una calificación parcial del avance.' },
      { id: 'd', label: 'Un mensaje motivacional genérico.' },
    ],
    correctOptionId: 'b',
    explanation: 'Los "impulsos" son orientaciones que indican al estudiante qué aspectos explorar o profundizar en su reflexión, sin redactar ni corregir el texto por él.',
  },
  {
    id: 'q-27',
    statement: '¿Qué dimensión ética está presente en la reflexión sobre la práctica docente?',
    options: [
      { id: 'a', label: 'Ninguna; la reflexión es puramente técnica.' },
      { id: 'b', label: 'La responsabilidad hacia los estudiantes, la equidad y el respeto por la diversidad.' },
      { id: 'c', label: 'Solo la ética de publicación académica.' },
      { id: 'd', label: 'Únicamente el cumplimiento de horarios laborales.' },
    ],
    correctOptionId: 'b',
    explanation: 'La reflexión docente tiene una dimensión ética fundamental que incluye la responsabilidad hacia los estudiantes, la promoción de la equidad y el respeto por la diversidad en el aula.',
  },
  {
    id: 'q-28',
    statement: '¿Qué criterio determina la relevancia pedagógica de un incidente crítico?',
    options: [
      { id: 'a', label: 'Que sea dramático o espectacular.' },
      { id: 'b', label: 'Que ofrezca oportunidades significativas de aprendizaje profesional sobre la práctica.' },
      { id: 'c', label: 'Que involucre a la mayor cantidad de personas posible.' },
      { id: 'd', label: 'Que haya sido registrado en video.' },
    ],
    correctOptionId: 'b',
    explanation: 'La relevancia pedagógica se define por el potencial del incidente para generar aprendizajes significativos sobre la práctica docente, independientemente de su espectacularidad.',
  },
  {
    id: 'q-29',
    statement: '¿Qué relación existe entre la reflexión profesional y el desarrollo de la identidad docente?',
    options: [
      { id: 'a', label: 'No tienen relación; la identidad docente es innata.' },
      { id: 'b', label: 'La reflexión continua contribuye a construir y fortalecer la identidad profesional docente.' },
      { id: 'c', label: 'La identidad docente se define únicamente por el título universitario.' },
      { id: 'd', label: 'La reflexión debilita la identidad docente al generar dudas.' },
    ],
    correctOptionId: 'b',
    explanation: 'La reflexión profesional es un motor clave en la construcción de la identidad docente, permitiendo al practicante tomar conciencia de sus valores, creencias y su rol como educador.',
  },
  {
    id: 'q-30',
    statement: '¿Cuál es el propósito de la evaluación diagnóstica del marco teórico antes de iniciar los talleres?',
    options: [
      { id: 'a', label: 'Filtrar y excluir a los estudiantes con menor rendimiento.' },
      { id: 'b', label: 'Asegurar que el estudiante posea las bases conceptuales necesarias para una reflexión fundamentada.' },
      { id: 'c', label: 'Cumplir un trámite administrativo sin valor pedagógico.' },
      { id: 'd', label: 'Generar una calificación inicial para el promedio final.' },
    ],
    correctOptionId: 'b',
    explanation: 'La evaluación diagnóstica verifica que el estudiante domine los conceptos fundamentales sobre reflexión profesional, garantizando bases sólidas antes de aplicarlos en los talleres prácticos.',
  },
];

// ─────────────────────────────────────────────
// Utilidades internas
// ─────────────────────────────────────────────

/**
 * Selecciona `count` elementos aleatorios de un arreglo
 * usando el algoritmo Fisher-Yates (shuffle parcial).
 */
function pickRandom<T>(array: T[], count: number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

// ─────────────────────────────────────────────
// Servicio público
// ─────────────────────────────────────────────

/**
 * Servicio de la evaluación del marco teórico.
 *
 * Firma estable: cuando el backend esté listo, se reemplazan
 * los cuerpos de cada método sin cambiar la interfaz pública.
 */
export const theoryQuizService = {

  /**
   * Obtiene las preguntas para un nuevo intento.
   *
   * Mock: selecciona 10 preguntas aleatorias del banco local.
   * Producción: GET /api/theory-quiz/questions
   */
  async fetchQuestions(): Promise<FetchQuestionsResponse> {
    // TODO: Reemplazar por llamada Axios al backend
    // return axios.get<FetchQuestionsResponse>('/api/theory-quiz/questions');

    const config = DEFAULT_QUIZ_CONFIG;
    const questions = pickRandom(QUESTION_BANK, config.questionsPerAttempt);

    return { questions, config };
  },

  /**
   * Envía las respuestas de un intento y recibe el resultado evaluado.
   *
   * Mock: evalúa localmente contra el banco y persiste en localStorage.
   * Producción: POST /api/theory-quiz/attempts
   */
  async submitAttempt(payload: SubmitAttemptPayload): Promise<SubmitAttemptResponse> {
    // TODO: Reemplazar por llamada Axios al backend
    // return axios.post<SubmitAttemptResponse>('/api/theory-quiz/attempts', payload);

    const config = DEFAULT_QUIZ_CONFIG;

    // Evaluar cada respuesta contra el banco
    const answers: QuizAnswer[] = payload.answers.map((a) => {
      const question = QUESTION_BANK.find((q) => q.id === a.questionId);
      return {
        questionId: a.questionId,
        selectedOptionId: a.selectedOptionId,
        isCorrect: question ? a.selectedOptionId === question.correctOptionId : false,
      };
    });

    const score = answers.filter((a) => a.isCorrect).length;
    const now = new Date().toISOString();

    // Construir el registro del intento
    const attempt: QuizAttempt = {
      attemptNumber: payload.attemptNumber,
      questions: payload.answers.map((a) =>
        QUESTION_BANK.find((q) => q.id === a.questionId)!,
      ),
      answers,
      score,
      totalQuestions: config.questionsPerAttempt,
      status: 'completed',
      startedAt: new Date(Date.now() - payload.durationSeconds * 1000).toISOString(),
      completedAt: now,
    };

    // Persistir el intento en el historial
    const history = readUserStorage<QuizAttempt[]>(STORAGE_KEYS.ATTEMPTS) ?? [];
    history.push(attempt);
    writeUserStorage(STORAGE_KEYS.ATTEMPTS, history);

    // Calcular estado de aprobación
    const bestScore = Math.max(...history.map((h) => h.score));
    const passed = bestScore >= config.passingScore;

    const approval: TheoryApprovalStatus = {
      isApproved: passed,
      result: {
        passed,
        bestScore,
        totalQuestions: config.questionsPerAttempt,
        bestScorePercentage: Math.round((bestScore / config.questionsPerAttempt) * 100),
        attemptsUsed: history.length,
        maxAttempts: config.maxAttempts,
        hasAttemptsRemaining: history.length < config.maxAttempts,
      },
      approvedAt: passed ? now : null,
    };

    writeUserStorage(STORAGE_KEYS.APPROVAL, approval);

    return { attempt, approval };
  },

  /**
   * Consulta el estado de aprobación del estudiante.
   *
   * Mock: lee de localStorage.
   * Producción: GET /api/theory-quiz/approval
   */
  async getApprovalStatus(): Promise<TheoryApprovalStatus> {
    // TODO: Reemplazar por llamada Axios al backend
    // return axios.get<TheoryApprovalStatus>('/api/theory-quiz/approval');

    const stored = readUserStorage<TheoryApprovalStatus>(STORAGE_KEYS.APPROVAL);

    return stored ?? {
      isApproved: false,
      result: null,
      approvedAt: null,
    };
  },

  /**
   * Consulta el historial de intentos del estudiante.
   *
   * Mock: lee de localStorage.
   * Producción: GET /api/theory-quiz/attempts
   */
  async getAttemptHistory(): Promise<QuizAttempt[]> {
    // TODO: Reemplazar por llamada Axios al backend
    // return axios.get<QuizAttempt[]>('/api/theory-quiz/attempts');

    return readUserStorage<QuizAttempt[]>(STORAGE_KEYS.ATTEMPTS) ?? [];
  },

  /**
   * Obtiene la configuración vigente del cuestionario.
   *
   * Mock: retorna la configuración por defecto.
   * Producción: GET /api/theory-quiz/config
   */
  async getConfig(): Promise<QuizConfig> {
    // TODO: Reemplazar por llamada Axios al backend
    // return axios.get<QuizConfig>('/api/theory-quiz/config');

    return DEFAULT_QUIZ_CONFIG;
  },
};
