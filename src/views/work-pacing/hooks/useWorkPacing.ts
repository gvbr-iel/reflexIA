/**
 * @module views/work-pacing/hooks/useWorkPacing
 *
 * Aquí vive toda la lógica del panel de plazos e intentos (HU-06 / RF-06).
 * La vista y los componentes solo muestran lo que este hook les entrega.
 *
 * El hook maneja tres copias de la configuración:
 *  - valores por defecto: lo que ya existe hoy en la plataforma
 *    (las fechas de los talleres y los intentos máximos de HU-03 y HU-04).
 *  - `saved`: lo que el profesor guardó (si nunca guardó, son los de por defecto).
 *  - `draft`: lo que el profesor está editando en pantalla.
 *
 * Comparando `draft` con `saved` sabemos si hay cambios sin guardar.
 *
 * Regla del flujo: las actividades se desbloquean en orden (marco teórico y
 * talleres 1 a 4), así que un plazo no puede ser anterior al de la actividad
 * que va antes.
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';

import type { Workshop } from '../../../models/criticalIncident';
import { DEFAULT_QUIZ_CONFIG } from '../../../models/theoryQuiz';
import {
  PACING_LIMITS,
  THEORY_ACTIVITY_ID,
  type ActivityPacing,
  type PacingActivity,
  type PacingValues,
} from '../../../models/workPacing';
import { criticalIncidentService } from '../../../services/criticalIncidentService';
import { workPacingService, WorkPacingError } from '../../../services/workPacingService';
import { daysUntil, formatDeadline } from '../../../utils/workPacingDates';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

/** Mensajes de error por actividad: solo aparecen las que tienen un problema. */
export type PacingErrors = Record<string, string>;

/** Aviso que se muestra arriba de la lista después de guardar o restablecer. */
export interface PacingNotice {
  /** Cambia en cada aviso nuevo, para que reinicie su temporizador. */
  id: number;
  /** 'success' = salió bien, 'error' = algo falló. */
  tone: 'success' | 'error';
  message: string;
}

/** Datos del resumen (se calculan con lo que está guardado). */
export interface PacingSummary {
  /** La actividad con el plazo más cercano que aún no vence (null si no hay). */
  nextDeadline: { title: string; deadline: string } | null;
  /** Cuántas actividades ya pasaron su plazo. */
  overdueCount: number;
  /**
   * Cuántas actividades tienen valores distintos a los de por defecto.
   * No se muestra en una tarjeta: la vista lo usa para habilitar el botón
   * "Restablecer" solo cuando hay algo que restablecer.
   */
  customizedCount: number;
}

/** Todo lo que el hook le entrega a la vista. */
export interface UseWorkPacingReturn {
  /** Las 5 actividades en orden, con sus valores por defecto. */
  activities: PacingActivity[];
  /** Los valores que se están editando ahora. */
  draft: PacingValues;
  summary: PacingSummary;
  /** Fecha del último guardado en formato ISO (null si nunca se guardó). */
  updatedAt: string | null;

  /** true mientras se carga la configuración por primera vez o al reintentar. */
  isLoading: boolean;
  /** Mensaje si la carga falló (null si todo va bien). */
  error: string | null;
  /** Vuelve a intentar la carga. */
  retry: () => Promise<void>;

  /** Errores de validación del borrador, por actividad. */
  errors: PacingErrors;
  /** true si hay cambios sin guardar. */
  isDirty: boolean;
  /** true si el borrador tiene errores y por eso no se puede guardar. */
  hasErrors: boolean;
  /** true si la actividad ya guardada tiene valores distintos a los de por defecto. */
  isCustomized: (activityId: string) => boolean;

  /** Cambia la fecha límite de una actividad (null = sin plazo). */
  setDeadline: (activityId: string, deadline: string | null) => void;
  /** Cambia el máximo de intentos de una actividad. */
  setMaxAttempts: (activityId: string, maxAttempts: number) => void;
  /** Guarda el borrador. */
  save: () => Promise<void>;
  /** Descarta los cambios que aún no se guardaron. */
  discard: () => void;
  /** Borra lo configurado y vuelve a los valores por defecto. */
  resetDefaults: () => Promise<void>;
  /** true mientras se está guardando. */
  isSaving: boolean;
  /** true mientras se está restableciendo. */
  isResetting: boolean;

