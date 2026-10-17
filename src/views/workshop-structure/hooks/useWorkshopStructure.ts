import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  validateWorkshopConfiguration,
  type ImportedWorkshopQuestion,
  type WorkshopChoiceQuestion,
  type WorkshopEvaluationType,
  type WorkshopId,
  type WorkshopStructureConfiguration,
} from '../../../models/workshopStructure';
import { workshopStructureService } from '../../../services/workshopStructureService';

function cloneConfiguration(
  configuration: WorkshopStructureConfiguration,
): WorkshopStructureConfiguration {
  return {
    ...configuration,
    sections: configuration.sections.map((section) => ({ ...section })),
    formSchema: {
      guidingQuestions: [...configuration.formSchema.guidingQuestions],
      matrixRows: [...configuration.formSchema.matrixRows],
      questions: configuration.formSchema.questions.map((question) =>
        question.type === 'multiple-choice'
          ? { ...question, options: [...question.options] }
          : { ...question },
      ),
    },
  };
}

export function useWorkshopStructure(workshopId: WorkshopId) {
  const [saved, setSaved] = useState<WorkshopStructureConfiguration | null>(null);
  const [draft, setDraft] = useState<WorkshopStructureConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setIsLoading(true);
    setError(null);
    setNotice(null);
    setSaved(null);
    setDraft(null);
    try {
      const configuration = await workshopStructureService.fetchConfiguration(workshopId);
      if (requestId.current !== currentRequest) return;
      setSaved(cloneConfiguration(configuration));
      setDraft(cloneConfiguration(configuration));
    } catch (cause) {
      if (requestId.current !== currentRequest) return;
      console.error('No se pudo cargar la estructura del taller:', cause);
      setError(
        'No se pudo cargar la configuración del taller. Verifica tu conexión y los permisos de Firestore.',
      );
    } finally {
      if (requestId.current === currentRequest) setIsLoading(false);
    }
  }, [workshopId]);

  useEffect(() => {
    void load();
    return () => {
      requestId.current += 1;
    };
  }, [load]);

  const isDirty = useMemo(
    () => Boolean(draft && saved && JSON.stringify(draft) !== JSON.stringify(saved)),
    [draft, saved],
  );

  const updateDraft = useCallback(
    (updater: (current: WorkshopStructureConfiguration) => WorkshopStructureConfiguration) => {
      setDraft((current) => (current ? updater(current) : current));
      setNotice(null);
    },
    [],
  );

  const setSectionEnabled = useCallback(
    (sectionId: string, enabled: boolean) => {
      updateDraft((current) => ({
        ...current,
        sections: current.sections.map((section) =>
          section.id === sectionId ? { ...section, enabled } : section,
        ),
      }));
    },
    [updateDraft],
  );

  const moveSection = useCallback(
    (sectionId: string, direction: -1 | 1) => {
      updateDraft((current) => {
        const ordered = [...current.sections].sort((a, b) => a.order - b.order);
        const index = ordered.findIndex((section) => section.id === sectionId);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= ordered.length) return current;
        [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
        return {
          ...current,
          sections: ordered.map((section, order) => ({ ...section, order })),
        };
      });
    },
    [updateDraft],
  );

  const setEvaluationType = useCallback(
    (evaluationType: WorkshopEvaluationType) =>
      updateDraft((current) => ({ ...current, evaluationType })),
    [updateDraft],
  );

  const setGuidingQuestion = useCallback(
    (index: number, value: string) =>
      updateDraft((current) => ({
        ...current,
        formSchema: {
          ...current.formSchema,
          guidingQuestions: current.formSchema.guidingQuestions.map((question, itemIndex) =>
            itemIndex === index ? value : question,
          ),
        },
      })),
    [updateDraft],
  );

  const addGuidingQuestion = useCallback(
    () =>
      updateDraft((current) => ({
        ...current,
        formSchema: {
          ...current.formSchema,
          guidingQuestions: [...current.formSchema.guidingQuestions, ''],
        },
      })),
    [updateDraft],
  );

  const removeGuidingQuestion = useCallback(
    (index: number) =>
      updateDraft((current) => ({
        ...current,
        formSchema: {
          ...current.formSchema,
          guidingQuestions: current.formSchema.guidingQuestions.filter(
            (_, itemIndex) => itemIndex !== index,
          ),
        },
      })),
    [updateDraft],
  );

  const updateQuestion = useCallback(
    (questionId: string, updater: (question: WorkshopChoiceQuestion) => WorkshopChoiceQuestion) =>
      updateDraft((current) => ({
        ...current,
        formSchema: {
          ...current.formSchema,
          questions: current.formSchema.questions.map((question) =>
            question.id === questionId ? updater(question) : question,
          ),
        },
      })),
    [updateDraft],
  );

  const addQuestion = useCallback(
    () =>
      updateDraft((current) => ({
        ...current,
        formSchema: {
          ...current.formSchema,
          questions: [
            ...current.formSchema.questions,
            {
              id: `question-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              prompt: '',
              type: 'multiple-choice',
              options: ['', ''],
              correctOptionIndex: 0,
            },
          ],
        },
      })),
    [updateDraft],
  );

  const addOpenEndedQuestion = useCallback(
    () =>
      updateDraft((current) => ({
        ...current,
        formSchema: {
          ...current.formSchema,
          questions: [
            ...current.formSchema.questions,
            {
              id: `question-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              prompt: '',
              type: 'open-ended',
            },
          ],
        },
      })),
    [updateDraft],
  );

  const importQuestions = useCallback(
    (questions: ImportedWorkshopQuestion[]) =>
      {
        if (draft && draft.formSchema.questions.length + questions.length > 30) {
          throw new Error('No se pueden agregar más de 30 preguntas en total.');
        }
        updateDraft((current) => ({
          ...current,
          formSchema: {
            ...current.formSchema,
            questions: [
              ...current.formSchema.questions,
              ...questions.map((question) => ({
                ...question,
                id: `question-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              })),
            ],
          },
        }));
      },
    [draft, updateDraft],
  );

  const removeQuestion = useCallback(
    (questionId: string) =>
      updateDraft((current) => ({
        ...current,
        formSchema: {
          ...current.formSchema,
          questions: current.formSchema.questions.filter((question) => question.id !== questionId),
        },
      })),
    [updateDraft],
  );

  const save = useCallback(async () => {
    if (!draft) return;
    const validationError = validateWorkshopConfiguration(draft);
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      const configuration = await workshopStructureService.saveConfiguration(draft);
      setSaved(cloneConfiguration(configuration));
      setDraft(cloneConfiguration(configuration));
      setNotice('Cambios guardados para este taller.');
    } catch (cause) {
      console.error('No se pudo guardar la estructura del taller:', cause);
      setError(
        'No se pudieron guardar los cambios. Verifica tu conexión y que tu cuenta tenga rol docente activo.',
      );
    } finally {
      setIsSaving(false);
    }
  }, [draft]);

  const discard = useCallback(() => {
    if (saved) setDraft(cloneConfiguration(saved));
    setError(null);
    setNotice(null);
  }, [saved]);

  const resetDefaults = useCallback(async () => {
    setIsResetting(true);
    setError(null);
    setNotice(null);
    try {
      const configuration = await workshopStructureService.resetConfiguration(workshopId);
      const defaults = cloneConfiguration(configuration);
      setSaved(defaults);
      setDraft(defaults);
      setNotice('Se restableció la plantilla predeterminada de este taller.');
    } catch (cause) {
      console.error('No se pudo restablecer la estructura del taller:', cause);
      setError(
        'No se pudo restablecer la plantilla. Verifica tu conexión y que tu cuenta tenga rol docente activo.',
      );
    } finally {
      setIsResetting(false);
    }
  }, [workshopId]);

  return {
    draft,
    isLoading,
    isSaving,
    isResetting,
    isDirty,
    error,
    notice,
    load,
    save,
    discard,
    resetDefaults,
    setSectionEnabled,
    moveSection,
    setEvaluationType,
    setGuidingQuestion,
    addGuidingQuestion,
    removeGuidingQuestion,
    updateQuestion,
    addQuestion,
    addOpenEndedQuestion,
    importQuestions,
    removeQuestion,
  };
}
