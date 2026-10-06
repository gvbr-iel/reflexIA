/**
 * @module views/reflections/hooks/useReflectionReview
 *
 * Lógica de la revisión de UNA reflexión por el profesor guía (HU-02 / RF-02):
 * editar los impulsos que propuso la IA, guardar los cambios y validarlos.
 *
 * Maneja dos copias de la retroalimentación:
 *  - `review` (la de la reflexión): lo que está guardado.
 *  - `draft...`: lo que el profesor está editando en pantalla.
 *
 * Comparando ambas sabemos si hay cambios sin guardar. Por eso solo se puede
 * validar cuando no hay cambios pendientes: lo que se valida es lo guardado.
 *
 * La propuesta original de la IA (`aiFeedback`) nunca se modifica; sirve para
 * restaurarla y para auditar qué cambió el docente.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { AIFeedbackHint } from '../../../models/criticalIncident';
import type { Reflection } from '../../../models/reflection';
import { reflectionService } from '../../../services/reflectionService';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

/** Aviso que se muestra sobre el detalle después de guardar o validar. */
export interface ReviewNotice {
  /** Cambia en cada aviso nuevo, para que la vista lo reconozca como nuevo. */
  id: number;
  /** 'success' = salió bien, 'error' = algo falló. */
  tone: 'success' | 'error';
  message: string;
}

/** Todo lo que el hook le entrega a la vista. */
export interface UseReflectionReviewReturn {
  /** Impulsos que se están editando ahora. */
  draftHints: AIFeedbackHint[];
  /** Comentario general que se está editando ahora. */
  draftComment: string;

  /** Cambia el texto de un impulso. */
  updateHintMessage: (hintId: string, message: string) => void;
  /** Quita un impulso de la retroalimentación. */
  removeHint: (hintId: string) => void;
  /** Cambia el comentario general. */
  updateComment: (comment: string) => void;
  /** Vuelve a lo último que se guardó. */
  discardChanges: () => void;
  /** Vuelve a la propuesta original de la IA (sin guardar). */
  restoreProposal: () => void;

  /** true si hay cambios sin guardar. */
  isDirty: boolean;
  /** true si lo editado difiere de la propuesta original de la IA. */
  differsFromProposal: boolean;
  /** Ids de los impulsos que quedaron sin texto. */
  emptyHintIds: string[];
  /** true si el comentario general quedó vacío. */
  isCommentEmpty: boolean;

  /** true mientras se guardan los cambios. */
  isSaving: boolean;
  /** true mientras se valida la retroalimentación. */
  isValidating: boolean;
  /** Se pueden guardar los cambios (hay cambios, sin campos vacíos). */
  canSave: boolean;
  /** Se puede validar (no está validada y no hay cambios sin guardar). */
  canValidate: boolean;

  /** Guarda los cambios; la reflexión queda "editada". */
  saveEdit: () => Promise<void>;
  /** Valida la retroalimentación guardada. */
  validate: () => Promise<void>;

  /** Último aviso de éxito o error (null si no hay). */
  notice: ReviewNotice | null;
  /** Oculta el aviso. */
  dismissNotice: () => void;
}

// ─────────────────────────────────────────────
// Funciones auxiliares
// ─────────────────────────────────────────────

const GENERIC_ERROR = 'No se pudo completar la acción. Inténtalo nuevamente.';

/** Copia los impulsos para editarlos sin tocar los originales. */
function cloneHints(hints: AIFeedbackHint[]): AIFeedbackHint[] {
  return hints.map((hint) => ({ ...hint }));
}

