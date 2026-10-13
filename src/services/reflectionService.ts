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
 * Estado actual: **relatos de ejemplo, nota real**. Las reflexiones salen de un
 * conjunto de ejemplo (`sampleReflections`) porque los envíos reales de los
 * estudiantes viven en el almacenamiento de cada cuenta y el profesor no puede
 * leerlos sin backend. Cada una está asignada a una cuenta de prueba.
 *
 * Qué se guarda y dónde:
 * - La **nota oficial** se guarda en Cloud Firestore (`evaluations/{correo}`)
 *   al validar, con `studentEvaluationService`. Es la que ve el panel docente.
 * - Los impulsos editados, el comentario y la nota en borrador se guardan en
 *   localStorage particionado por usuario, para que sobrevivan a una recarga.
 *
 * Firestore manda sobre la nota: una reflexión solo figura como "validada"
 * si su nota está en Firestore (ver `resolveReview`).
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
import type { WorkshopEvaluation } from '../models/studentEvaluation';
import { studentEvaluationService, type WorkshopEvaluations } from './studentEvaluationService';
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

/** Evaluaciones ya leídas de Firestore (correo → notas por taller); null si aún no se leen. */
let cachedEvaluations: Map<string, WorkshopEvaluations> | null = null;

/**
 * Lee las notas oficiales desde `evaluations`.
 *
 * Guarda el resultado para no volver a leer Firestore en cada acción; con
 * `refresh` se fuerza una lectura nueva. A diferencia de los nombres, si esta
 * lectura falla sí se lanza el error: sin las notas oficiales no se puede
 * saber qué reflexiones están validadas.
 */
async function loadEvaluations(refresh = false): Promise<Map<string, WorkshopEvaluations>> {
  if (cachedEvaluations && !refresh) return cachedEvaluations;

  cachedEvaluations = await studentEvaluationService.fetchAll();
  return cachedEvaluations;
}

/** true si la fecha `a` es posterior a `b`. Una fecha ausente o inválida cuenta como "muy antigua". */
function isAfter(a: string | null, b: string | null): boolean {
  const timeA = a ? Date.parse(a) : NaN;
  const timeB = b ? Date.parse(b) : NaN;
  if (Number.isNaN(timeA)) return false;
  if (Number.isNaN(timeB)) return true;
  return timeA > timeB;
}

/**
 * Decide la revisión vigente de una reflexión, juntando tres fuentes:
 * la revisión de ejemplo, lo que el docente guardó en este navegador y la
 * nota oficial de Firestore.
 *
 * Firestore manda sobre la nota:
 * - Sin nota oficial, la reflexión nunca figura como "validada". Si el
 *   ejemplo o el navegador la tenían así, queda "editada": conserva los
 *   cambios y la nota como borrador, y basta validarla para oficializarla.
 * - Con nota oficial, figura como "validada" con esa nota.
 * - Excepción: si el docente guardó cambios en este navegador después de la
 *   última nota oficial, está corrigiendo. Se muestra su borrador ("editada")
 *   hasta que vuelva a validar; la nota oficial no cambia mientras tanto.
 */
function resolveReview(
  reflection: Reflection,
  store: ReviewStore,
  evaluations: Map<string, WorkshopEvaluations>,
): ReflectionReview {
  const stored: ReflectionReview | undefined = store[reflection.id];
  const base = stored ?? reflection.review;

  const evaluation = evaluations.get(reflection.studentEmail)?.get(reflection.workshopId);
  const officialGrade = evaluation?.grade ?? null;

  if (!evaluation || officialGrade === null) {
    return base.status === 'validated' ? { ...base, status: 'edited' } : base;
  }

  if (stored?.status === 'edited' && isAfter(stored.reviewedAt, evaluation.evaluatedAt)) {
    return stored;
  }

  return {
    ...base,
    status: 'validated',
    assignedGrade: officialGrade,
    reviewedAt: evaluation.evaluatedAt ?? base.reviewedAt,
  };
}

/** Lanza un error si no hay sesión: sin ella no se puede guardar la revisión. */
function assertSession(): void {
  if (!getUserStorageKey(STORAGE_KEY)) {
    throw new Error(
      'No pudimos guardar tu revisión porque la sesión no está activa. Inicia sesión nuevamente e inténtalo otra vez.',
    );
  }
}

