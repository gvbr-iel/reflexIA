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
  type RubricCriterionResult,
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
  /** Nombre descriptivo del criterio para la rúbrica visible al docente. */
  label: string;
  /** Si alguno coincide, el elemento está presente. */
  patterns: RegExp[];
  /** Orientación que se muestra cuando falta el elemento. */
  message: string;
}

const STEP_RULES: Record<IncidentStep, ElementRule[]> = {
  context: [
    {
      key: 'group',
      label: 'Identificación y características del grupo de estudiantes',
      patterns: [/\d+\s*(estudiantes|alumnos|alumnas|ninos|ninas|jovenes)/, /\b(edad|edades|anos|curso|nivel|ciclo|basica|media)\b/],
      message:
        '¿Qué características tenía el grupo? Considera la cantidad aproximada de estudiantes, sus edades o el nivel que cursaban.',
    },
    {
      key: 'infrastructure',
      label: 'Contexto físico, espacio e implementos disponibles',
      patterns: [/\b(sala|aula|patio|cancha|gimnasio|espacio|infraestructura|recursos|materiales?|implementos|equipamiento|tecnologia|proyector|computador)/],
      message:
        'Falta indicar dónde ocurrió la situación y con qué infraestructura o recursos se contaba.',
    },
    {
      key: 'prior-knowledge',
      label: 'Conocimientos previos o antecedentes de la unidad',
      patterns: [/\b(previo|previos|previa|previas|ya habian|habian trabajado|conocimientos?|unidad|contenidos?|experiencia)/],
      message:
        '¿Qué sabían o habían trabajado antes los estudiantes sobre el tema de la clase?',
    },
  ],
  description: [
    {
      key: 'moment',
      label: 'Momento específico o secuencia en la que ocurrió',
      patterns: [/\b(durante|mientras|al inicio|al comenzar|cuando|en el momento|clase|actividad|sesion)\b/],
      message:
        '¿En qué momento de la clase o de la actividad ocurrió el hecho?',
    },
    {
      key: 'actions',
      label: 'Acciones objetivas y conductas de las partes',
      patterns: [/\b(hizo|hicieron|dijo|dijeron|decidio|decidieron|reacciono|respondio|intento|solicito|pidio|pidieron|comenzo|empezo|se nego|salio|discutio|ocurrio|paso|sucedio)\b/],
      message:
        'Describe qué hizo o dijo cada persona involucrada, tal como ocurrió y sin interpretarlo todavía.',
    },
    {
      key: 'outcome',
      label: 'Desenlace inmediato o consecuencias observadas',
      patterns: [/\b(consecuencias?|resultado|finalmente|termino|al final|luego|se resolvio|quedo)\b/],
      message:
        '¿Cómo terminó la situación o qué consecuencias inmediatas tuvo?',
    },
  ],
  actors: [
    {
      key: 'who',
      label: 'Identificación de actores por sus roles pedagógicos',
      patterns: [/\b(profesor|profesora|docente|estudiante|estudiantes|alumno|alumna|apoderado|apoderada|inspector|director|directora|coordinador|coordinadora|colega|asistente|companero|companera|grupo|equipo)\b/],
      message:
        '¿Quiénes participaron? Identifícalos por su rol (por ejemplo, "docente" o "Estudiante A"), sin nombres reales.',
    },
    {
      key: 'influence',
      label: 'Análisis de la influencia e interacción de cada actor',
      patterns: [/\b(influy|afect|condicion|motiv|decision|liderazgo|presion|apoyo|conflicto|incidio|determin|provoc|favorec|dificult)/],
      message:
        '¿Cómo influyó cada actor en el desarrollo del hecho? Piensa en qué facilitó o dificultó la situación.',
    },
    {
      key: 'own-role',
      label: 'Autopercepción y rol activo del practicante',
      patterns: [/\b(yo|mi|me|practicante)\b/, /\b(senti|decidi|intente|reaccione)\b/],
      message:
        '¿Cuál fue tu propio papel en lo ocurrido y cómo reaccionaste en ese momento?',
    },
  ],
  relevance: [
    {
      key: 'significance',
      label: 'Significancia formativa y aprendizaje pedagógico',
      patterns: [/\b(importante|relevante|relevancia|significativo|significa|aprendizaje|aprendi|ensenanza|pedagogico|pedagogica|comprendi|impacto)/],
      message:
        '¿Por qué este hecho es significativo para tu formación o para la enseñanza?',
    },
    {
      key: 'theory',
      label: 'Articulación con referentes teóricos (Dewey, Schön, Tripp, etc.)',
      patterns: [/\b(dewey|schon|tripp|van manen|teoria|teorico|teorica|autor|autores|marco|concepto|segun)\b/],
      message:
        'Vincula el hecho con alguno de los marcos teóricos que aparecen en la barra lateral.',
    },
    {
      key: 'future',
      label: 'Proyección futura o propuesta de mejora docente',
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

/**
 * Evalúa el cumplimiento de cada uno de los 12 criterios de la rúbrica orientativa,
 * calcula la nota sugerida de la IA (escala 1.0 a 7.0) y genera la justificación pedagógica.
 *
 * Fórmula:
 * - Escala chilena: base 1.0, máxima 7.0 (rango de 6.0 puntos).
 * - 12 criterios repartidos en los 4 pasos (0.5 pts por criterio cumplido).
 * - Si un campo no alcanza el mínimo de caracteres, sus criterios quedan en 0.
 */
function evaluateRubricAndGrade(content: ReflectionContent): {
  suggestedGrade: number;
  gradeJustification: string;
  rubricBreakdown: RubricCriterionResult[];
} {
  const breakdown: RubricCriterionResult[] = [];
  const achievedStrengths: string[] = [];
  const missingAspects: string[] = [];

  for (const info of INCIDENT_STEPS) {
    const text = content[info.id].trim();
    const isTooShort = text.length < DEFAULT_WORKSHOP_CONFIG.minCharactersPerField;
    const normalized = normalizeText(text);

    for (const rule of STEP_RULES[info.id]) {
      const isMet = !isTooShort && rule.patterns.some((pattern) => pattern.test(normalized));
      const points = isMet ? 0.5 : 0;
      breakdown.push({
        step: info.id,
        key: rule.key,
        label: rule.label,
        isMet,
        points,
        maxPoints: 0.5,
      });

      if (isMet) {
        achievedStrengths.push(`${info.title}: ${rule.label.toLowerCase()}`);
      } else {
        missingAspects.push(`${info.title}: ${rule.label.toLowerCase()}`);
      }
    }
  }

  const metCount = breakdown.filter((item) => item.isMet).length;
  // Cálculo de nota: 1.0 base + 0.5 por criterio cumplido (máx 7.0)
  const rawGrade = 1.0 + metCount * 0.5;
  const suggestedGrade = Math.min(7.0, Math.max(1.0, Math.round(rawGrade * 10) / 10));

  let performanceCategory = 'Sobresaliente';
  if (suggestedGrade < 4.0) performanceCategory = 'Reprobado';
  else if (suggestedGrade < 5.0) performanceCategory = 'Aprobado';

  const strengthsSummary =
    achievedStrengths.length > 0
      ? `Aspectos cumplidos (${achievedStrengths.length}/12): ${achievedStrengths.slice(0, 3).join('; ')}${achievedStrengths.length > 3 ? '...' : '.'}`
      : 'No se identificaron criterios suficientes en el relato.';

  const missingSummary =
    missingAspects.length > 0
      ? `Aspectos pendientes (${missingAspects.length}/12): ${missingAspects.slice(0, 3).join('; ')}${missingAspects.length > 3 ? '...' : '.'}`
      : 'Cumple con la totalidad de los indicadores previstos en la pauta orientativa.';

  const gradeJustification =
    `La IA propone una nota sugerida de ${suggestedGrade.toFixed(1)} (${performanceCategory}) ` +
    `basada en la detección de ${metCount} de 12 criterios pedagógicos en el relato. ` +
    `${strengthsSummary} ${missingSummary} ` +
    `Aviso: Esta nota es solo una estimación orientativa calculada por el sistema. ` +
    `La calificación oficial y definitiva es asignada exclusivamente por el docente guía.`;

  return {
    suggestedGrade,
    gradeJustification,
    rubricBreakdown: breakdown,
  };
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
 * Las orientaciones salen en el orden de los pasos del asistente,
 * y se calculan la nota sugerida y la justificación pedagógica orientativa.
 */
export function generateImpulse(input: GenerateImpulseInput): AIFeedback {
  const { workshopId, attemptNumber, content, createdAt } = input;

  const hints = INCIDENT_STEPS.flatMap((info) =>
    buildStepHints(info.id, content[info.id]),
  );

  const { suggestedGrade, gradeJustification, rubricBreakdown } =
    evaluateRubricAndGrade(content);

  return {
    id: `${workshopId}-impulse-${attemptNumber}`,
    workshopId,
    attemptNumber,
    hints,
    generalComment: buildGeneralComment(hints.length),
    suggestedGrade,
    gradeJustification,
    rubricBreakdown,
    createdAt: createdAt ?? new Date().toISOString(),
  };
}
