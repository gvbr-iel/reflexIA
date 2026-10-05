/**
 * @module services/criticalIncidentService
 *
 * Capa de servicio para la Historia de Usuario 3:
 * Análisis Estructurado de Incidentes Críticos (RF-03).
 *
 * Responsabilidades:
 * - Listar los 4 talleres con su estado en el flujo lineal.
 * - Leer, guardar y descartar el borrador de un taller.
 * - Entregar las referencias bibliográficas del panel lateral.
 * - Pedir un impulso de la IA y registrar el intento (HU-02, `requestImpulse`).
 * - Simular el resultado de un taller (solo mock; ver `simulateWorkshopResult`).
 *
 * Estado actual: **mock local con localStorage**.
 * Cuando el backend esté disponible, se reemplazan las funciones
 * internas por llamadas Axios/Fetch sin cambiar la firma pública.
 *
 * Regla R4 (AI_GUIDELINES §9): las vistas y componentes NO llaman
 * a la API directamente; lo hacen a través de este servicio.
 *
 * Este servicio NO conoce HU-04. El bloqueo por aprobación del marco
 * teórico se resuelve en un único punto: el hook `useTheoryGate`.
 */

import type {
  Workshop,
  WorkshopStatus,
  WorkshopOutcome,
  WorkshopAttempt,
  IncidentDraft,
  IncidentStep,
  TheoryReference,
  SaveDraftPayload,
  SubmitWorkshopPayload,
  SubmitWorkshopResponse,
  FetchWorkshopsResponse,
} from '../models/criticalIncident';

import { DEFAULT_WORKSHOP_CONFIG, INCIDENT_STEPS } from '../models/criticalIncident';
import { generateImpulse } from '../utils/impulseGenerator';
import { getUserStorageKey, readUserStorage, writeUserStorage } from '../utils/userStorage';

// ─────────────────────────────────────────────
// Claves de localStorage (mock temporal)
// ─────────────────────────────────────────────

const STORAGE_KEYS = {
  DRAFTS: 'reflexia_incident_drafts',
  ATTEMPTS: 'reflexia_incident_attempts',
  RESULTS: 'reflexia_incident_results',
} as const;

/** Borradores indexados por `workshopId` (uno por taller). */
type DraftStore = Record<string, IncidentDraft>;

/** Intentos de envío indexados por `workshopId`. */
type AttemptStore = Record<string, WorkshopAttempt[]>;

/** Resultado de cada taller completado, indexado por `workshopId`. */
type ResultStore = Record<string, { outcome: WorkshopOutcome; resolvedAt: string }>;

// ─────────────────────────────────────────────
// Definición de los talleres (mock)
// ─────────────────────────────────────────────
// TODO: Reemplazar por endpoint GET /api/critical-incidents/workshops.
// Esta es la única fuente de la lista de talleres: la usan el asistente de
// incidentes críticos y la lista de talleres (RepositoryView).
// [POR DEFINIR] Temas, descripciones y plazos provisionales, tomados de la
// lista de talleres que se hizo en HU-04 (AI_GUIDELINES §6 no los define).
// Validar con la profesora guía, en particular si cada taller es una etapa
// distinta del incidente o un incidente completo trabajado con el asistente
// de 4 pasos. Los plazos los configurará el profesor guía (RF-06).

const WORKSHOP_DEFINITIONS: Pick<
  Workshop,
  'id' | 'number' | 'title' | 'topic' | 'subtitle' | 'description' | 'deadline'
>[] = [
  {
    id: 'workshop-1',
    number: 1,
    title: 'Taller 1',
    topic: 'Contexto e inicio del incidente',
    subtitle: 'Alumnos, infraestructura y conocimientos previos',
    description:
      'Describe el escenario donde ocurrió el evento significativo, ' +
      'caracterizando el entorno educativo y las condiciones previas.',
    deadline: '2026-10-15',
  },
  {
    id: 'workshop-2',
    number: 2,
    title: 'Taller 2',
    topic: 'Descripción del hecho y actores',
    subtitle: 'Cronología y personas involucradas',
    description:
      'Relata los acontecimientos objetivos sin juicios prematuros, ' +
      'identificando a los actores y sus roles e influencias.',
    deadline: '2026-10-22',
  },
  {
    id: 'workshop-3',
    number: 3,
    title: 'Taller 3',
    topic: 'Relevancia pedagógica y dilema',
    subtitle: 'Fundamentación con Schön y literatura',
    description:
      'Analiza el fondo pedagógico del incidente conectándolo con ' +
      'conceptos teóricos de la reflexión profesional.',
    deadline: '2026-10-29',
  },
  {
    id: 'workshop-4',
    number: 4,
    title: 'Taller 4',
    topic: 'Propuesta de innovación y cambio',
    subtitle: 'Actuación mejorada y transformación',
    description:
      'Diseña una alternativa de intervención transformadora que ' +
      'responda al dilema detectado en la práctica.',
    deadline: '2026-11-05',
  },
];

