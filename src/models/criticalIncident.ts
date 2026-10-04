/**
 * @module models/criticalIncident
 *
 * Tipos e interfaces globales para la Historia de Usuario 3:
 * Análisis Estructurado de Incidentes Críticos (RF-03).
 *
 * Centralizado en src/models/ para que otros módulos (navegación,
 * StudentLayout, rueda de progreso) puedan leer el estado de los
 * talleres sin acoplar dependencias al feature critical-incidents/.
 *
 * Dependencia con HU-04: los talleres solo se desbloquean si el
 * estudiante aprobó la evaluación del marco teórico (RF-04).
 * Este modelo NO importa tipos de theoryQuiz: esa condición se
 * consulta en un único punto, el hook useTheoryGate del feature
 * critical-incidents/, que lee `TheoryApprovalStatus`.
 */

// ─────────────────────────────────────────────
// Talleres (Workshops)
// ─────────────────────────────────────────────

/**
 * Estado en que puede estar un taller dentro del flujo lineal.
 *
 * - `locked`: el taller anterior no se completó (o no aprobó HU-04).
 * - `available`: desbloqueado pero no iniciado.
 * - `in-progress`: el estudiante tiene un borrador guardado.
 * - `completed`: ya tiene resultado (aprobado o reprobado). Un taller
 *   reprobado también desbloquea el siguiente.
 */
export type WorkshopStatus = 'locked' | 'available' | 'in-progress' | 'completed';

/**
 * Resultado de un taller completado.
 *
 * El rojo de un taller reprobado es el único uso permitido de ese color en
 * la interfaz: color semántico de desempeño (AI_GUIDELINES §4).
 */
export type WorkshopOutcome = 'approved' | 'failed';

/** Información de un taller (1 a 4). */
export interface Workshop {
  /** Identificador único del taller (e.g. "workshop-1"). */
  id: string;
  /** Número ordinal del taller (1–4). */
  number: number;
  /** Título corto del taller (e.g. "Taller 1"). */
  title: string;
  /** Descripción breve del objetivo del taller. */
  description: string;
  /** Tema del taller (e.g. "Contexto e inicio del incidente"). */
  topic: string;
  /** Resumen en una línea de lo que se trabaja en el taller. */
  subtitle: string;
  /** Fecha límite en formato YYYY-MM-DD (null si no tiene). */
  deadline: string | null;
  /** Estado actual del taller en el flujo lineal. */
  status: WorkshopStatus;
  /** Resultado del taller (null mientras no está completado). */
  outcome: WorkshopOutcome | null;
  /** Mejor puntaje obtenido (null si no se ha enviado). */
  bestScore: number | null;
  /** Cantidad de intentos utilizados. */
  attemptsUsed: number;
  /** Máximo de intentos permitidos. */
  maxAttempts: number;
  /** Marca temporal ISO 8601 de la primera aprobación (null si no completado). */
  completedAt: string | null;
}

// ─────────────────────────────────────────────
// Pasos del formulario de incidente
// ─────────────────────────────────────────────

/**
 * Identificadores de los 4 pasos del formulario de incidente
 * dentro del StepWizard (AI_GUIDELINES §7).
 *
 * Cada paso corresponde a un campo de texto separado:
 * - `context`: alumnos, infraestructura, conocimientos previos.
 * - `description`: narración del hecho ocurrido.
 * - `actors`: actores involucrados y su influencia.
 * - `relevance`: significancia pedagógica del incidente.
 */
export type IncidentStep = 'context' | 'description' | 'actors' | 'relevance';

/** Metadatos de un paso del formulario, usados por el StepWizard. */
export interface IncidentStepInfo {
  /** Identificador del paso. */
  id: IncidentStep;
  /** Título visible en la interfaz (español). */
  title: string;
  /** Instrucción breve para orientar al estudiante (español). */
  instruction: string;
  /** Texto placeholder del campo de texto (español). */
  placeholder: string;
  /** Número ordinal del paso (1–4). */
  order: number;
}

/**
 * Definición de los 4 pasos del formulario de incidente crítico.
 *
 * Fuente: AI_GUIDELINES §7 — "un paso o campo de texto separado
 * para cada uno de Contexto, Descripción del hecho, Actores e
 * influencia y Relevancia pedagógica."
 */