/** Indica si dos listas de impulsos tienen los mismos ids y textos, en el mismo orden. */
function sameHints(a: AIFeedbackHint[], b: AIFeedbackHint[]): boolean {
  return a.length === b.length && a.every((hint, i) => hint.id === b[i].id && hint.message === b[i].message);
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

/**
 * @param reflection Reflexión abierta en el detalle (null si no hay ninguna).
 * @param onUpdated Se llama con la reflexión actualizada tras guardar o validar,
 *   para que la lista refleje el nuevo estado.
 */
export function useReflectionReview(
  reflection: Reflection | null,
  onUpdated: (updated: Reflection) => void,
): UseReflectionReviewReturn {
  const review = reflection?.review ?? null;

  const [draftHints, setDraftHints] = useState<AIFeedbackHint[]>([]);
  const [draftComment, setDraftComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [notice, setNotice] = useState<ReviewNotice | null>(null);

  const noticeCounterRef = useRef(0);
  // Reflexión abierta ahora: un aviso de otra reflexión ya cerrada se descarta.
  const openReflectionIdRef = useRef<string | null>(null);

  // Mantiene actualizada la referencia con la reflexión abierta.
  useEffect(() => {
    openReflectionIdRef.current = reflection?.id ?? null;
  }, [reflection?.id]);

  // Cada vez que cambia lo guardado (o se abre otra reflexión), el borrador
  // vuelve a lo guardado.
  useEffect(() => {
    setDraftHints(review ? cloneHints(review.hints) : []);
    setDraftComment(review ? review.generalComment : '');
  }, [review]);

  // Al abrir otra reflexión se oculta el aviso de la anterior.
  useEffect(() => {
    setNotice(null);
  }, [reflection?.id]);

  // true mientras se guarda o se valida (desactiva los botones).
  const isBusy = isSaving || isValidating;

  // ¿El borrador del profesor es distinto de lo guardado? (hay cambios sin guardar)
  const isDirty = useMemo(
    () =>
      review !== null &&
      (draftComment !== review.generalComment || !sameHints(draftHints, review.hints)),
    [review, draftHints, draftComment],
  );

  // ¿El borrador es distinto de la propuesta original de la IA? (habilita "Restaurar propuesta")
  const differsFromProposal = useMemo(
    () =>
      reflection !== null &&
      (draftComment !== reflection.aiFeedback.generalComment ||
        !sameHints(draftHints, reflection.aiFeedback.hints)),
    [reflection, draftHints, draftComment],
  );

  // Orientaciones que quedaron vacías: impiden guardar.
  const emptyHintIds = useMemo(
    () => draftHints.filter((hint) => hint.message.trim() === '').map((hint) => hint.id),
    [draftHints],
  );
  const isCommentEmpty = draftComment.trim() === '';

  // Reglas de los botones: guardar exige cambios completos; validar exige no tener cambios pendientes.
  const canSave =
    reflection !== null && isDirty && emptyHintIds.length === 0 && !isCommentEmpty && !isBusy;
  const canValidate =
    reflection !== null && review?.status !== 'validated' && !isDirty && !isBusy;

  /** Muestra un aviso solo si la reflexión sigue abierta (si el profesor cambió de reflexión, se descarta). */
  function showNotice(reflectionId: string, tone: ReviewNotice['tone'], message: string) {
    if (openReflectionIdRef.current !== reflectionId) return;
    noticeCounterRef.current += 1;
    setNotice({ id: noticeCounterRef.current, tone, message });
  }

  /** Edita el texto de una orientación del borrador. */
  const updateHintMessage = useCallback((hintId: string, message: string) => {
    setDraftHints((current) =>
      current.map((hint) => (hint.id === hintId ? { ...hint, message } : hint)),
    );
  }, []);

  /** Quita una orientación del borrador. */
  const removeHint = useCallback((hintId: string) => {
    setDraftHints((current) => current.filter((hint) => hint.id !== hintId));
  }, []);

  /** Edita el comentario general del borrador. */
  const updateComment = useCallback((comment: string) => setDraftComment(comment), []);

  /** Descarta los cambios: el borrador vuelve a lo último guardado. */
  const discardChanges = useCallback(() => {
    if (!review) return;
    setDraftHints(cloneHints(review.hints));
    setDraftComment(review.generalComment);
  }, [review]);

  /** Vuelve a la propuesta original de la IA. */
  const restoreProposal = useCallback(() => {
    if (!reflection) return;
    setDraftHints(cloneHints(reflection.aiFeedback.hints));
    setDraftComment(reflection.aiFeedback.generalComment);
  }, [reflection]);

  /** Guarda la edición del profesor (RF-02: puede editar la propuesta antes de validarla). */
  async function saveEdit() {
    if (!reflection || !canSave) return;

    setIsSaving(true);
    try {
      const updated = await reflectionService.saveEdit({
        reflectionId: reflection.id,
        hints: draftHints,
        generalComment: draftComment,
      });
      onUpdated(updated);
      showNotice(
        updated.id,
        'success',
        'Cambios guardados. Valida la retroalimentación para dejarla lista para entregar.',
      );
    } catch (error) {
      showNotice(reflection.id, 'error', error instanceof Error ? error.message : GENERIC_ERROR);
    } finally {
      setIsSaving(false);
    }
  }

  /** Valida la retroalimentación: queda lista para entregar al estudiante. */
  async function validate() {
    if (!reflection || !canValidate) return;

    setIsValidating(true);
    try {
      const updated = await reflectionService.validate({ reflectionId: reflection.id });
      onUpdated(updated);
      showNotice(updated.id, 'success', 'Retroalimentación validada y lista para entregar.');
    } catch (error) {
      showNotice(reflection.id, 'error', error instanceof Error ? error.message : GENERIC_ERROR);
    } finally {
      setIsValidating(false);
    }
  }

  /** Cierra el aviso actual. */
  const dismissNotice = useCallback(() => setNotice(null), []);

  return {
    draftHints,
    draftComment,
    updateHintMessage,
    removeHint,
    updateComment,
    discardChanges,
    restoreProposal,
    isDirty,
    differsFromProposal,
    emptyHintIds,
    isCommentEmpty,
    isSaving,
    isValidating,
    canSave,
    canValidate,
    saveEdit,
    validate,
    notice,
    dismissNotice,
  };
}