// ─────────────────────────────────────────────
// Referencias bibliográficas (mock)
// ─────────────────────────────────────────────
// [POR DEFINIR] Parafraseos provisionales, NO citas textuales.
// Validar autoría, año y contenido con la profesora guía antes de
// mostrarlos a estudiantes. La metodología R5 queda pendiente de
// incorporar (prototipo inicial).
// TODO: Reemplazar por endpoint GET /api/critical-incidents/references.

const REFERENCES: TheoryReference[] = [
  {
    id: 'ref-tripp',
    author: 'David Tripp',
    title: 'Critical Incidents in Teaching: Developing Professional Judgement',
    year: 1993,
    excerpt:
      'Un incidente no es crítico por sí mismo: se vuelve crítico por el ' +
      'significado que le damos al analizarlo. Suelen ser hechos cotidianos ' +
      'que revelan motivos y estructuras de fondo de la práctica.',
    relevantSteps: ['context', 'description', 'actors', 'relevance'],
  },
  {
    id: 'ref-dewey',
    author: 'John Dewey',
    title: 'Cómo pensamos',
    year: 1933,
    excerpt:
      'El pensamiento reflexivo parte de una situación que genera duda o ' +
      'perplejidad y exige examinar con cuidado las propias creencias a la ' +
      'luz de los fundamentos que las sustentan.',
    relevantSteps: ['context', 'description', 'relevance'],
  },
  {
    id: 'ref-schon',
    author: 'Donald A. Schön',
    title: 'The Reflective Practitioner: How Professionals Think in Action',
    year: 1983,
    excerpt:
      'Distingue la reflexión en la acción, mientras ocurre la situación, ' +
      'de la reflexión sobre la acción, que revisa lo vivido después para ' +
      'reconstruir la propia práctica.',
    relevantSteps: ['actors', 'relevance'],
  },
  {
    id: 'ref-van-manen',
    author: 'Max van Manen',
    title: 'Linking ways of knowing with ways of being practical',
    year: 1977,
    excerpt:
      'Propone tres niveles de reflexión: técnico (eficacia de los medios), ' +
      'práctico (sentido de los fines y supuestos) y crítico (implicancias ' +
      'éticas y sociales).',
    relevantSteps: ['relevance'],
  },
];

// ─────────────────────────────────────────────
// Utilidades internas
// ─────────────────────────────────────────────

/** Lanza un error si el taller no existe. */
function assertWorkshopExists(workshopId: string): void {
  if (!WORKSHOP_DEFINITIONS.some((w) => w.id === workshopId)) {
    throw new Error(`El taller "${workshopId}" no existe.`);
  }
}

/**
 * Construye la lista de talleres con su estado en el flujo lineal.
 *
 * Prioridad del estado: `completed` > `locked` > `in-progress` > `available`.
 * Un taller con resultado, aprobado o reprobado, cuenta como completado y
 * desbloquea el siguiente. Un taller se bloquea si el anterior no está
 * completado. El bloqueo por
 * aprobación de HU-04 NO se calcula aquí (ver `useTheoryGate`).
 */
function buildWorkshops(
  drafts: DraftStore,
  attempts: AttemptStore,
  results: ResultStore,
): Workshop[] {
  const { maxAttemptsPerWorkshop } = DEFAULT_WORKSHOP_CONFIG;
  const workshops: Workshop[] = [];

  WORKSHOP_DEFINITIONS.forEach((definition, index) => {
    const workshopAttempts = attempts[definition.id] ?? [];
    const result = results[definition.id];
    const previousCompleted =
      index === 0 || workshops[index - 1].status === 'completed';

    let status: WorkshopStatus;
    if (result) status = 'completed';
    else if (!previousCompleted) status = 'locked';
    else if (drafts[definition.id]) status = 'in-progress';
    else status = 'available';

    workshops.push({
      ...definition,
      status,
      bestScore: null,
      attemptsUsed: workshopAttempts.length,
      maxAttempts: maxAttemptsPerWorkshop,
      outcome: result ? result.outcome : null,
      completedAt: result ? result.resolvedAt : null,
    });
  });

  return workshops;
}