export const INCIDENT_STEPS: IncidentStepInfo[] = [
  {
    id: 'context',
    title: 'Contexto',
    instruction:
      'Describe las características de los alumnos, la infraestructura ' +
      'disponible y los conocimientos previos relevantes para el incidente. ' +
      'Recuerda no incluir nombres reales.',
    placeholder:
      'Ejemplo: La clase estaba compuesta por 30 estudiantes de segundo ' +
      'ciclo básico, en un aula con recursos tecnológicos limitados...',
    order: 1,
  },
  {
    id: 'description',
    title: 'Descripción del hecho',
    instruction:
      'Narra el incidente crítico: ¿qué ocurrió exactamente? Incluye ' +
      'detalles relevantes sobre el momento, las acciones y las reacciones ' +
      'observadas. No incluyas nombres propios.',
    placeholder:
      'Ejemplo: Durante la actividad grupal de resolución de problemas, ' +
      'un grupo de estudiantes mostró una dinámica inesperada cuando...',
    order: 2,
  },
  {
    id: 'actors',
    title: 'Actores e influencia',
    instruction:
      'Identifica quiénes estuvieron involucrados en el incidente y analiza ' +
      'cómo influyó cada actor en el desarrollo de la situación. Usa roles ' +
      'genéricos (e.g. "la docente guía", "un estudiante").',
    placeholder:
      'Ejemplo: Los actores principales fueron la docente en formación, ' +
      'el grupo de estudiantes que lideró la actividad y la asistente de aula...',
    order: 3,
  },
  {
    id: 'relevance',
    title: 'Relevancia pedagógica',
    instruction:
      'Explica por qué este incidente es significativo para tu desarrollo ' +
      'profesional. ¿Qué aprendizajes puedes extraer? Conecta con ' +
      'fundamentos teóricos cuando sea posible.',
    placeholder:
      'Ejemplo: Este incidente es relevante porque evidencia la importancia ' +
      'de considerar los conocimientos previos al planificar actividades...',
    order: 4,
  },
];

// ─────────────────────────────────────────────
// Borrador del incidente
// ─────────────────────────────────────────────

/**
 * Borrador del formulario de incidente crítico.
 *
 * Se persiste en localStorage (mock) o en el backend para
 * permitir que el estudiante retome su trabajo en otra sesión.
 */
export interface IncidentDraft {
  /** ID del taller al que pertenece este borrador. */
  workshopId: string;
  /** Texto del campo Contexto. */
  context: string;
  /** Texto del campo Descripción del hecho. */
  description: string;
  /** Texto del campo Actores e influencia. */
  actors: string;
  /** Texto del campo Relevancia pedagógica. */
  relevance: string;
  /** Paso en el que se encontraba el estudiante al guardar. */
  currentStep: IncidentStep;
  /** Marca temporal ISO 8601 del último guardado. */
  savedAt: string;
  /** Si fue guardado automáticamente (true) o manualmente (false). */
  isAutoSaved: boolean;
}

/**
 * Valores iniciales de un borrador vacío.
 * Usado al iniciar un taller nuevo o al limpiar un borrador.
 */
export const EMPTY_DRAFT_FIELDS = {
  context: '',
  description: '',
  actors: '',
  relevance: '',
  currentStep: 'context' as IncidentStep,
  isAutoSaved: false,
} as const;

// ─────────────────────────────────────────────
// Retroalimentación de la IA ("El Impulso")
// ─────────────────────────────────────────────

/**
 * Pista individual de retroalimentación para un paso específico.
 *
 * La IA nunca redacta ni corrige el texto del alumno (AI_GUIDELINES §8).
 * Solo entrega orientaciones generales ("impulsos") sobre qué elementos
 * profundizar.
 */
export interface AIFeedbackHint {
  /** Identificador único de la pista. */
  id: string;
  /** Paso del formulario al que se refiere esta pista. */
  step: IncidentStep;
  /** Texto de la orientación (en español, tono amigable). */
  message: string;
}

/**
 * Respuesta completa de retroalimentación de la IA ("El Impulso").
 *
 * Se muestra en un panel con borde izquierdo en `--color-accent-ia`,
 * ícono y etiqueta "El Impulso" (AI_GUIDELINES §7).
 */
export interface AIFeedback {
  /** Identificador único de la retroalimentación. */
  id: string;
  /** ID del taller evaluado. */
  workshopId: string;
  /** Número de intento al que corresponde. */
  attemptNumber: number;
  /** Pistas específicas por paso del formulario. */
  hints: AIFeedbackHint[];
  /** Comentario general sobre el análisis del incidente. */
  generalComment: string;
  /** Marca temporal ISO 8601 de generación. */
  createdAt: string;
}

// ─────────────────────────────────────────────
// Intento de envío de taller
// ─────────────────────────────────────────────

/** Estado del intento de un taller. */
export type WorkshopAttemptStatus = 'submitted' | 'reviewed';

/**
 * Registro de un intento de envío de taller.
 *
 * Cada intento captura el contenido enviado, la retroalimentación
 * recibida de la IA y las marcas temporales.
 */
