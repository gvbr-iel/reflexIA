/**
 * @module views/critical-incidents/hooks/useIncidentWizard
 *
 * Hook principal del asistente de incidentes críticos (HU-03 / RF-03).
 *
 * Encapsula toda la lógica y el estado del Step Wizard (R5):
 * - Los campos y la navegación definidos por la configuración docente del taller.
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
  Workshop,
  WorkshopConfig,
  WorkshopFormStep,
} from '../../../models/criticalIncident';
import {
  INCIDENT_STEPS,
  EMPTY_DRAFT_FIELDS,
  DEFAULT_WORKSHOP_CONFIG,
} from '../../../models/criticalIncident';
import type { WorkshopStudentConfiguration } from '../../../models/workshopStructure';
import { criticalIncidentService } from '../../../services/criticalIncidentService';
import { workshopStructureService } from '../../../services/workshopStructureService';

// ─────────────────────────────────────────────
// Tipos del hook
// ─────────────────────────────────────────────

/** Texto de cada uno de los 4 campos, indexado por paso. */
export type StepValues = Record<string, string>;

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
  /** Configuración docente activa y segura para estudiantes. */
  configuration: WorkshopStudentConfiguration | null;
  /** Reintenta la carga inicial. */
  retryLoad: () => Promise<void>;

  // ── Pasos ──
  /** Pasos dinámicos derivados del formato y el esquema configurados. */
  steps: WorkshopFormStep[];
  /** Paso actual. */
  currentStep: WorkshopFormStep;
  /** Índice del paso actual (0-based). */
  currentIndex: number;
  isFirstStep: boolean;
  isLastStep: boolean;

  // ── Contenido ──
  /** Texto escrito en cada paso. */
  values: StepValues;
  answers: Record<string, string>;
  /** Respuesta del paso actual. */
  currentValue: string;
  /** Actualiza la respuesta de un paso. */
  setFieldValue: (step: string, text: string) => void;

  // ── Validación ──
  /** Si cada paso tiene su campo obligatorio completo. */
  stepCompletion: Record<string, boolean>;
  /** Si todos los pasos configurados están completos. */
  allStepsCompleted: boolean;
  /** Error del paso actual tras intentar avanzar (null si no hay). */
  stepError: string | null;
  /** Si se puede ir a un paso (todos los anteriores completos). */
  canGoToStep: (step: string) => boolean;

  // ── Navegación ──
  /** Avanza al siguiente paso; se bloquea si el campo está vacío. */
  goNext: () => void;
  /** Retrocede al paso anterior. */
  goBack: () => void;
  /** Salta a un paso permitido. */
  goToStep: (step: string) => void;

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

