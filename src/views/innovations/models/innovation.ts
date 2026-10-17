import type { WorkshopId } from '../../../models/workshopStructure';

export interface InnovationCase {
  id: string;
  workshopId: WorkshopId;
  grade: number | null;
  isExample: boolean;
  title: string;
  summary: string;
  productType: string;
  work: string;
  tags: string[];
  publishedAt: string;
}

export interface WorkshopWorkResponse {
  prompt: string;
  response: string;
  type: 'multiple-choice' | 'open-ended';
}

export interface WorkshopSubmission {
  id: string;
  studentEmail: string;
  workshopId: WorkshopId;
  submittedAt: string;
  content: {
    context: string;
    description: string;
    actors: string;
    relevance: string;
  };
  responses: WorkshopWorkResponse[];
  publishedInnovationId: string | null;
  grade: number | null;
  gradeConflict: boolean;
  conflictingGrade: number | null;
}

export interface PublishInnovationPayload {
  submissionId: string;
  title: string;
  summary: string;
  productType: string;
  work: string;
  tags: string[];
  privacyReviewed: boolean;
}

export const WORKSHOP_TITLES: Record<WorkshopId, string> = {
  'workshop-1': 'Taller 1 · Identificar',
  'workshop-2': 'Taller 2 · Analizar',
  'workshop-3': 'Taller 3 · Teorizar',
  'workshop-4': 'Taller 4 · Transformar',
};

export const INNOVATION_TAG_SUGGESTIONS: Record<WorkshopId, string[]> = {
  'workshop-1': [
    'Participación estudiantil',
    'Inclusión',
    'Convivencia',
    'Gestión del tiempo',
    'Comprensión del contexto',
    'Reflexión sobre la práctica',
  ],
  'workshop-2': [
    'Planificación y realidad',
    'Decisiones pedagógicas',
    'Análisis de causas',
    'Factores contextuales',
    'Aprendizaje estudiantil',
    'Reflexión crítica',
  ],
  'workshop-3': [
    'Fundamentación teórica',
    'Teoría y práctica',
    'Mapa conceptual',
    'Diálogo profesional',
    'Reflexión crítica',
    'Desarrollo profesional',
  ],
  'workshop-4': [
    'Intervención pedagógica',
    'Transformación de la práctica',
    'Inclusión',
    'Evaluación formativa',
    'Participación estudiantil',
    'Mejora continua',
  ],
};

export const INNOVATION_COLLECTION = 'publishedInnovations';
export const WORKSHOP_SUBMISSIONS_COLLECTION = 'workshopSubmissions';
