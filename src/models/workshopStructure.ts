/**
 * Configuración editable de la estructura de cada taller.
 *
 * Los documentos se guardan en `workshopConfigurations/{workshopId}`.
 */

export const WORKSHOP_IDS = [
  'workshop-1',
  'workshop-2',
  'workshop-3',
  'workshop-4',
] as const;

export type WorkshopId = (typeof WORKSHOP_IDS)[number];

export const WORKSHOP_SECTIONS = [
  {
    id: 'objectives-context',
    label: 'Objetivos y contexto',
    description: 'Propósito formativo y contexto del trabajo.',
  },
  {
    id: 'incident-form',
    label: 'Reconstrucción del incidente',
    description: 'Formulario o mecanismo de entrada para el estudiante.',
  },
  {
    id: 'theory-framework',
    label: 'Marco teórico',
    description: 'Referencias y conceptos para complementar el análisis.',
  },
  {
    id: 'peer-feedback',
    label: 'Retroalimentación de pares',
    description: 'Espacio para recibir aportes de otros estudiantes.',
  },
  {
    id: 'evaluation-rubric',
    label: 'Rúbrica y escala de evaluación',
    description: 'Criterios y escala usados para evaluar el producto.',
  },
  {
    id: 'prompt-bank',
    label: 'Banco de prompts y análisis',
    description: 'Preguntas orientadoras para analizar la práctica.',
  },
] as const;

export type WorkshopSectionId = (typeof WORKSHOP_SECTIONS)[number]['id'];
export type WorkshopEvaluationType = 'text' | 'matrix' | 'multiple-choice' | 'file';

export interface WorkshopSectionSetting {
  id: WorkshopSectionId;
  enabled: boolean;
  order: number;
}

export interface WorkshopChoiceQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
}

export interface WorkshopFormSchema {
  guidingQuestions: string[];
  matrixRows: string[];
  questions: WorkshopChoiceQuestion[];
}

export interface WorkshopStructureConfiguration {
  workshopId: WorkshopId;
  /** Firestore students must never receive the private answer key. */
  answerKeyPrivate: true;
  sections: WorkshopSectionSetting[];
  evaluationType: WorkshopEvaluationType;
  formSchema: WorkshopFormSchema;
  updatedAt: string | null;
  updatedBy: string | null;
}

export type WorkshopStudentConfiguration = Omit<WorkshopStructureConfiguration, 'formSchema'> & {
  formSchema: Omit<WorkshopFormSchema, 'questions'> & {
    questions: Omit<WorkshopChoiceQuestion, 'correctOptionIndex'>[];
  };
};

export const WORKSHOP_EVALUATION_TYPES: {
  id: WorkshopEvaluationType;
  label: string;
  description: string;
}[] = [
  {
    id: 'text',
    label: 'Texto o relato',
    description: 'Ficha del incidente o relato descriptivo en texto libre.',
  },
  {
    id: 'matrix',
    label: 'Matriz estructurada',
    description: 'Tabla o matriz con filas orientadoras personalizables.',
  },
  {
    id: 'multiple-choice',
    label: 'Alternativas',
    description: 'Cuestionario con preguntas, opciones y respuesta correcta.',
  },
  {
    id: 'file',
    label: 'Archivo o diagrama',
    description: 'Instrucciones para adjuntar documentos o elaborar un diagrama.',
  },
];

const DEFAULT_GUIDING_QUESTIONS = [
  '¿Qué ocurrió y en qué contexto?',
  '¿Qué elementos de la práctica consideras relevantes?',
  '¿Qué aprendizaje o pregunta te deja esta experiencia?',
];

const DEFAULT_MATRIX_ROWS = [
  'Situación observada',
  'Contradicción o dilema pedagógico',
  'Interpretación y fundamento teórico',
];

export function createDefaultWorkshopConfiguration(
  workshopId: WorkshopId,
): WorkshopStructureConfiguration {
  return {
    workshopId,
    answerKeyPrivate: true,
    sections: WORKSHOP_SECTIONS.map((section, order) => ({
      id: section.id,
      enabled: true,
      order,
    })),
    evaluationType: 'text',
    formSchema: {
      guidingQuestions: [...DEFAULT_GUIDING_QUESTIONS],
      matrixRows: [...DEFAULT_MATRIX_ROWS],
      questions: [],
    },
    updatedAt: null,
    updatedBy: null,
  };
}

export function isWorkshopId(value: string): value is WorkshopId {
  return WORKSHOP_IDS.some((id) => id === value);
}

export function toStudentWorkshopConfiguration(
  configuration: WorkshopStructureConfiguration,
): WorkshopStudentConfiguration {
  return {
    ...configuration,
    formSchema: {
      guidingQuestions: [...configuration.formSchema.guidingQuestions],
      matrixRows: [...configuration.formSchema.matrixRows],
      questions: configuration.formSchema.questions.map(({ correctOptionIndex: _, ...question }) => ({
        ...question,
        options: [...question.options],
      })),
    },
  };
}

