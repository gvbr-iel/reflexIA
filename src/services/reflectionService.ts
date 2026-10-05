/**
 * @module services/reflectionService
 *
 * Capa de servicio para la Historia de Usuario 2:
 * Revisión de la retroalimentación asistida por IA (RF-02).
 *
 * Responsabilidades:
 * - Listar las reflexiones que el profesor guía debe revisar.
 * - Entregar el detalle de una reflexión con su propuesta de la IA.
 * - Guardar los cambios del profesor sobre los impulsos (estado "editada").
 * - Validar la retroalimentación (estado "validada").
 *
 * Estado actual: **mock local**. Las reflexiones salen de un conjunto de
 * ejemplo (`sampleReflections`) porque los envíos reales de los estudiantes
 * viven en el almacenamiento de cada cuenta y el profesor no puede leerlos sin
 * backend. Lo único que se guarda de verdad es la revisión del docente, en
 * localStorage particionado por usuario, para que sobreviva a recargar la página.
 * Cuando el backend esté disponible, se reemplazan las funciones internas por
 * llamadas Axios/Fetch sin cambiar la firma pública.
 *
 * Regla R4 (AI_GUIDELINES §9): las vistas y componentes NO llaman a la API
 * directamente; lo hacen a través de este servicio (vía los hooks de la vista).
 */

import type {
  Reflection,
  ReflectionReview,
  SaveReviewEditPayload,
  ValidateReviewPayload,
} from '../models/reflection';
import { sampleReflections } from '../views/reflections/data/reflections';
import { getUserStorageKey, readUserStorage, writeUserStorage } from '../utils/userStorage';

// ─────────────────────────────────────────────
// Clave de localStorage (mock temporal)
// ─────────────────────────────────────────────

const STORAGE_KEY = 'reflexia_reflection_reviews';

/** Revisiones del docente indexadas por `reflectionId`. */
type ReviewStore = Record<string, ReflectionReview>;

/** Espera simulada (ms) para que los estados de carga sean visibles. */
const SIMULATED_LATENCY_MS = 400;

// ─────────────────────────────────────────────
// Utilidades internas
// ─────────────────────────────────────────────

/** Simula el tiempo de respuesta de una llamada de red. */
function simulateLatency(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
}

/** Busca una reflexión de ejemplo; lanza un error si no existe. */
function findSample(reflectionId: string): Reflection {
  const reflection = sampleReflections.find((item) => item.id === reflectionId);
  if (!reflection) {
    throw new Error(`La reflexión "${reflectionId}" no existe.`);
  }
  return reflection;
}

/** Devuelve la reflexión con la revisión indicada, copiando los impulsos. */
function withReview(reflection: Reflection, review: ReflectionReview): Reflection {
  return {
    ...reflection,
    review: { ...review, hints: review.hints.map((hint) => ({ ...hint })) },
  };
}

/** Lee la revisión vigente: la guardada por el docente o la de ejemplo. */
function currentReview(reflection: Reflection, store: ReviewStore): ReflectionReview {
  return store[reflection.id] ?? reflection.review;
}

/** Guarda la revisión del docente; falla si no hay sesión para guardar. */
function persistReview(reflectionId: string, review: ReflectionReview): void {
  if (!getUserStorageKey(STORAGE_KEY)) {
    throw new Error(
      'No pudimos guardar tu revisión porque la sesión no está activa. Inicia sesión nuevamente e inténtalo otra vez.',
    );
  }
  const store = readUserStorage<ReviewStore>(STORAGE_KEY) ?? {};
  store[reflectionId] = review;
  writeUserStorage(STORAGE_KEY, store);
}

// ─────────────────────────────────────────────
// Servicio público
// ─────────────────────────────────────────────

/**
 * Servicio de revisión de reflexiones por el profesor guía.
 *
 * Firma estable: cuando el backend esté listo, se reemplazan
 * los cuerpos de cada método sin cambiar la interfaz pública.
 */
export const reflectionService = {
  /**
   * Lista las reflexiones por revisar, de la más reciente a la más antigua.
   *
   * Mock: reflexiones de ejemplo con las revisiones guardadas del docente.
   * Producción: GET /api/reflections
   */
  async list(): Promise<Reflection[]> {
    // TODO: Reemplazar por llamada Axios al backend
    // return axios.get<Reflection[]>('/api/reflections');

    await simulateLatency();

    const store = readUserStorage<ReviewStore>(STORAGE_KEY) ?? {};
    return sampleReflections
      .map((reflection) => withReview(reflection, currentReview(reflection, store)))
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  },

  /**
   * Obtiene el detalle de una reflexión con su propuesta de la IA.
   *
   * Mock: busca en las reflexiones de ejemplo.
   * Producción: GET /api/reflections/:reflectionId
   */
  async get(reflectionId: string): Promise<Reflection> {
    // TODO: Reemplazar por llamada Axios al backend
    // return axios.get<Reflection>(`/api/reflections/${reflectionId}`);

    await simulateLatency();

    const reflection = findSample(reflectionId);
    const store = readUserStorage<ReviewStore>(STORAGE_KEY) ?? {};
    return withReview(reflection, currentReview(reflection, store));
  },

  /**
   * Guarda los cambios del profesor sobre los impulsos y el comentario
   * general. La reflexión queda "editada" y debe validarse para entregarse.
   * La propuesta original de la IA nunca se modifica.
   *
   * Mock: persiste en localStorage.
   * Producción: PUT /api/reflections/:reflectionId/review
   */
  async saveEdit(payload: SaveReviewEditPayload): Promise<Reflection> {
    // TODO: Reemplazar por llamada Axios al backend
    // return axios.put<Reflection>(`/api/reflections/${payload.reflectionId}/review`, payload);

    await simulateLatency();

    const reflection = findSample(payload.reflectionId);

    const hints = payload.hints.map((hint) => ({ ...hint, message: hint.message.trim() }));
    if (hints.some((hint) => hint.message === '')) {
      throw new Error(
        'Hay un impulso sin texto. Escribe la orientación o elimínalo antes de guardar.',
      );
    }
    const generalComment = payload.generalComment.trim();
    if (generalComment === '') {
      throw new Error('El comentario general está vacío. Escribe una orientación general para continuar.');
    }

    const review: ReflectionReview = {
      status: 'edited',
      hints,
      generalComment,
      reviewedAt: new Date().toISOString(),
    };
    persistReview(reflection.id, review);
    return withReview(reflection, review);
  },

  /**
   * Valida la retroalimentación vigente (la de la IA o la editada por el
   * docente). Queda lista para entregarse al estudiante.
   *
   * Mock: persiste en localStorage.
   * Producción: POST /api/reflections/:reflectionId/validate
   */
  async validate(payload: ValidateReviewPayload): Promise<Reflection> {
    // TODO: Reemplazar por llamada Axios al backend
    // return axios.post<Reflection>(`/api/reflections/${payload.reflectionId}/validate`);

    await simulateLatency();

    const reflection = findSample(payload.reflectionId);
    const store = readUserStorage<ReviewStore>(STORAGE_KEY) ?? {};
    const review = currentReview(reflection, store);

    // Validar dos veces no cambia nada: se conserva la fecha original.
    if (review.status === 'validated') {
      return withReview(reflection, review);
    }

    const validated: ReflectionReview = {
      ...review,
      status: 'validated',
      reviewedAt: new Date().toISOString(),
    };
    persistReview(reflection.id, validated);
    return withReview(reflection, validated);
  },
};
