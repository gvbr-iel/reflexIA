import { useCallback, useEffect, useMemo, useState } from 'react';

import type { PublishInnovationPayload, WorkshopSubmission } from '../models/innovation';
import { INNOVATION_TAG_SUGGESTIONS } from '../models/innovation';
import { innovationService } from '../services/innovationService';

function formatSubmission(submission: WorkshopSubmission): string {
  const fields = [
    ['Contexto', submission.content.context],
    ['Descripción del incidente', submission.content.description],
    ['Actores e influencia', submission.content.actors],
    ['Relevancia pedagógica', submission.content.relevance],
    ...submission.responses.map((response) => [response.prompt, response.response]),
  ];
  return fields
    .filter(([, response]) => typeof response === 'string' && response.trim())
    .map(([prompt, response]) => `${prompt}\n${response}`)
    .join('\n\n');
}

export function useInnovationReview() {
  const [submissions, setSubmissions] = useState<WorkshopSubmission[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState('');
  const [gradeInput, setGradeInput] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [productType, setProductType] = useState('');
  const [work, setWork] = useState('');
  const [tagText, setTagText] = useState('');
  const [privacyReviewed, setPrivacyReviewed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingGrade, setIsSavingGrade] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const nextSubmissions = await innovationService.fetchReviewSubmissions();
      setSubmissions(nextSubmissions);
      setSelectedSubmissionId((current) =>
        nextSubmissions.some((submission) => submission.id === current) ? current : '',
      );
    } catch (cause) {
      console.error('No se pudieron cargar los trabajos elegibles para innovaciones:', cause);
      setError('No se pudieron cargar los trabajos. Verifica tus permisos y vuelve a intentarlo.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedSubmission = useMemo(
    () => submissions.find((submission) => submission.id === selectedSubmissionId) ?? null,
    [selectedSubmissionId, submissions],
  );

  const selectSubmission = useCallback((id: string) => {
    setSelectedSubmissionId(id);
    const submission = submissions.find((item) => item.id === id);
    setGradeInput(submission?.grade === null || !submission ? '' : String(submission.grade));
    setTitle('');
    setSummary('');
    setProductType('');
    setTagText('');
    setPrivacyReviewed(false);
    setNotice(null);
    setError(null);
    setWork(submission ? formatSubmission(submission) : '');
  }, [submissions]);

  const addTag = useCallback((tag: string) => {
    const existing = tagText.split(',').map((item) => item.trim()).filter(Boolean);
    if (!existing.includes(tag)) setTagText([...existing, tag].join(', '));
  }, [tagText]);

  const publish = useCallback(async () => {
    if (!selectedSubmission) return;
    setIsPublishing(true);
    setError(null);
    setNotice(null);
    const payload: PublishInnovationPayload = {
      submissionId: selectedSubmission.id,
      title,
      summary,
      productType,
      work,
      tags: tagText.split(',').map((tag) => tag.trim()).filter(Boolean),
      privacyReviewed,
    };
    try {
      await innovationService.publish(payload);
      setNotice('El trabajo anonimizado ya está disponible en la biblioteca.');
      setSelectedSubmissionId('');
      setTitle('');
      setSummary('');
      setProductType('');
      setWork('');
      setTagText('');
      setPrivacyReviewed(false);
      await load();
    } catch (cause) {
      console.error('No se pudo publicar la innovación:', cause);
      setError(cause instanceof Error ? cause.message : 'No se pudo publicar el trabajo.');
    } finally {
      setIsPublishing(false);
    }
  }, [load, privacyReviewed, productType, selectedSubmission, summary, tagText, title, work]);

  const saveGrade = useCallback(async () => {
    if (!selectedSubmission || selectedSubmission.grade !== null) return;
    const grade = Number(gradeInput.replace(',', '.'));
    if (!Number.isFinite(grade) || grade < 1 || grade > 7) {
      setError('Ingresa una nota oficial entre 1,0 y 7,0.');
      return;
    }
    setIsSavingGrade(true);
    setError(null);
    setNotice(null);
    try {
      await innovationService.saveOfficialGrade(selectedSubmission.id, grade);
      setNotice('Nota oficial guardada. Si es 6,0 o superior, podrás revisar el trabajo para publicarlo.');
      await load();
    } catch (cause) {
      console.error('No se pudo guardar la nota oficial del trabajo:', cause);
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la nota oficial.');
    } finally {
      setIsSavingGrade(false);
    }
  }, [gradeInput, load, selectedSubmission]);

  const tagSuggestions = selectedSubmission
    ? INNOVATION_TAG_SUGGESTIONS[selectedSubmission.workshopId]
    : [];

  return {
    submissions,
    selectedSubmission,
    selectedSubmissionId,
    gradeInput,
    title,
    summary,
    productType,
    work,
    tagText,
    privacyReviewed,
    isLoading,
    isPublishing,
    isSavingGrade,
    error,
    notice,
    tagSuggestions,
    setTitle,
    setGradeInput,
    setSummary,
    setProductType,
    setWork,
    setTagText,
    setPrivacyReviewed,
    selectSubmission,
    addTag,
    publish,
    saveGrade,
    retry: load,
  };
}