export function validateWorkshopConfiguration(
  value: unknown,
): string | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return 'La configuración del taller no tiene un formato válido.';
  }
  const configuration = value as Partial<WorkshopStructureConfiguration>;
  const allowedKeys = [
    'workshopId',
    'answerKeyPrivate',
    'sections',
    'evaluationType',
    'formSchema',
    'updatedAt',
    'updatedBy',
  ];
  if (Object.keys(value).some((key) => !allowedKeys.includes(key))) {
    return 'La configuración contiene campos no reconocidos.';
  }

  if (typeof configuration.workshopId !== 'string' || !isWorkshopId(configuration.workshopId)) {
    return 'El identificador del taller no es válido.';
  }
  if (configuration.answerKeyPrivate !== true) {
    return 'La pauta de respuestas debe mantenerse privada para estudiantes.';
  }

  if (
    !Array.isArray(configuration.sections) ||
    configuration.sections.length !== WORKSHOP_SECTIONS.length
  ) {
    return 'La lista de secciones no es válida.';
  }
  const sectionRecords = configuration.sections as unknown[];
  if (
    sectionRecords.some(
      (section) => typeof section !== 'object' || section === null || Array.isArray(section),
    )
  ) {
    return 'La lista de secciones no es válida.';
  }
  const sections = sectionRecords as WorkshopSectionSetting[];
  if (
    sections.some((section) =>
      Object.keys(section).some((key) => !['id', 'enabled', 'order'].includes(key)),
    ) ||
    new Set(sections.map((section) => section.id)).size !== WORKSHOP_SECTIONS.length ||
    sections.some(
      (section) =>
        !WORKSHOP_SECTIONS.some((known) => known.id === section.id) ||
        typeof section.enabled !== 'boolean' ||
        !Number.isInteger(section.order) ||
        section.order < 0 ||
        section.order >= WORKSHOP_SECTIONS.length,
    ) ||
    new Set(sections.map((section) => section.order)).size !== WORKSHOP_SECTIONS.length
  ) {
    return 'La lista de secciones no es válida.';
  }

  if (
    typeof configuration.evaluationType !== 'string' ||
    !WORKSHOP_EVALUATION_TYPES.some((type) => type.id === configuration.evaluationType)
  ) {
    return 'El formato de entrada no es válido.';
  }

  if (
    typeof configuration.formSchema !== 'object' ||
    configuration.formSchema === null ||
    Array.isArray(configuration.formSchema)
  ) {
    return 'El contenido del formulario no es válido.';
  }
  if (
    Object.keys(configuration.formSchema).some(
      (key) => !['guidingQuestions', 'matrixRows', 'questions'].includes(key),
    )
  ) {
    return 'El contenido del formulario contiene campos no reconocidos.';
  }
  const { guidingQuestions, matrixRows, questions } = configuration.formSchema;
  if (
    !Array.isArray(guidingQuestions) ||
    guidingQuestions.length > 30 ||
    guidingQuestions.some(
      (question) =>
        typeof question !== 'string' || question.trim().length === 0 || question.trim().length > 500,
    ) ||
    !Array.isArray(matrixRows) ||
    matrixRows.length > 30 ||
    matrixRows.some(
      (row) => typeof row !== 'string' || row.trim().length === 0 || row.trim().length > 200,
    ) ||
    !Array.isArray(questions) ||
    questions.length > 30
  ) {
    return 'El contenido del formulario excede los límites permitidos o no es válido.';
  }

  if (
    (configuration.updatedAt !== null && typeof configuration.updatedAt !== 'string') ||
    (configuration.updatedBy !== null && typeof configuration.updatedBy !== 'string')
  ) {
    return 'Los datos de auditoría de la configuración no son válidos.';
  }

  for (const question of questions as unknown[]) {
    if (
      typeof question !== 'object' ||
      question === null ||
      Array.isArray(question) ||
      Object.keys(question).some(
        (key) => !['id', 'prompt', 'options', 'correctOptionIndex'].includes(key),
      )
    ) {
      return 'Cada pregunta debe tener un formato válido.';
    }
    const item = question as WorkshopChoiceQuestion;
    if (
      typeof item.id !== 'string' ||
      item.id.length === 0 ||
      typeof item.prompt !== 'string' ||
      item.prompt.trim().length === 0 ||
      item.prompt.length > 500 ||
      !Array.isArray(item.options) ||
      item.options.length < 2 ||
      item.options.length > 6 ||
      item.options.some((option) => typeof option !== 'string' || option.trim().length === 0 || option.length > 300) ||
      !Number.isInteger(item.correctOptionIndex) ||
      item.correctOptionIndex < 0 ||
      item.correctOptionIndex >= item.options.length
    ) {
      return 'Cada pregunta debe tener texto, entre dos y seis alternativas y una respuesta correcta.';
    }
  }
  if (new Set((questions as WorkshopChoiceQuestion[]).map((question) => question.id)).size !== questions.length) {
    return 'Los identificadores de las preguntas deben ser únicos.';
  }

  return null;
}