// ─────────────────────────────────────────────
// Impulsos de la IA (HU-02)
// ─────────────────────────────────────────────

/**
 * Espera simulada (ms) de la IA al pedir un impulso. La respuesta real debe
 * tardar 10 s o menos (RNF-05); esta espera hace visible el estado de carga.
 */
const IMPULSE_LATENCY_MS = 2_500;

/** Simula el tiempo que tarda la IA en responder. */
function simulateImpulseLatency(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, IMPULSE_LATENCY_MS));
}

/** Exige que cada paso tenga el mínimo de caracteres para pedir un impulso. */
function assertImpulseContent(content: Record<IncidentStep, string>): void {
  const { minCharactersPerField } = DEFAULT_WORKSHOP_CONFIG;

  INCIDENT_STEPS.forEach((step) => {
    if (content[step.id].trim().length < minCharactersPerField) {
      throw new Error(
        `El paso "${step.title}" necesita al menos ${minCharactersPerField} caracteres ` +
          'para pedir un impulso. Desarróllalo un poco más e inténtalo de nuevo.',
      );
    }
  });
}

/**
 * Lee el estado actual y comprueba que el taller admite pedir un impulso:
 * no está bloqueado y aún le quedan intentos de revisión.
 */
function loadRequestableWorkshop(workshopId: string) {
  const drafts = readUserStorage<DraftStore>(STORAGE_KEYS.DRAFTS) ?? {};
  const attempts = readUserStorage<AttemptStore>(STORAGE_KEYS.ATTEMPTS) ?? {};
  const results = readUserStorage<ResultStore>(STORAGE_KEYS.RESULTS) ?? {};

  const workshop = buildWorkshops(drafts, attempts, results).find((w) => w.id === workshopId);
  if (!workshop) {
    throw new Error(`El taller "${workshopId}" no existe.`);
  }
  if (workshop.status === 'locked') {
    throw new Error(
      'Este taller aún está bloqueado. Completa el taller anterior para pedir un impulso.',
    );
  }
  if (workshop.attemptsUsed >= workshop.maxAttempts) {
    throw new Error(
      `Ya usaste los ${workshop.maxAttempts} intentos de revisión de este taller. ` +
        'No puedes pedir más impulsos.',
    );
  }

  return { workshop, drafts, attempts, results };
}

// ─────────────────────────────────────────────
// Servicio público
// ─────────────────────────────────────────────

/**
 * Servicio del registro estructurado de incidentes críticos.
 *
 * Firma estable: cuando el backend esté listo, se reemplazan
 * los cuerpos de cada método sin cambiar la interfaz pública.
 */