export interface WorkshopAttempt {
  /** Número de intento (1, 2 o 3). */
  attemptNumber: number;
  /** ID del taller al que pertenece este intento. */
  workshopId: string;
  /** Contenido enviado en este intento (los 4 campos del formulario). */
  content: {
    context: string;
    description: string;
    actors: string;
    relevance: string;
  };
  /** Retroalimentación de la IA (null si aún no se recibe). */
  feedback: AIFeedback | null;
  /** Estado del intento. */
  status: WorkshopAttemptStatus;
  /** Marca temporal ISO 8601 del envío. */
  submittedAt: string;
}

// ─────────────────────────────────────────────
// Configuración de los talleres
// ─────────────────────────────────────────────

/**
 * Configuración de los talleres, potencialmente ajustable
 * por el profesor guía (RF-06).
 */
export interface WorkshopConfig {
  /**
   * Máximo de intentos por taller.
   *
   * Nota: la cantidad exacta (¿2 o 3?) está pendiente de
   * confirmación (AI_GUIDELINES §11). Se usa 3 como valor
   * por defecto.
   */
  maxAttemptsPerWorkshop: number;
  /** Intervalo de auto-guardado en milisegundos. */
  autoSaveIntervalMs: number;
  /** Cantidad mínima de caracteres por campo para habilitar el envío. */
  minCharactersPerField: number;
}

/**
 * Valores por defecto de la configuración de talleres.
 *
 * Centralizados aquí para que tanto el hook como el service
 * usen los mismos valores sin duplicación.
 */
export const DEFAULT_WORKSHOP_CONFIG: WorkshopConfig = {
  maxAttemptsPerWorkshop: 3,
  autoSaveIntervalMs: 30_000,   // 30 segundos
  minCharactersPerField: 50,     // mínimo 50 caracteres por campo
};

// ─────────────────────────────────────────────
// Referencias bibliográficas (sidebar)
// ─────────────────────────────────────────────

/**
 * Referencia bibliográfica mostrada en el TheoryReferenceSidebar.
 *
 * Las referencias se filtran según el paso actual del formulario,
 * mostrando solo las pertinentes (AI_GUIDELINES §7: "referencias
 * bibliográficas y marco teórico visibles en pantalla").
 */
export interface TheoryReference {
  /** Identificador único de la referencia. */
  id: string;
  /** Autor(es) de la referencia. */
  author: string;
  /** Título de la obra o artículo. */
  title: string;
  /** Año de publicación. */
  year: number;
  /** Extracto o cita relevante (en español). */
  excerpt: string;
  /** Pasos del formulario para los cuales esta referencia es pertinente. */
  relevantSteps: IncidentStep[];
}

// ─────────────────────────────────────────────
// Contratos de servicio (API)
// ─────────────────────────────────────────────

/**
 * Payload para guardar un borrador.
 * Usado por `criticalIncidentService.saveDraft()`.
 */
export interface SaveDraftPayload {
  /** ID del taller. */
  workshopId: string;
  /** Contenido del campo Contexto. */
  context: string;
  /** Contenido del campo Descripción del hecho. */
  description: string;
  /** Contenido del campo Actores e influencia. */
  actors: string;
  /** Contenido del campo Relevancia pedagógica. */
  relevance: string;
  /** Paso actual del estudiante al momento de guardar. */
  currentStep: IncidentStep;
}

/**
 * Payload para enviar un taller completado.
 * Usado por `criticalIncidentService.submitWorkshop()`.
 */
export interface SubmitWorkshopPayload {
  /** ID del taller. */
  workshopId: string;
  /** Contenido del campo Contexto. */
  context: string;
  /** Contenido del campo Descripción del hecho. */
  description: string;
  /** Contenido del campo Actores e influencia. */
  actors: string;
  /** Contenido del campo Relevancia pedagógica. */
  relevance: string;
  /** Número de intento (1–3). */
  attemptNumber: number;
}

/**
 * Respuesta del backend al enviar un taller.
 * Incluye el intento registrado, la retroalimentación de la IA
 * y el estado actualizado del taller.
 */
export interface SubmitWorkshopResponse {
  /** Registro del intento enviado. */
  attempt: WorkshopAttempt;
  /** Retroalimentación de la IA generada para este intento. */
  feedback: AIFeedback;
  /** Estado actualizado del taller. */
  workshop: Workshop;
}

/**
 * Respuesta al solicitar la lista de talleres con su estado.
 * Usado por `criticalIncidentService.fetchWorkshops()`.
 */
export interface FetchWorkshopsResponse {
  /** Lista de los 4 talleres con su estado actual. */
  workshops: Workshop[];
  /** Configuración vigente de los talleres. */
  config: WorkshopConfig;
}
