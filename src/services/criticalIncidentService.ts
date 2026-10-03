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
  WorkshopAttempt,
  IncidentDraft,
  IncidentStep,
  TheoryReference,
  SaveDraftPayload,
  FetchWorkshopsResponse,
} from '../models/criticalIncident';

import { DEFAULT_WORKSHOP_CONFIG } from '../models/criticalIncident';

// ─────────────────────────────────────────────
// Claves de localStorage (mock temporal)
// ─────────────────────────────────────────────

const STORAGE_KEYS = {
  DRAFTS: 'reflexia_incident_drafts',
  ATTEMPTS: 'reflexia_incident_attempts',
} as const;

/** Borradores indexados por `workshopId` (uno por taller). */
type DraftStore = Record<string, IncidentDraft>;

/** Intentos de envío indexados por `workshopId`. */
type AttemptStore = Record<string, WorkshopAttempt[]>;

// ─────────────────────────────────────────────
// Definición de los talleres (mock)
// ─────────────────────────────────────────────
// TODO: Reemplazar por endpoint GET /api/critical-incidents/workshops.
// [POR DEFINIR] Los títulos y descripciones finales de los talleres 1 a 4
// no están definidos (AI_GUIDELINES §6); se usan nombres cortos neutros.

const WORKSHOP_DEFINITIONS: Pick<Workshop, 'id' | 'number' | 'title' | 'description'>[] =
  [1, 2, 3, 4].map((number) => ({
    id: `workshop-${number}`,
    number,
    title: `Taller ${number}`,
    description: 'Descripción por definir con la profesora guía.',
  }));

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

/**
 * Lee un valor de localStorage y lo parsea como JSON.
 * Retorna `null` si la clave no existe o el JSON es inválido.
 */
function readStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/**
 * Escribe un valor serializado como JSON en localStorage.
 * Si falla (por ejemplo, almacenamiento lleno) lanza el error: el hook
 * debe mostrarlo, porque un borrador que no se guardó no puede darse
 * por guardado.
 */
function writeStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

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
 * Un taller se bloquea si el anterior no está completado. El bloqueo por
 * aprobación de HU-04 NO se calcula aquí (ver `useTheoryGate`).
 */
function buildWorkshops(drafts: DraftStore, attempts: AttemptStore): Workshop[] {
  const { maxAttemptsPerWorkshop } = DEFAULT_WORKSHOP_CONFIG;
  const workshops: Workshop[] = [];

  WORKSHOP_DEFINITIONS.forEach((definition, index) => {
    const workshopAttempts = attempts[definition.id] ?? [];
    const reviewed = workshopAttempts.find((a) => a.status === 'reviewed');
    const previousCompleted =
      index === 0 || workshops[index - 1].status === 'completed';

    let status: WorkshopStatus;
    if (reviewed) status = 'completed';
    else if (!previousCompleted) status = 'locked';
    else if (drafts[definition.id]) status = 'in-progress';
    else status = 'available';

    workshops.push({
      ...definition,
      status,
      bestScore: null,
      attemptsUsed: workshopAttempts.length,
      maxAttempts: maxAttemptsPerWorkshop,
      completedAt: reviewed ? reviewed.submittedAt : null,
    });
  });

  return workshops;
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
   * Obtiene los 4 talleres con su estado y la configuración vigente.
   *
   * Mock: calcula el estado desde los borradores e intentos locales.
   * Producción: GET /api/critical-incidents/workshops
   */
  async fetchWorkshops(): Promise<FetchWorkshopsResponse> {
    // TODO: Reemplazar por llamada Axios al backend
    // return axios.get<FetchWorkshopsResponse>('/api/critical-incidents/workshops');

    const drafts = readStorage<DraftStore>(STORAGE_KEYS.DRAFTS) ?? {};
    const attempts = readStorage<AttemptStore>(STORAGE_KEYS.ATTEMPTS) ?? {};

    return {
      workshops: buildWorkshops(drafts, attempts),
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

    const drafts = readStorage<DraftStore>(STORAGE_KEYS.DRAFTS) ?? {};
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

    const drafts = readStorage<DraftStore>(STORAGE_KEYS.DRAFTS) ?? {};
    drafts[payload.workshopId] = draft;
    writeStorage(STORAGE_KEYS.DRAFTS, drafts);

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

    const drafts = readStorage<DraftStore>(STORAGE_KEYS.DRAFTS) ?? {};
    delete drafts[workshopId];
    writeStorage(STORAGE_KEYS.DRAFTS, drafts);
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
};