/** Guarda la revisión del docente; falla si no hay sesión para guardar. */
function persistReview(reflectionId: string, review: ReflectionReview): void {
  assertSession();
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
   * Mock: reflexiones de ejemplo con las revisiones guardadas del docente y
   * las notas oficiales de Firestore.
   * Producción: GET /api/reflections
   */
  async list(): Promise<Reflection[]> {
    // TODO: Reemplazar por llamada Axios al backend
    // return axios.get<Reflection[]>('/api/reflections');

    // Al listar se vuelven a leer los nombres y las notas, por si cambiaron.
    const [names, evaluations] = await Promise.all([
      loadNames(true),
      loadEvaluations(true),
      simulateLatency(),
    ]);

    const store = readUserStorage<ReviewStore>(STORAGE_KEY) ?? {};
    return sampleReflections
      .map((reflection) =>
        withReview(reflection, resolveReview(reflection, store, evaluations), names),
      )
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

    const [names, evaluations] = await Promise.all([
      loadNames(),
      loadEvaluations(),
      simulateLatency(),
    ]);

    const reflection = findSample(reflectionId);
    const store = readUserStorage<ReviewStore>(STORAGE_KEY) ?? {};
    return withReview(reflection, resolveReview(reflection, store, evaluations), names);
  },

  /**
   * Guarda los cambios del profesor sobre los impulsos, el comentario
   * general y la nota real borrador. La reflexión queda "editada" y debe
   * validarse para entregarse al estudiante.
   * La propuesta original de la IA nunca se modifica.
   *
   * La nota en borrador NO se guarda en Firestore: la nota oficial solo
   * cambia al validar. Si la reflexión ya estaba validada, su nota oficial
   * anterior sigue vigente hasta que se valide de nuevo.
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
   * Primero guarda la nota oficial en Firestore (`evaluations/{correo}`) y,
   * solo si eso sale bien, marca la reflexión como validada. Así nunca queda
   * validada en pantalla sin que su nota esté guardada.
   *
   * Mock: la revisión (impulsos y comentario) persiste en localStorage.
   * Producción: POST /api/reflections/:reflectionId/validate
   */
  async validate(payload: ValidateReviewPayload): Promise<Reflection> {
    // TODO: Reemplazar por llamada Axios al backend
    // return axios.post<Reflection>(`/api/reflections/${payload.reflectionId}/validate`);

    const [names, evaluations] = await Promise.all([
      loadNames(),
      loadEvaluations(),
      simulateLatency(),
    ]);

    // Sin sesión no se podría guardar la revisión: se avisa antes de tocar Firestore.
    assertSession();

    const reflection = findSample(payload.reflectionId);
    const store = readUserStorage<ReviewStore>(STORAGE_KEY) ?? {};
    const review = resolveReview(reflection, store, evaluations);

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

    // 1) La nota oficial va primero a Firestore. Si falla, no se valida nada.
    let evaluation: WorkshopEvaluation;
    try {
      evaluation = await studentEvaluationService.saveWorkshopGrade({
        email: reflection.studentEmail,
        workshopId: reflection.workshopId,
        grade: gradeToValidate,
      });
    } catch (error) {
      console.error('No se pudo guardar la nota en Firestore:', error);
      throw new Error(
        'No se pudo guardar la nota, así que la reflexión no quedó validada. ' +
          'Verifica tu conexión e inténtalo nuevamente.',
      );
    }

    // Se actualiza la copia en memoria para que la lista refleje la nota nueva.
    const studentEvaluations: WorkshopEvaluations =
      evaluations.get(reflection.studentEmail) ?? new Map();
    studentEvaluations.set(reflection.workshopId, evaluation);
    evaluations.set(reflection.studentEmail, studentEvaluations);

    // 2) Con la nota ya guardada, se marca la revisión como validada.
    const validated: ReflectionReview = {
      ...review,
      status: 'validated',
      assignedGrade: gradeToValidate,
      gradeNotes: (payload.gradeNotes !== undefined ? payload.gradeNotes : review.gradeNotes)?.trim() ?? '',
      reviewedAt: evaluation.evaluatedAt ?? new Date().toISOString(),
    };
    persistReview(reflection.id, validated);
    return withReview(reflection, validated, names);
  },
};