function buildConfiguredSteps(
  configuration: WorkshopStudentConfiguration | null,
): WorkshopFormStep[] {
  if (!configuration) return INCIDENT_STEPS;

  if (configuration.evaluationType === 'multiple-choice') {
    const questions = configuration.formSchema.questions;
    if (questions.length === 0) {
      return [{
        id: 'choice-empty',
        title: 'No hay preguntas disponibles',
        instruction: 'El docente aún no ha agregado preguntas a este formulario.',
        placeholder: '',
        order: 1,
      }];
    }
    return questions.map((question, index) => ({
      id: `choice-${question.id}`,
      title: question.prompt,
      instruction: 'Selecciona la alternativa que consideres correcta.',
      placeholder: '',
      order: index + 1,
    }));
  }

  const steps: WorkshopFormStep[] = INCIDENT_STEPS.map((step, index) => {
    const prompt = configuration.formSchema.guidingQuestions[index]?.trim();
    return {
      ...step,
      instruction: prompt ? `${step.instruction} Orientación: ${prompt}` : step.instruction,
    };
  });
  configuration.formSchema.guidingQuestions.slice(INCIDENT_STEPS.length).forEach((question, index) => {
    steps.push({
      id: `guiding-${index + INCIDENT_STEPS.length}`,
      title: `Pregunta orientadora ${index + INCIDENT_STEPS.length + 1}`,
      instruction: question,
      placeholder: 'Desarrolla tu respuesta sin incluir nombres reales.',
      order: steps.length + 1,
    });
  });
  return steps;
}

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
  const [configuration, setConfiguration] = useState<WorkshopStudentConfiguration | null>(null);
  const [config, setConfig] = useState<WorkshopConfig>(DEFAULT_WORKSHOP_CONFIG);

  // ── Contenido y navegación ────────────────
  const [values, setValues] = useState<StepValues>(EMPTY_VALUES);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentStepId, setCurrentStepId] = useState<string>(
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
  const latestRef = useRef({ values, answers, currentStepId, isDirty });
  // Sin lista de dependencias: se actualiza después de cada render.
  useEffect(() => {
    latestRef.current = { values, answers, currentStepId, isDirty };
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
  const steps = buildConfiguredSteps(configuration);
  const currentIndex = Math.max(0, steps.findIndex((s) => s.id === currentStepId));
  const currentStep = steps[currentIndex] ?? steps[0];
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === steps.length - 1;

  const getAnswer = useCallback(
    (stepId: string) =>
      stepId in values ? values[stepId] : answers[stepId] ?? '',
    [answers, values],
  );
  const currentValue = currentStep ? getAnswer(currentStep.id) : '';
  const stepCompletion = Object.fromEntries(
    steps.map((step) => [
      step.id,
      isFilled(getAnswer(step.id)),
    ]),
  );
  const allStepsCompleted =
    steps.length > 0 &&
    steps.every((step) => stepCompletion[step.id]);
  const canAdvance = stepCompletion[currentStepId];
  const stepError = showValidation && !canAdvance ? STEP_ERROR_MESSAGE : null;

  // ── Carga inicial ─────────────────────────
  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const [{ workshops, config: workshopConfig }, draft, workshopConfiguration] = await Promise.all([
        criticalIncidentService.fetchWorkshops(),
        criticalIncidentService.getDraft(workshopId),
        workshopStructureService.fetchStudentConfiguration(workshopId),
      ]);

      const found = workshops.find((w) => w.id === workshopId);
      if (!found) throw new Error(`Taller "${workshopId}" no encontrado.`);

      setWorkshop(found);
      setConfig(workshopConfig);
      setConfiguration(workshopConfiguration);

      if (draft) {
        setValues({
          context: draft.context,
          description: draft.description,
          actors: draft.actors,
          relevance: draft.relevance,
        });
        setAnswers(draft.answers ?? {});
        const configuredSteps = buildConfiguredSteps(workshopConfiguration);
        setCurrentStepId(
          configuredSteps.some((step) => step.id === draft.currentStep)
            ? draft.currentStep
            : configuredSteps[0]?.id ?? EMPTY_DRAFT_FIELDS.currentStep,
        );
        setSavedAt(draft.savedAt);
        setLastSaveWasAuto(draft.isAutoSaved);
        setHasDraft(true);
      } else {
        setValues(EMPTY_VALUES);
        setAnswers({});
        setCurrentStepId(buildConfiguredSteps(workshopConfiguration)[0]?.id ?? 'context');
      }
    } catch (cause) {
      console.error('No se pudo cargar la configuración del asistente:', cause);
      setLoadError(
        'No se pudo cargar el taller o su configuración docente. ' +
        'Verifica tu conexión, los permisos de Firestore y vuelve a intentarlo.',
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
    async (isAuto: boolean, stepOverride?: string) => {
      if (isSavingRef.current) return;

      const snapshot = latestRef.current;
      const versionAtStart = editVersionRef.current;

      isSavingRef.current = true;
      setSaveStatus('saving');

      try {
        const draft = await criticalIncidentService.saveDraft(
          {
            workshopId,
            context: snapshot.values.context ?? '',
            description: snapshot.values.description ?? '',
            actors: snapshot.values.actors ?? '',
            relevance: snapshot.values.relevance ?? '',
            answers: snapshot.answers,
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
      const snapshot = latestRef.current;
      if (!snapshot.isDirty || isSavingRef.current) return;

      criticalIncidentService
        .saveDraft({
          workshopId,
          context: snapshot.values.context ?? '',
          description: snapshot.values.description ?? '',
          actors: snapshot.values.actors ?? '',
          relevance: snapshot.values.relevance ?? '',
          answers: snapshot.answers,
          currentStep: snapshot.currentStepId,
        }, true)
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
  const setFieldValue = useCallback((step: string, text: string) => {
    editVersionRef.current += 1;
    if (step in EMPTY_VALUES) {
      setValues((prev) => ({ ...prev, [step]: text }));
    } else {
      setAnswers((prev) => ({ ...prev, [step]: text }));
    }
    setIsDirty(true);
  }, []);

  // ── Acciones: navegación ──────────────────
  /** Cambia de paso (sin validar); lo usan goNext, goBack y goToStep. */
  const moveToStep = useCallback(
    (target: string) => {
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
    const next = steps[currentIndex + 1];
    if (next) moveToStep(next.id);
  }, [canAdvance, currentIndex, moveToStep, steps]);

  /** Vuelve al paso anterior (siempre se permite). */
  const goBack = useCallback(() => {
    const previous = steps[currentIndex - 1];
    if (previous) moveToStep(previous.id);
  }, [currentIndex, moveToStep, steps]);

  /** Un paso es accesible si todos los anteriores están completos (orden lineal). */
  const canGoToStep = useCallback(
    (step: string) => {
      const targetIndex = steps.findIndex((s) => s.id === step);
      return targetIndex >= 0 && steps.slice(0, targetIndex).every((s) =>
        isFilled(getAnswer(s.id)),
      );
    },
    [getAnswer, steps],
  );

  /** Salta a un paso desde la barra de pasos, si está permitido. */
  const goToStep = useCallback(
    (step: string) => {
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
      setAnswers({});
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
    configuration,
    retryLoad: load,

    // Pasos
    steps,
    currentStep,
    currentIndex,
    isFirstStep,
    isLastStep,

    // Contenido
    values,
    answers,
    currentValue,
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
