/**
 * @module utils/impulseGenerator
 *
 * Generador SIMULADO de "El Impulso" (HU-02, RF-02).
 *
 * Sustituye a la IA real mientras no exista backend: revisa el texto de los
 * 4 pasos del incidente con reglas simples y devuelve orientaciones sobre qué
 * elementos faltan. Lo usan el panel del profesor (impulsos de ejemplo) y el
 * asistente del estudiante (botón "Pedir impulso").
 *
 * Reglas que respeta (AI_GUIDELINES §8):
 * - NUNCA redacta ni corrige el texto del alumno: cada orientación es una
 *   pregunta o una indicación general, y no copia fragmentos del relato.
 * - Solo señala omisiones de contexto, actores e infraestructura, y de los
 *   demás pasos, sin entregar la respuesta.
 *
 * Es una función pura: con la misma entrada devuelve la misma salida, salvo la
 * marca de tiempo, que se puede fijar con `createdAt`.
 */

import {
  DEFAULT_WORKSHOP_CONFIG,
  INCIDENT_STEPS,
  type AIFeedback,
  type AIFeedbackHint,
  type IncidentStep,
} from '../models/criticalIncident';
import type { ReflectionContent } from '../models/reflection';

// ─────────────────────────────────────────────
// Reglas por paso
// ─────────────────────────────────────────────

/**
 * Elemento que debería aparecer en un paso. Si ninguno de los patrones
 * coincide con el texto, se emite la orientación `message`.
 * Los patrones se escriben sin tildes: el texto se normaliza antes de revisarlo.
 */
interface ElementRule {
  /** Identificador del elemento dentro del paso. */
  key: string;
  /** Si alguno coincide, el elemento está presente. */
  patterns: RegExp[];
  /** Orientación que se muestra cuando falta el elemento. */
  message: string;
}

const STEP_RULES: Record<IncidentStep, ElementRule[]> = {
  context: [
    {
      key: 'group',
      patterns: [/\d+\s*(estudiantes|alumnos|alumnas|ninos|ninas|jovenes)/, /\b(edad|edades|anos|curso|nivel|ciclo|basica|media)\b/],
      message:
        '¿Qué características tenía el grupo? Considera la cantidad aproximada de estudiantes, sus edades o el nivel que cursaban.',
    },
    {
      key: 'infrastructure',
      patterns: [/\b(sala|aula|patio|cancha|gimnasio|espacio|infraestructura|recursos|materiales?|implementos|equipamiento|tecnologia|proyector|computador)/],
      message:
        'Falta indicar dónde ocurrió la situación y con qué infraestructura o recursos se contaba.',
    },
    {
      key: 'prior-knowledge',
      patterns: [/\b(previo|previos|previa|previas|ya habian|habian trabajado|conocimientos?|unidad|contenidos?|experiencia)/],
      message:
        '¿Qué sabían o habían trabajado antes los estudiantes sobre el tema de la clase?',
    },
  ],
  description: [
    {
      key: 'moment',
      patterns: [/\b(durante|mientras|al inicio|al comenzar|cuando|en el momento|clase|actividad|sesion)\b/],
      message:
        '¿En qué momento de la clase o de la actividad ocurrió el hecho?',
    },
    {
      key: 'actions',
      patterns: [/\b(hizo|hicieron|dijo|dijeron|decidio|decidieron|reacciono|respondio|intento|solicito|pidio|pidieron|comenzo|empezo|se nego|salio|discutio|ocurrio|paso|sucedio)\b/],
      message:
        'Describe qué hizo o dijo cada persona involucrada, tal como ocurrió y sin interpretarlo todavía.',
    },
    {
      key: 'outcome',
      patterns: [/\b(consecuencias?|resultado|finalmente|termino|al final|luego|se resolvio|quedo)\b/],
      message:
        '¿Cómo terminó la situación o qué consecuencias inmediatas tuvo?',
    },
  ],
  actors: [
    {
      key: 'who',
      patterns: [/\b(profesor|profesora|docente|estudiante|estudiantes|alumno|alumna|apoderado|apoderada|inspector|director|directora|coordinador|coordinadora|colega|asistente|companero|companera|grupo|equipo)\b/],
      message:
        '¿Quiénes participaron? Identifícalos por su rol (por ejemplo, "docente" o "Estudiante A"), sin nombres reales.',
    },
    {
      key: 'influence',
      patterns: [/\b(influy|afect|condicion|motiv|decision|liderazgo|presion|apoyo|conflicto|incidio|determin|provoc|favorec|dificult)/],
      message:
        '¿Cómo influyó cada actor en el desarrollo del hecho? Piensa en qué facilitó o dificultó la situación.',
    },
    {
      key: 'own-role',
      patterns: [/\b(yo|mi|me|practicante)\b/, /\b(senti|decidi|intente|reaccione)\b/],
      message:
        '¿Cuál fue tu propio papel en lo ocurrido y cómo reaccionaste en ese momento?',
    },
  ],
  relevance: [
    {
      key: 'significance',
      patterns: [/\b(importante|relevante|relevancia|significativo|significa|aprendizaje|aprendi|ensenanza|pedagogico|pedagogica|comprendi|impacto)/],
      message:
        '¿Por qué este hecho es significativo para tu formación o para la enseñanza?',
    },
    {
      key: 'theory',
      patterns: [/\b(dewey|schon|tripp|van manen|teoria|teorico|teorica|autor|autores|marco|concepto|segun)\b/],
      message:
        'Vincula el hecho con alguno de los marcos teóricos que aparecen en la barra lateral.',
    },
    {
      key: 'future',
      patterns: [/\b(proximo|proxima|futuro|proponer|propongo|innovacion|estrategia|haria|podria|mejorar|cambiar|planificar)/],
      message:
        '¿Qué harías distinto o qué podrías proponer a partir de lo ocurrido?',
    },
  ],
};