  notice: PacingNotice | null;
  /** Cierra el aviso antes de que se oculte solo. */
  dismissNotice: () => void;
}

// ─────────────────────────────────────────────
// Constantes y funciones auxiliares
// ─────────────────────────────────────────────

/** Cuánto tiempo (en milisegundos) se ve un aviso antes de ocultarse solo. */
const NOTICE_DURATION_MS = 6000;

/** Mensaje general para cuando no sabemos qué falló. */
const GENERIC_ERROR =
  'No se pudo completar la acción. Verifica tu conexión e intenta nuevamente.';

/**
 * Convierte un error del servicio en un mensaje para el usuario.
 * El servicio solo entrega un código; el texto lo ponemos aquí.
 */
function toMessage(error: unknown): string {
  // Si no es un error conocido del servicio, usamos el mensaje general.
  if (!(error instanceof WorkPacingError)) return GENERIC_ERROR;

  switch (error.code) {
    case 'invalid-attempts':
      return (
        `Los intentos deben ser un número entre ${PACING_LIMITS.minAttempts} ` +
        `y ${PACING_LIMITS.maxAttempts}. Corrige el valor e intenta guardar de nuevo.`
      );
    case 'invalid-deadline':
      return 'Una de las fechas no es válida. Elígela de nuevo con el selector de fecha.';
  }
}

/**
 * Arma la lista de las 5 actividades: primero el marco teórico y después los
 * talleres, en orden. Los datos de los talleres vienen del servicio de HU-03.
 */
function buildActivities(
  workshops: Pick<Workshop, 'id' | 'number' | 'title' | 'topic' | 'deadline' | 'maxAttempts'>[],
): PacingActivity[] {
  // El marco teórico no existe en la lista de talleres, así que lo creamos.
  // No tiene plazo por defecto y usa los intentos que define HU-04.
  const theory: PacingActivity = {
    id: THEORY_ACTIVITY_ID,
    kind: 'theory',
    order: 0,
    title: 'Marco teórico',
    topic: 'Evaluación diagnóstica',
    defaultPacing: { deadline: null, maxAttempts: DEFAULT_QUIZ_CONFIG.maxAttempts },
  };

  // Convertimos cada taller en una actividad. Los ordenamos por número
  // (1 a 4) por si el servicio los entrega desordenados.
  const talleres: PacingActivity[] = [...workshops]
    .sort((a, b) => a.number - b.number)
    .map((workshop) => ({
      id: workshop.id,
      kind: 'workshop',
      order: workshop.number,
      title: workshop.title,
      topic: workshop.topic,
      defaultPacing: { deadline: workshop.deadline, maxAttempts: workshop.maxAttempts },
    }));

  return [theory, ...talleres];
}

/**
 * Calcula los valores de cada actividad: usa lo que el profesor configuró y,
 * si no configuró nada, usa el valor por defecto.
 */
function resolveValues(activities: PacingActivity[], overrides: PacingValues): PacingValues {
  const values: PacingValues = {};
  for (const activity of activities) {
    // Primero van los valores por defecto y encima lo configurado.
    values[activity.id] = { ...activity.defaultPacing, ...overrides[activity.id] };
  }
  return values;
}

/** Indica si dos configuraciones son iguales (misma fecha y mismos intentos). */
function samePacing(a: ActivityPacing | undefined, b: ActivityPacing | undefined): boolean {
  return a?.deadline === b?.deadline && a?.maxAttempts === b?.maxAttempts;
}

/**
 * Deja solo lo que es distinto a los valores por defecto. Eso es lo único que
 * se guarda: así los valores originales siguen siendo los de la plataforma.
 */
function toOverrides(activities: PacingActivity[], values: PacingValues): PacingValues {
  const overrides: PacingValues = {};
  for (const activity of activities) {
    if (!samePacing(values[activity.id], activity.defaultPacing)) {
      overrides[activity.id] = values[activity.id];
    }
  }
  return overrides;
}

/**
 * Revisa que cada plazo no sea anterior al de la actividad previa que tenga
 * plazo. Devuelve un mensaje de error por cada actividad que no cumpla.
 */
