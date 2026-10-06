/**
 * @module views/critical-incidents/hooks/useImpulse
 *
 * Lógica de "El Impulso" del estudiante (HU-02 / RF-02): pedir a la IA
 * orientaciones sobre su relato, ver el contador de intentos restantes y
 * consultar los impulsos de los intentos anteriores.
 *
 * Reglas de negocio:
 * - Cada solicitud aceptada descuenta 1 intento de revisión (RF-06).
 * - Guardar un borrador NO descuenta intentos: antes de pedir el impulso se
 *   guarda el borrador con `saveDraft`, pero ese guardado no toca los intentos.
 * - No se puede pedir con datos sensibles detectados (RF-05), con algún paso
 *   por debajo del mínimo de caracteres ni con los intentos agotados.
 * - La IA nunca redacta ni corrige el texto del alumno (AI_GUIDELINES §8): el
 *   servicio solo entrega orientaciones.
 *
 * El hook no conoce al asistente ni al detector de datos sensibles: recibe lo
 * que necesita por parámetros, y quien lo usa (IncidentWizard) lo conecta.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  AIFeedback,
  IncidentStepInfo,
  WorkshopAttempt,
} from '../../../models/criticalIncident';
import { DEFAULT_WORKSHOP_CONFIG, INCIDENT_STEPS } from '../../../models/criticalIncident';
import { criticalIncidentService } from '../../../services/criticalIncidentService';
import type { StepValues } from './useIncidentWizard';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

/** Lo que el hook necesita del asistente. */
export interface UseImpulseParams {
  /** ID del taller abierto. */
  workshopId: string;
  /** Texto escrito en cada uno de los 4 pasos. */
  values: StepValues;
  /** Máximo de intentos del taller (null mientras el taller carga). */
  maxAttempts: number | null;
  /** true si el detector de datos sensibles encontró algo en el relato. */
  hasSensitiveData: boolean;
  /** Guarda el borrador; se llama justo antes de pedir el impulso. */
  saveDraft: () => Promise<void>;
  /** Se llama cuando se registra un intento, por ejemplo para refrescar el taller. */
  onAttemptRegistered?: () => void;
}

/** Todo lo que el hook le entrega al panel. */
export interface UseImpulseReturn {
  /** Intentos ya realizados, del más antiguo al más reciente. */
  attempts: WorkshopAttempt[];
  /** Intentos usados. */
  attemptsUsed: number;
  /** Máximo de intentos de revisión. */
  maxAttempts: number;
  /** Intentos que todavía puede usar. */
  attemptsRemaining: number;
  /** true si ya no quedan intentos. */
  isExhausted: boolean;

  /** true mientras se cargan los intentos anteriores. */
  isLoadingAttempts: boolean;
  /** Mensaje si la carga de intentos falló (null si todo va bien). */
  loadError: string | null;
  /** Vuelve a cargar los intentos. */
  retryLoad: () => Promise<void>;

  /** Impulso que se está mostrando (null si aún no hay ninguno). */
  viewedFeedback: AIFeedback | null;
  /** Número del intento cuyo impulso se muestra (null si no hay ninguno). */
  viewedAttemptNumber: number | null;
  /** Muestra el impulso de otro intento. */
  viewAttempt: (attemptNumber: number) => void;

  /** Pasos que no llegan al mínimo de caracteres. */
  shortSteps: IncidentStepInfo[];
  /** Cantidad mínima de caracteres por paso para pedir un impulso. */
  minCharacters: number;
  /** Se puede pedir un impulso ahora. */
  canRequest: boolean;
  /** Por qué no se puede pedir (null si se puede o si está en curso). */
  blockedReason: string | null;

  /** true mientras la IA procesa el relato. */
  isRequesting: boolean;
  /** Mensaje si la solicitud falló (null si no hay error). */
  requestError: string | null;
  /** Oculta el mensaje de error de la solicitud. */
  dismissRequestError: () => void;
  /** Pide un impulso: guarda el borrador y descuenta 1 intento. */
  requestImpulse: () => Promise<void>;
}

// ─────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────

const LOAD_ERROR_MESSAGE =
  'No se pudieron cargar tus intentos anteriores. Verifica tu conexión e intenta nuevamente.';
