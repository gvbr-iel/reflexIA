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
import { studentProfileService } from './studentProfileService';

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

/** Nombres ya leídos de Firestore (correo → nombre); null si aún no se leen. */
let cachedNames: Map<string, string> | null = null;

/**
 * Lee los nombres de los estudiantes desde `profiles`.
 *
 * Guarda el resultado para no volver a leer Firestore en cada acción; con
 * `refresh` se fuerza una lectura nueva. Si la lectura falla (sin red o sin
 * permiso) no interrumpe la revisión: se usan los nombres que ya hubiera y,
 * a falta de nombre, la pantalla muestra el correo.
 */
async function loadNames(refresh = false): Promise<Map<string, string>> {
  if (cachedNames && !refresh) return cachedNames;

  try {
    cachedNames = await studentProfileService.fetchNames();
    return cachedNames;
  } catch (error) {
    console.warn('No se pudieron leer los nombres de los estudiantes:', error);
    return cachedNames ?? new Map();
  }
}

/**
 * Devuelve la reflexión con la revisión indicada (copiando los impulsos) y
 * con el nombre del estudiante, si tiene un perfil cargado.
 */
function withReview(
  reflection: Reflection,
  review: ReflectionReview,
  names: Map<string, string>,
): Reflection {
  return {
    ...reflection,
    studentName: names.get(reflection.studentEmail) ?? null,
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

    // Al listar se vuelven a leer los nombres, por si cambió algún perfil.
    const [names] = await Promise.all([loadNames(true), simulateLatency()]);

    const store = readUserStorage<ReviewStore>(STORAGE_KEY) ?? {};
    return sampleReflections
      .map((reflection) => withReview(reflection, currentReview(reflection, store), names))
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

    const [names] = await Promise.all([loadNames(), simulateLatency()]);

    const reflection = findSample(reflectionId);
    const store = readUserStorage<ReviewStore>(STORAGE_KEY) ?? {};
    return withReview(reflection, currentReview(reflection, store), names);
  },

  /**
   * Guarda los cambios del profesor sobre los impulsos, el comentario
   * general y la nota real borrador. La reflexión queda "editada" y debe
   * validarse para entregarse al estudiante.
   * La propuesta original de la IA nunca se modifica.
   *
   * Mock: persiste en localStorage.
   * Producción: PUT /api/reflections/:reflectionId/review
   */
  async saveEdit(payload: SaveReviewEditPayload): Promise<Reflection> {
    // TODO: Reemplazar por llamada Axios al backend
    // return axios.put<Reflection>(`/api/reflections/${payload.reflectionId}/review`, payload);

    const [names] = await Promise.all([loadNames(), simulateLatency()]);

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

    if (payload.assignedGrade !== null) {
      if (
        isNaN(payload.assignedGrade) ||
        payload.assignedGrade < 1.0 ||
        payload.assignedGrade > 7.0
      ) {
        throw new Error('La nota real debe estar dentro de la escala chilena (entre 1.0 y 7.0).');
      }
    }

    const review: ReflectionReview = {
      status: 'edited',
      hints,
      generalComment,
      assignedGrade: payload.assignedGrade,
      gradeNotes: payload.gradeNotes?.trim() ?? '',
      reviewedAt: new Date().toISOString(),
    };
    persistReview(reflection.id, review);
    return withReview(reflection, review, names);
  },

  /**
   * Valida la retroalimentación y la calificación definitiva asignada por el docente.
   * La nota oficial es potestad exclusiva del docente: la IA nunca califica automáticamente.
   *
   * Mock: persiste en localStorage.
   * Producción: POST /api/reflections/:reflectionId/validate
   */
  async validate(payload: ValidateReviewPayload): Promise<Reflection> {
    // TODO: Reemplazar por llamada Axios al backend
    // return axios.post<Reflection>(`/api/reflections/${payload.reflectionId}/validate`);

    const [names] = await Promise.all([loadNames(), simulateLatency()]);

    const reflection = findSample(payload.reflectionId);
    const store = readUserStorage<ReviewStore>(STORAGE_KEY) ?? {};
    const review = currentReview(reflection, store);

    const gradeToValidate = payload.assignedGrade ?? review.assignedGrade;
    if (
      gradeToValidate === null ||
      isNaN(gradeToValidate) ||
      gradeToValidate < 1.0 ||
      gradeToValidate > 7.0
    ) {
      throw new Error(
        'Debes ingresar la nota real del estudiante (entre 1.0 y 7.0) antes de validar. La calificación debe ser asignada por el docente.',
      );
    }

    const validated: ReflectionReview = {
      ...review,
      status: 'validated',
      assignedGrade: gradeToValidate,
      gradeNotes: (payload.gradeNotes !== undefined ? payload.gradeNotes : review.gradeNotes)?.trim() ?? '',
      reviewedAt: new Date().toISOString(),
    };
    persistReview(reflection.id, validated);
    return withReview(reflection, validated, names);
  },
};