export const criticalIncidentService = {

  /**
   * Obtiene los datos base de los talleres sin leer el progreso de un
   * estudiante. El panel docente los usa para mostrar valores por defecto.
   */
  async fetchWorkshopPacingDefaults(): Promise<
    Pick<Workshop, 'id' | 'number' | 'title' | 'topic' | 'deadline' | 'maxAttempts'>[]
  > {
    return WORKSHOP_DEFINITIONS.map((definition) => ({
      ...definition,
      maxAttempts: DEFAULT_WORKSHOP_CONFIG.maxAttemptsPerWorkshop,
    }));
  },

  /**
   * Obtiene los 4 talleres con su estado y la configuración vigente.
   *
   * Mock: calcula el estado desde los borradores e intentos locales.
   * Producción: GET /api/critical-incidents/workshops
   */
  async fetchWorkshops(): Promise<FetchWorkshopsResponse> {
    // TODO: Reemplazar por llamada Axios al backend
    // return axios.get<FetchWorkshopsResponse>('/api/critical-incidents/workshops');

    const drafts = readUserStorage<DraftStore>(STORAGE_KEYS.DRAFTS) ?? {};
    const attempts = readUserStorage<AttemptStore>(STORAGE_KEYS.ATTEMPTS) ?? {};
    const results = readUserStorage<ResultStore>(STORAGE_KEYS.RESULTS) ?? {};

    return {
      workshops: buildWorkshops(drafts, attempts, results),
      config: DEFAULT_WORKSHOP_CONFIG,
    };
  },

  /**
   * Obtiene el borrador guardado de un taller.
   * Retorna `null` si el estudiante aún no tiene borrador.
   *
   * Mock: lee de localStorage.
   * Producción: GET /api/critical-incidents/workshops/:workshopId/draft
   */
  async getDraft(workshopId: string): Promise<IncidentDraft | null> {
    // TODO: Reemplazar por llamada Axios al backend
    // return axios.get<IncidentDraft | null>(`/api/critical-incidents/workshops/${workshopId}/draft`);

    assertWorkshopExists(workshopId);

    const drafts = readUserStorage<DraftStore>(STORAGE_KEYS.DRAFTS) ?? {};
    return drafts[workshopId] ?? null;
  },

  /**
   * Guarda (crea o reemplaza) el borrador de un taller.
   *
   * Regla de negocio (RF-03): guardar un borrador NO descuenta intentos
   * de revisión. Por eso esta función solo escribe en la clave de
   * borradores y nunca lee ni modifica la de intentos.
   *
   * `isAutoSaved` distingue el guardado automático del manual; no forma
   * parte de `SaveDraftPayload` porque no es contenido del estudiante.
   *
   * Mock: persiste en localStorage.
   * Producción: PUT /api/critical-incidents/workshops/:workshopId/draft
   */
  async saveDraft(
    payload: SaveDraftPayload,
    isAutoSaved = false,
  ): Promise<IncidentDraft> {
    // TODO: Reemplazar por llamada Axios al backend
    // return axios.put<IncidentDraft>(`/api/critical-incidents/workshops/${payload.workshopId}/draft`, { ...payload, isAutoSaved });

    assertWorkshopExists(payload.workshopId);

    const draft: IncidentDraft = {
      workshopId: payload.workshopId,
      context: payload.context,
      description: payload.description,
      actors: payload.actors,
      relevance: payload.relevance,
      currentStep: payload.currentStep,
      savedAt: new Date().toISOString(),
      isAutoSaved,
    };

    const drafts = readUserStorage<DraftStore>(STORAGE_KEYS.DRAFTS) ?? {};
    drafts[payload.workshopId] = draft;
    writeUserStorage(STORAGE_KEYS.DRAFTS, drafts);

    return draft;
  },

  /**
   * Descarta el borrador de un taller.
   * No falla si el taller no tenía borrador.
   *
   * Mock: elimina la entrada de localStorage.
   * Producción: DELETE /api/critical-incidents/workshops/:workshopId/draft
   */
  async clearDraft(workshopId: string): Promise<void> {
    // TODO: Reemplazar por llamada Axios al backend
    // await axios.delete(`/api/critical-incidents/workshops/${workshopId}/draft`);

    assertWorkshopExists(workshopId);

    const drafts = readUserStorage<DraftStore>(STORAGE_KEYS.DRAFTS) ?? {};
    delete drafts[workshopId];
    writeUserStorage(STORAGE_KEYS.DRAFTS, drafts);
  },

  /**
   * Obtiene las referencias bibliográficas pertinentes a un paso
   * del formulario (panel lateral `TheoryReferenceSidebar`).
   *
   * Mock: filtra el arreglo local.
   * Producción: GET /api/critical-incidents/references?step=
   */
  async getReferences(step: IncidentStep): Promise<TheoryReference[]> {
    // TODO: Reemplazar por llamada Axios al backend
    // return axios.get<TheoryReference[]>('/api/critical-incidents/references', { params: { step } });

    return REFERENCES.filter((ref) => ref.relevantSteps.includes(step));
  },

  /**
   * Pide un impulso de la IA sobre el texto de los 4 pasos y registra el
   * intento (HU-02 / RF-02).
   *
   * Regla de negocio (RF-06): cada solicitud descuenta 1 intento de revisión.
   * Se rechaza si el taller está bloqueado, si ya no quedan intentos o si
   * algún paso tiene menos del mínimo de caracteres. Un rechazo NO descuenta.
   * A diferencia de `saveDraft`, que nunca toca los intentos.
   *
   * Esta función no guarda ni borra el borrador: quien la llama debe
   * guardarlo antes con `saveDraft`.
   *
   * Mock: el impulso lo genera `generateImpulse` tras una espera simulada.
   * Producción: POST /api/critical-incidents/workshops/:workshopId/impulses
   */
  async requestImpulse(
    payload: Omit<SubmitWorkshopPayload, 'attemptNumber'>,
  ): Promise<SubmitWorkshopResponse> {
    // TODO: Reemplazar por llamada Axios al backend
    // return axios.post<SubmitWorkshopResponse>(`/api/critical-incidents/workshops/${payload.workshopId}/impulses`, payload);

    const { workshopId } = payload;
    assertWorkshopExists(workshopId);

    const content = {
      context: payload.context,
      description: payload.description,
      actors: payload.actors,
      relevance: payload.relevance,
    };
    assertImpulseContent(content);

    if (!getUserStorageKey(STORAGE_KEYS.ATTEMPTS)) {
      throw new Error(
        'No pudimos registrar tu intento porque la sesión no está activa. Inicia sesión nuevamente e inténtalo otra vez.',
      );
    }

    // Falla rápido si no se puede pedir, antes de esperar a la IA.
    loadRequestableWorkshop(workshopId);
    await simulateImpulseLatency();

    // Se vuelve a leer tras la espera: los intentos pudieron cambiar.
    const { workshop, drafts, attempts, results } = loadRequestableWorkshop(workshopId);

    const attemptNumber = workshop.attemptsUsed + 1;
    const feedback = generateImpulse({ workshopId, attemptNumber, content });
    const attempt: WorkshopAttempt = {
      attemptNumber,
      workshopId,
      content,
      feedback,
      status: 'reviewed',
      submittedAt: feedback.createdAt,
    };

    attempts[workshopId] = [...(attempts[workshopId] ?? []), attempt];
    writeUserStorage(STORAGE_KEYS.ATTEMPTS, attempts);

    const updatedWorkshop =
      buildWorkshops(drafts, attempts, results).find((w) => w.id === workshopId) ?? workshop;

    return { attempt, feedback, workshop: updatedWorkshop };
  },

  /**
   * Obtiene los intentos de revisión de un taller, del más antiguo al más
   * reciente. Cada uno trae el impulso que se entregó.
   *
   * Mock: lee de localStorage.
   * Producción: GET /api/critical-incidents/workshops/:workshopId/attempts
   */
  async getAttempts(workshopId: string): Promise<WorkshopAttempt[]> {
    // TODO: Reemplazar por llamada Axios al backend
    // return axios.get<WorkshopAttempt[]>(`/api/critical-incidents/workshops/${workshopId}/attempts`);

    assertWorkshopExists(workshopId);

    const attempts = readUserStorage<AttemptStore>(STORAGE_KEYS.ATTEMPTS) ?? {};
    return attempts[workshopId] ?? [];
  },

  /**
   * SOLO MOCK. Simula el resultado que el sistema notificará al estudiante
   * cuando revise un taller: aprobado o reprobado.
   *
   * Un taller con resultado queda completado y, tanto si aprobó como si
   * reprobó, desbloquea el siguiente. No toca los borradores ni los intentos.
   *
   * Producción: el resultado lo entrega el backend tras la revisión y este
   * método se elimina junto con la simulación de la vista.
   */
  async simulateWorkshopResult(
    workshopId: string,
    outcome: WorkshopOutcome,
  ): Promise<void> {
    assertWorkshopExists(workshopId);

    const drafts = readUserStorage<DraftStore>(STORAGE_KEYS.DRAFTS) ?? {};
    const attempts = readUserStorage<AttemptStore>(STORAGE_KEYS.ATTEMPTS) ?? {};
    const results = readUserStorage<ResultStore>(STORAGE_KEYS.RESULTS) ?? {};

    const workshop = buildWorkshops(drafts, attempts, results).find(
      (w) => w.id === workshopId,
    );
    if (workshop?.status === 'locked') {
      throw new Error('El taller está bloqueado: completa el anterior primero.');
    }

    results[workshopId] = { outcome, resolvedAt: new Date().toISOString() };
    writeUserStorage(STORAGE_KEYS.RESULTS, results);
  },

  /**
   * SOLO MOCK. Quita el resultado simulado de un taller y el de los
   * siguientes, que dejarían de estar desbloqueados. Sirve para repetir
   * la demostración. Se elimina junto con `simulateWorkshopResult`.
   */
  async clearWorkshopResult(workshopId: string): Promise<void> {
    assertWorkshopExists(workshopId);

    const results = readUserStorage<ResultStore>(STORAGE_KEYS.RESULTS) ?? {};
    const fromIndex = WORKSHOP_DEFINITIONS.findIndex((w) => w.id === workshopId);

    WORKSHOP_DEFINITIONS.slice(fromIndex).forEach((w) => {
      delete results[w.id];
    });
    writeUserStorage(STORAGE_KEYS.RESULTS, results);
  },
};