/** Orientación cuando un paso está vacío o demasiado breve para evaluarlo. */
const SHORT_STEP_MESSAGE =
  'Este paso está muy breve para orientarte. Desarróllalo con más detalle y vuelve a pedir un impulso.';

// ─────────────────────────────────────────────
// Funciones auxiliares
// ─────────────────────────────────────────────

/** Pasa a minúsculas y quita tildes y la ñ para comparar con los patrones. */
function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/** Orientaciones de un paso: una sola si está muy breve, o las omisiones detectadas. */
function buildStepHints(step: IncidentStep, text: string): AIFeedbackHint[] {
  if (text.trim().length < DEFAULT_WORKSHOP_CONFIG.minCharactersPerField) {
    return [{ id: `${step}-short`, step, message: SHORT_STEP_MESSAGE }];
  }

  const normalized = normalizeText(text);
  return STEP_RULES[step]
    .filter((rule) => !rule.patterns.some((pattern) => pattern.test(normalized)))
    .map((rule) => ({ id: `${step}-${rule.key}`, step, message: rule.message }));
}

/** Comentario general según cuántos aspectos quedaron por profundizar. */
function buildGeneralComment(hintCount: number): string {
  if (hintCount === 0) {
    return (
      'Tu relato cubre los elementos principales de cada paso. Revisa que las ideas ' +
      'se conecten entre sí y que estén respaldadas por los marcos teóricos.'
    );
  }

  const aspects = hintCount === 1 ? '1 aspecto' : `${hintCount} aspectos`;
  return (
    `Encontramos ${aspects} para profundizar. Revisa las orientaciones de cada paso ` +
    'y ajusta tu relato con tus propias palabras.'
  );
}

// ─────────────────────────────────────────────
// API pública
// ─────────────────────────────────────────────

/** Datos necesarios para generar un impulso. */
export interface GenerateImpulseInput {
  /** ID del taller evaluado (e.g. "workshop-1"). */
  workshopId: string;
  /** Número de intento de revisión (1–3). */
  attemptNumber: number;
  /** Texto de los 4 pasos del incidente. */
  content: ReflectionContent;
  /** Marca temporal ISO 8601; si se omite se usa la hora actual. */
  createdAt?: string;
}

/**
 * Genera la retroalimentación simulada ("El Impulso") de un intento.
 * Las orientaciones salen en el orden de los pasos del asistente.
 */
export function generateImpulse(input: GenerateImpulseInput): AIFeedback {
  const { workshopId, attemptNumber, content, createdAt } = input;

  const hints = INCIDENT_STEPS.flatMap((info) =>
    buildStepHints(info.id, content[info.id]),
  );

  return {
    id: `${workshopId}-impulse-${attemptNumber}`,
    workshopId,
    attemptNumber,
    hints,
    generalComment: buildGeneralComment(hints.length),
    createdAt: createdAt ?? new Date().toISOString(),
  };
}