const REQUEST_ERROR_MESSAGE =
  'No se pudo pedir el impulso. Verifica tu conexión e intenta nuevamente.';

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useImpulse({
  workshopId,
  values,
  maxAttempts: maxAttemptsParam,
  hasSensitiveData,
  saveDraft,
  onAttemptRegistered,
}: UseImpulseParams): UseImpulseReturn {
  const [attempts, setAttempts] = useState<WorkshopAttempt[]>([]);
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewedAttemptNumber, setViewedAttemptNumber] = useState<number | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  // Identifica la carga más reciente; las anteriores se ignoran.
  const latestLoadRef = useRef(0);
  // Evita actualizar el estado si la vista se cierra mientras la IA responde.
  const isMountedRef = useRef(true);
  // Marca el componente como montado y, al desmontar, como desmontado.
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Avisos al asistente por referencia, para no recrear los callbacks.
  const onAttemptRegisteredRef = useRef(onAttemptRegistered);
  // Mantiene la referencia apuntando a la versión más reciente del callback.
  useEffect(() => {
    onAttemptRegisteredRef.current = onAttemptRegistered;
  });

  const maxAttempts = maxAttemptsParam ?? DEFAULT_WORKSHOP_CONFIG.maxAttemptsPerWorkshop;
  const minCharacters = DEFAULT_WORKSHOP_CONFIG.minCharactersPerField;

  // ── Carga de los intentos anteriores ──────
  const loadAttempts = useCallback(async () => {
    const requestId = ++latestLoadRef.current;

    try {
      setIsLoadingAttempts(true);
      setLoadError(null);

      const loaded = await criticalIncidentService.getAttempts(workshopId);
      if (requestId !== latestLoadRef.current) return;

      setAttempts(loaded);
      setViewedAttemptNumber(loaded.length > 0 ? loaded[loaded.length - 1].attemptNumber : null);
    } catch {
      if (requestId !== latestLoadRef.current) return;
      setLoadError(LOAD_ERROR_MESSAGE);
    } finally {
      if (requestId === latestLoadRef.current) setIsLoadingAttempts(false);
    }
  }, [workshopId]);

  // Carga los intentos al abrir el taller (y si cambia de taller).
  useEffect(() => {
    loadAttempts();
  }, [loadAttempts]);

  // ── Derivados ─────────────────────────────
  const attemptsUsed = attempts.length;
  const attemptsRemaining = Math.max(0, maxAttempts - attemptsUsed);
  const isExhausted = attemptsRemaining === 0;

  const viewedAttempt = attempts.find((a) => a.attemptNumber === viewedAttemptNumber) ?? null;
  const viewedFeedback = viewedAttempt?.feedback ?? null;

  // Pasos que aún no alcanzan el mínimo de caracteres.
  const shortSteps = INCIDENT_STEPS.filter((step) => values[step.id].trim().length < minCharacters);

  // Se puede pedir un impulso solo si se cumplen TODAS estas condiciones.
  const canRequest =
    !isLoadingAttempts &&
    loadError === null &&
    !isRequesting &&
    !isExhausted &&
    !hasSensitiveData &&
    shortSteps.length === 0;

  // Si no se puede pedir, se explica el motivo (regla R10: decir cómo corregirlo).
  let blockedReason: string | null = null;
  if (!isRequesting && !isLoadingAttempts && loadError === null) {
    if (isExhausted) {
      blockedReason = `Ya usaste los ${maxAttempts} intentos de revisión de este taller.`;
    } else if (hasSensitiveData) {
      blockedReason =
        'Se detectaron datos sensibles en tu relato. Reemplázalos por etiquetas generales, como "Estudiante A", antes de pedir un impulso.';
    } else if (shortSteps.length > 0) {
      blockedReason =
        `Para pedir un impulso, cada paso necesita al menos ${minCharacters} caracteres. ` +
        `Falta desarrollar: ${shortSteps.map((step) => step.title).join(', ')}.`;
    }
  }

  // ── Acciones ──────────────────────────────
  const viewAttempt = useCallback((attemptNumber: number) => {
    setViewedAttemptNumber(attemptNumber);
  }, []);

  /** Oculta el mensaje de error de la última solicitud. */
  const dismissRequestError = useCallback(() => setRequestError(null), []);

  /** Pide un impulso a la IA: cuenta como un intento de revisión (no como un borrador). */
  const requestImpulse = useCallback(async () => {
    if (!canRequest) return;

    setIsRequesting(true);
    setRequestError(null);

    try {
      // Guardar el borrador no descuenta intentos (invariante de HU-03).
      await saveDraft();

      const { attempt } = await criticalIncidentService.requestImpulse({
        workshopId,
        ...values,
      });
      if (!isMountedRef.current) return;

      setAttempts((current) => [...current, attempt]);
      setViewedAttemptNumber(attempt.attemptNumber);
      onAttemptRegisteredRef.current?.();
    } catch (error) {
      if (!isMountedRef.current) return;

      setRequestError(error instanceof Error ? error.message : REQUEST_ERROR_MESSAGE);
      // Por si los intentos cambiaron (por ejemplo, desde otra pestaña).
      void loadAttempts();
    } finally {
      if (isMountedRef.current) setIsRequesting(false);
    }
  }, [canRequest, saveDraft, workshopId, values, loadAttempts]);

  return {
    attempts,
    attemptsUsed,
    maxAttempts,
    attemptsRemaining,
    isExhausted,
    isLoadingAttempts,
    loadError,
    retryLoad: loadAttempts,
    viewedFeedback,
    viewedAttemptNumber,
    viewAttempt,
    shortSteps,
    minCharacters,
    canRequest,
    blockedReason,
    isRequesting,
    requestError,
    dismissRequestError,
    requestImpulse,
  };
}
