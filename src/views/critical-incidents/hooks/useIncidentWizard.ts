/**
 * @module views/critical-incidents/hooks/useIncidentWizard
 *
 * Hook principal del asistente de incidentes críticos (HU-03 / RF-03).
 *
 * Encapsula toda la lógica y el estado del Step Wizard (R5):
 * - Los 4 campos independientes y la navegación entre pasos.
 * - Bloqueo de avance si el campo obligatorio del paso actual está vacío.
 * - Guardado manual y automático del borrador (cada `autoSaveIntervalMs`,
 *   al cambiar de paso y al salir de la vista).
 * - Estados de carga y error (R9).
 *
 * Regla de negocio: guardar un borrador NO descuenta intentos de revisión;
 * este hook solo usa `saveDraft` del servicio, que no toca los intentos.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

import type {
  IncidentStep,
  IncidentStepInfo,
  Workshop,
  WorkshopConfig,
} from '../../../models/criticalIncident';
import {
  INCIDENT_STEPS,
  EMPTY_DRAFT_FIELDS,
  DEFAULT_WORKSHOP_CONFIG,
} from '../../../models/criticalIncident';
import { criticalIncidentService } from '../../../services/criticalIncidentService';

// ─────────────────────────────────────────────
// Tipos del hook
// ─────────────────────────────────────────────

/** Texto de cada uno de los 4 campos, indexado por paso. */
export type StepValues = Record<IncidentStep, string>;

/** Estado del último intento de guardado del borrador. */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/** Estado y acciones expuestos por el hook. */
export interface UseIncidentWizardReturn {
  // ── Carga ──
  /** Si se está cargando el taller y su borrador. */
  isLoading: boolean;
  /** Mensaje de error de la carga (null si no hay error). */
  loadError: string | null;
  /** Taller en curso (null mientras carga o si falló). */
  workshop: Workshop | null;
  /** Reintenta la carga inicial. */
  retryLoad: () => Promise<void>;

  // ── Pasos ──
  /** Definición de los 4 pasos. */
  steps: IncidentStepInfo[];
  /** Paso actual. */
  currentStep: IncidentStepInfo;
  /** Índice del paso actual (0-based). */
  currentIndex: number;
  isFirstStep: boolean;
  isLastStep: boolean;

  // ── Contenido ──
  /** Texto escrito en cada paso. */
  values: StepValues;
  /** Actualiza el texto de un paso. */
  setFieldValue: (step: IncidentStep, text: string) => void;

  // ── Validación ──
  /** Si cada paso tiene su campo obligatorio completo. */
  stepCompletion: Record<IncidentStep, boolean>;
  /** Si los 4 pasos están completos. */
  allStepsCompleted: boolean;
  /** Error del paso actual tras intentar avanzar (null si no hay). */
  stepError: string | null;
  /** Si se puede ir a un paso (todos los anteriores completos). */
  canGoToStep: (step: IncidentStep) => boolean;

  // ── Navegación ──
  /** Avanza al siguiente paso; se bloquea si el campo está vacío. */
  goNext: () => void;
  /** Retrocede al paso anterior. */
  goBack: () => void;
  /** Salta a un paso permitido. */
  goToStep: (step: IncidentStep) => void;

  // ── Borrador ──
  saveStatus: SaveStatus;
  /** Marca temporal ISO 8601 del último guardado (null si no hay). */
  savedAt: string | null;
  /** Si el último guardado fue automático. */
  lastSaveWasAuto: boolean;
  /** Si existe un borrador guardado. */
  hasDraft: boolean;
  /** Si hay cambios sin guardar. */
  isDirty: boolean;
  /** Guarda el borrador manualmente. */
  saveDraft: () => Promise<void>;
  /** Elimina el borrador y limpia el formulario. */
  discardDraft: () => Promise<void>;
}

// ─────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────

const EMPTY_VALUES: StepValues = {
  context: '',
  description: '',
  actors: '',
  relevance: '',
};

/** Un campo obligatorio está completo si tiene texto además de espacios. */
function isFilled(text: string): boolean {
  return text.trim().length > 0;
}