function validateOrder(activities: PacingActivity[], values: PacingValues): PacingErrors {
  const errors: PacingErrors = {};
  // Guarda el plazo de la última actividad que sí tenía plazo.
  let previous: { title: string; deadline: string } | null = null;

  for (const activity of activities) {
    const deadline = values[activity.id]?.deadline;
    // Una actividad sin plazo no se compara con nada.
    if (!deadline) continue;

    // Las fechas tienen formato AAAA-MM-DD, así que comparar los textos
    // equivale a comparar las fechas.
    if (previous && deadline < previous.deadline) {
      errors[activity.id] =
        `Este plazo es anterior al de «${previous.title}» (${formatDeadline(previous.deadline)}). ` +
        'Elige una fecha igual o posterior, porque las actividades se desbloquean en orden.';
    }
    previous = { title: activity.title, deadline };
  }
  return errors;
}

/** Calcula los números de las tarjetas de resumen a partir de lo guardado. */
function computeSummary(activities: PacingActivity[], saved: PacingValues): PacingSummary {
  let nextDeadline: PacingSummary['nextDeadline'] = null;
  let overdueCount = 0;
  let customizedCount = 0;

  for (const activity of activities) {
    const pacing = saved[activity.id];
    if (!pacing) continue;

    // Cuenta las actividades cuyos valores el profesor cambió.
    if (!samePacing(pacing, activity.defaultPacing)) customizedCount++;

    // Sin plazo no hay nada más que revisar.
    if (!pacing.deadline) continue;

    const days = daysUntil(pacing.deadline);
    if (days < 0) {
      // El plazo ya pasó.
      overdueCount++;
    } else if (!nextDeadline || pacing.deadline < nextDeadline.deadline) {
      // El plazo todavía no vence: nos quedamos con el más cercano.
      nextDeadline = { title: activity.title, deadline: pacing.deadline };
    }
  }

  return { nextDeadline, overdueCount, customizedCount };
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useWorkPacing(): UseWorkPacingReturn {
  // Las 5 actividades (marco teórico y talleres).
  const [activities, setActivities] = useState<PacingActivity[]>([]);
  // Lo que está guardado.
  const [saved, setSaved] = useState<PacingValues>({});
  // Lo que se está editando (empieza igual a lo guardado).
  const [draft, setDraft] = useState<PacingValues>({});
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [notice, setNotice] = useState<PacingNotice | null>(null);

  // Cuenta las cargas que se han pedido. Si llega una respuesta de una carga
  // vieja, la ignoramos (así una respuesta lenta no pisa a una más nueva).
  const latestRequestRef = useRef(0);
  // Cuenta los avisos, para darle un id distinto a cada uno.
  const noticeIdRef = useRef(0);

  // ── Carga ──────────────────────────────────

  /** Pide al servicio los talleres y la configuración guardada. */
  const load = useCallback(async () => {
    // Anota que esta es la carga más reciente.
    const requestId = ++latestRequestRef.current;

    try {
      setIsLoading(true);
      setError(null);

      // Pedimos los datos base de los talleres y la configuración guardada.
      const [workshops, config] = await Promise.all([
        criticalIncidentService.fetchWorkshopPacingDefaults(),
        workPacingService.fetchConfig(),
      ]);

      // Si mientras esperábamos se pidió otra carga, esta ya no sirve.
      if (requestId !== latestRequestRef.current) return;

      // Armamos las actividades y combinamos defaults con lo guardado.
      const built = buildActivities(workshops);
      const values = resolveValues(built, config.overrides);
      setActivities(built);
      setSaved(values);
      setDraft(values); // al inicio, lo editable es igual a lo guardado
      setUpdatedAt(config.updatedAt);
    } catch {
      if (requestId !== latestRequestRef.current) return;
      setError(
        'No se pudo cargar la configuración de plazos e intentos. ' +
        'Verifica tu conexión e intenta nuevamente.',
      );
    } finally {
      // Solo la carga más reciente apaga el indicador de "cargando".
      if (requestId === latestRequestRef.current) setIsLoading(false);
    }
  }, []);

  // Carga los datos una vez, cuando se abre el panel.
  useEffect(() => {
    load();
  }, [load]);

  // ── Avisos ─────────────────────────────────

  /** Muestra un aviso nuevo (de éxito o de error). */
  const showNotice = useCallback((tone: PacingNotice['tone'], message: string) => {
    noticeIdRef.current += 1;
    setNotice({ id: noticeIdRef.current, tone, message });
  }, []);

  /** Cierra el aviso a mano. */
  const dismissNotice = useCallback(() => setNotice(null), []);

  // Oculta el aviso solo, después de unos segundos.
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_DURATION_MS);
    // Si aparece otro aviso antes, cancela el temporizador anterior.
    return () => clearTimeout(timer);
  }, [notice]);

  // ── Valores calculados ─────────────────────
  // useMemo evita repetir estos cálculos si lo que usan no cambió.

  // Errores del borrador (plazos fuera de orden).
  const errors = useMemo(() => validateOrder(activities, draft), [activities, draft]);
  const hasErrors = Object.keys(errors).length > 0;

  // Hay cambios sin guardar si alguna actividad del borrador difiere de lo guardado.
  const isDirty = useMemo(
    () => activities.some((a) => !samePacing(draft[a.id], saved[a.id])),
    [activities, draft, saved],
  );

  // Números de las tarjetas de resumen.
  const summary = useMemo(() => computeSummary(activities, saved), [activities, saved]);

  /** Indica si una actividad guardada tiene valores distintos a los originales. */
  const isCustomized = useCallback(
    (activityId: string) => {
      const activity = activities.find((a) => a.id === activityId);
      return activity ? !samePacing(saved[activityId], activity.defaultPacing) : false;
    },
    [activities, saved],
  );

  // ── Edición ────────────────────────────────

  /** Cambia la fecha límite de una actividad en el borrador. */
  const setDeadline = useCallback((activityId: string, deadline: string | null) => {
    setDraft((current) => ({
      ...current,
      [activityId]: { ...current[activityId], deadline },
    }));
  }, []);

  /** Cambia los intentos de una actividad, sin salirse del rango permitido. */
  const setMaxAttempts = useCallback((activityId: string, maxAttempts: number) => {
    // Redondea y mantiene el valor entre el mínimo y el máximo permitidos.
    const clamped = Math.min(
      PACING_LIMITS.maxAttempts,
      Math.max(PACING_LIMITS.minAttempts, Math.round(maxAttempts)),
    );
    setDraft((current) => ({
      ...current,
      [activityId]: { ...current[activityId], maxAttempts: clamped },
    }));
  }, []);

  /** Descarta los cambios sin guardar: el borrador vuelve a ser igual a lo guardado. */
  const discard = useCallback(() => setDraft(saved), [saved]);

  // ── Guardado ───────────────────────────────

  /** Guarda el borrador usando el servicio. */
  const save = useCallback(async () => {
    // No guarda si no hay cambios o si hay errores sin corregir.
    if (!isDirty || hasErrors) return;

    setIsSaving(true);
    try {
      // Enviamos solo lo que cambió respecto a los valores por defecto.
      const config = await workPacingService.saveConfig(toOverrides(activities, draft));

      // Lo guardado y lo editable pasan a ser lo que devolvió el servicio.
      const values = resolveValues(activities, config.overrides);
      setSaved(values);
      setDraft(values);
      setUpdatedAt(config.updatedAt);
      showNotice(
        'success',
        'Cambios guardados. Los plazos e intentos quedaron actualizados en este panel.',
      );
    } catch (err) {
      showNotice('error', toMessage(err));
    } finally {
      setIsSaving(false);
    }
  }, [activities, draft, hasErrors, isDirty, showNotice]);

  /** Borra la configuración del profesor: todo vuelve a los valores originales. */
  const resetDefaults = useCallback(async () => {
    setIsResetting(true);
    try {
      const config = await workPacingService.resetConfig();

      // Sin configuración guardada, todo queda con sus valores por defecto.
      const values = resolveValues(activities, config.overrides);
      setSaved(values);
      setDraft(values);
      setUpdatedAt(config.updatedAt);
      showNotice('success', 'Se restablecieron los plazos e intentos por defecto.');
    } catch (err) {
      showNotice('error', toMessage(err));
    } finally {
      setIsResetting(false);
    }
  }, [activities, showNotice]);

  // Lo que el hook le entrega a la vista.
  return {
    activities,
    draft,
    summary,
    updatedAt,
    isLoading,
    error,
    retry: load,
    errors,
    isDirty,
    hasErrors,
    isCustomized,
    setDeadline,
    setMaxAttempts,
    save,
    discard,
    resetDefaults,
    isSaving,
    isResetting,
    notice,
    dismissNotice,
  };
}