const STEP_ERROR_MESSAGE =
  'Este paso está vacío. Escribe tu respuesta para poder continuar.';

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useIncidentWizard(
  workshopId: string,
  onDraftChange?: () => void,
): UseIncidentWizardReturn {
  // ── Carga inicial ─────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [config, setConfig] = useState<WorkshopConfig>(DEFAULT_WORKSHOP_CONFIG);

  // ── Contenido y navegación ────────────────
  const [values, setValues] = useState<StepValues>(EMPTY_VALUES);
  const [currentStepId, setCurrentStepId] = useState<IncidentStep>(
    EMPTY_DRAFT_FIELDS.currentStep,
  );
  const [showValidation, setShowValidation] = useState(false);

  // ── Borrador ──────────────────────────────
  const [isDirty, setIsDirty] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [lastSaveWasAuto, setLastSaveWasAuto] = useState(false);

  // Referencia al último estado, para el temporizador y la salida de la
  // vista sin recrear los efectos en cada tecla.
  const latestRef = useRef({ values, currentStepId, isDirty });
  // Sin lista de dependencias: se actualiza después de cada render.
  useEffect(() => {
    latestRef.current = { values, currentStepId, isDirty };
  });

  // Se incrementa en cada edición: permite saber si el usuario siguió
  // escribiendo mientras se guardaba (en ese caso sigue "sin guardar").
  const editVersionRef = useRef(0);
  const isSavingRef = useRef(false);

  // Avisa a quien usa el hook cuando el borrador se guarda o se descarta
  // (por ejemplo, para actualizar el estado del taller en el selector).
  // Va en una referencia para no recrear los callbacks si el aviso cambia.
  const onDraftChangeRef = useRef(onDraftChange);
  // Mantiene la referencia apuntando a la versión más reciente del callback.
  useEffect(() => {
    onDraftChangeRef.current = onDraftChange;
  });

  // ── Derivados ─────────────────────────────
  const currentIndex = INCIDENT_STEPS.findIndex((s) => s.id === currentStepId);
  const currentStep = INCIDENT_STEPS[currentIndex];
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === INCIDENT_STEPS.length - 1;

  const stepCompletion = {
    context: isFilled(values.context),
    description: isFilled(values.description),
    actors: isFilled(values.actors),
    relevance: isFilled(values.relevance),
  };
  const allStepsCompleted = INCIDENT_STEPS.every((s) => stepCompletion[s.id]);
  const canAdvance = stepCompletion[currentStepId];
  const stepError = showValidation && !canAdvance ? STEP_ERROR_MESSAGE : null;

  // ── Carga inicial ─────────────────────────
  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const [{ workshops, config: workshopConfig }, draft] = await Promise.all([
        criticalIncidentService.fetchWorkshops(),
        criticalIncidentService.getDraft(workshopId),
      ]);

      const found = workshops.find((w) => w.id === workshopId);
      if (!found) throw new Error(`Taller "${workshopId}" no encontrado.`);

      setWorkshop(found);
      setConfig(workshopConfig);

      if (draft) {
        setValues({
          context: draft.context,
          description: draft.description,
          actors: draft.actors,
          relevance: draft.relevance,
        });
        setCurrentStepId(draft.currentStep);
        setSavedAt(draft.savedAt);
        setLastSaveWasAuto(draft.isAutoSaved);
        setHasDraft(true);
      }
    } catch {
      setLoadError(
        'No se pudo cargar el taller. ' +
        'Verifica tu conexión e intenta nuevamente.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [workshopId]);

  // Carga el borrador al abrir el taller (y si cambia de taller).
  useEffect(() => {
    load();
  }, [load]);

  // ── Guardado del borrador ─────────────────
  /**
   * Guarda el borrador. Nunca descuenta intentos de revisión (invariante de HU-03).
   * @param isAuto - true si lo dispara el autoguardado; false si fue el botón.
   * @param stepOverride - Paso a guardar como actual (al cambiar de paso).
   */
  const persist = useCallback(
    async (isAuto: boolean, stepOverride?: IncidentStep) => {
      if (isSavingRef.current) return;

      const snapshot = latestRef.current;
      const versionAtStart = editVersionRef.current;

      isSavingRef.current = true;
      setSaveStatus('saving');

      try {
        const draft = await criticalIncidentService.saveDraft(
          {
            workshopId,
            ...snapshot.values,
            currentStep: stepOverride ?? snapshot.currentStepId,
          },
          isAuto,
        );

        setSavedAt(draft.savedAt);
        setLastSaveWasAuto(isAuto);
        setHasDraft(true);
        setSaveStatus('saved');
        if (editVersionRef.current === versionAtStart) setIsDirty(false);
        onDraftChangeRef.current?.();
      } catch {
        setSaveStatus('error');
      } finally {
        isSavingRef.current = false;
      }
    },
    [workshopId],
  );

  // Guardado automático periódico (solo si hay cambios sin guardar).
  useEffect(() => {
    if (isLoading) return;

    const intervalId = setInterval(() => {
      if (latestRef.current.isDirty) persist(true);
    }, config.autoSaveIntervalMs);

    return () => clearInterval(intervalId);
  }, [isLoading, config.autoSaveIntervalMs, persist]);

  // Guardado al salir de la vista o cerrar la pestaña, para no perder
  // lo escrito desde el último guardado automático.
  useEffect(() => {
    /** Guarda lo pendiente sin esperar la respuesta (la pestaña puede estar cerrándose). */
    function flush() {
      const { values: latest, currentStepId: step, isDirty: dirty } =
        latestRef.current;
      if (!dirty || isSavingRef.current) return;

      criticalIncidentService
        .saveDraft({ workshopId, ...latest, currentStep: step }, true)
        .catch(() => {});
    }

    window.addEventListener('beforeunload', flush);
    return () => {
      window.removeEventListener('beforeunload', flush);
      flush();
    };
  }, [workshopId]);

  // ── Acciones: contenido ───────────────────
  /** Actualiza el texto de un paso y marca que hay cambios sin guardar. */
  const setFieldValue = useCallback((step: IncidentStep, text: string) => {
    editVersionRef.current += 1;
    setValues((prev) => ({ ...prev, [step]: text }));
    setIsDirty(true);
  }, []);

  // ── Acciones: navegación ──────────────────
  /** Cambia de paso (sin validar); lo usan goNext, goBack y goToStep. */
  const moveToStep = useCallback(
    (target: IncidentStep) => {
      setShowValidation(false);
      setCurrentStepId(target);
      // Punto de control natural: guarda lo escrito al cambiar de paso.
      if (isDirty) persist(true, target);
    },
    [isDirty, persist],
  );

  /** Avanza al siguiente paso solo si el actual está completo; si no, muestra la validación. */
  const goNext = useCallback(() => {
    if (!canAdvance) {
      setShowValidation(true);
      return;
    }
    const next = INCIDENT_STEPS[currentIndex + 1];
    if (next) moveToStep(next.id);
  }, [canAdvance, currentIndex, moveToStep]);

  /** Vuelve al paso anterior (siempre se permite). */
  const goBack = useCallback(() => {
    const previous = INCIDENT_STEPS[currentIndex - 1];
    if (previous) moveToStep(previous.id);
  }, [currentIndex, moveToStep]);

  /** Un paso es accesible si todos los anteriores están completos (orden lineal). */
  const canGoToStep = useCallback(
    (step: IncidentStep) => {
      const targetIndex = INCIDENT_STEPS.findIndex((s) => s.id === step);
      return INCIDENT_STEPS.slice(0, targetIndex).every((s) =>
        isFilled(values[s.id]),
      );
    },
    [values],
  );

  /** Salta a un paso desde la barra de pasos, si está permitido. */
  const goToStep = useCallback(
    (step: IncidentStep) => {
      if (step === currentStepId || !canGoToStep(step)) return;
      moveToStep(step);
    },
    [currentStepId, canGoToStep, moveToStep],
  );

  // ── Acciones: borrador ────────────────────
  /** Botón "Guardar borrador": guardado manual. */
  const saveDraft = useCallback(() => persist(false), [persist]);

  /** Borra el borrador guardado y deja el formulario vacío. */
  const discardDraft = useCallback(async () => {
    try {
      await criticalIncidentService.clearDraft(workshopId);

      editVersionRef.current += 1;
      setValues(EMPTY_VALUES);
      setCurrentStepId(EMPTY_DRAFT_FIELDS.currentStep);
      setShowValidation(false);
      setIsDirty(false);
      setHasDraft(false);
      setSavedAt(null);
      setSaveStatus('idle');
      onDraftChangeRef.current?.();
    } catch {
      setSaveStatus('error');
    }
  }, [workshopId]);

  // ── Retorno ───────────────────────────────

  return {
    // Carga
    isLoading,
    loadError,
    workshop,
    retryLoad: load,

    // Pasos
    steps: INCIDENT_STEPS,
    currentStep,
    currentIndex,
    isFirstStep,
    isLastStep,

    // Contenido
    values,
    setFieldValue,

    // Validación
    stepCompletion,
    allStepsCompleted,
    stepError,
    canGoToStep,

    // Navegación
    goNext,
    goBack,
    goToStep,

    // Borrador
    saveStatus,
    savedAt,
    lastSaveWasAuto,
    hasDraft,
    isDirty,
    saveDraft,
    discardDraft,
  };
}
