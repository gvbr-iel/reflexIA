import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  where,
} from 'firebase/firestore';
import { PROGRESS_WORKSHOP_IDS } from '../../../models/studentProgress';
import { EVALUATIONS_COLLECTION } from '../../../models/studentEvaluation';
import { studentEvaluationService } from '../../../services/studentEvaluationService';
import { firebaseAuth, firestoreDb } from '../../../services/firebase';
import {
  INNOVATION_COLLECTION,
  WORKSHOP_SUBMISSIONS_COLLECTION,
  type InnovationCase,
  type PublishInnovationPayload,
  type WorkshopSubmission,
  type WorkshopWorkResponse,
} from '../models/innovation';

type SubmissionContent = WorkshopSubmission['content'];

function getDatabase() {
  if (!firestoreDb) {
    throw new Error('Firebase no está configurado. Revisa las variables VITE_FIREBASE_*.');
  }
  return firestoreDb;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isWorkshopId(value: unknown): value is WorkshopSubmission['workshopId'] {
  return typeof value === 'string' &&
    (PROGRESS_WORKSHOP_IDS as readonly string[]).includes(value);
}

function parseWorkResponse(value: unknown): WorkshopWorkResponse | null {
  if (!isRecord(value) || typeof value.prompt !== 'string' || typeof value.response !== 'string') {
    return null;
  }
  if (value.type !== 'multiple-choice' && value.type !== 'open-ended') return null;
  return { prompt: value.prompt, response: value.response, type: value.type };
}

function parseContent(value: unknown): SubmissionContent | null {
  if (!isRecord(value)) return null;
  const fields = ['context', 'description', 'actors', 'relevance'] as const;
  if (fields.some((field) => typeof value[field] !== 'string')) return null;
  return {
    context: value.context as string,
    description: value.description as string,
    actors: value.actors as string,
    relevance: value.relevance as string,
  };
}

function parseSubmission(
  id: string,
  value: unknown,
): Omit<WorkshopSubmission, 'grade' | 'gradeConflict' | 'conflictingGrade'> | null {
  if (
    !isRecord(value) ||
    typeof value.studentEmail !== 'string' ||
    !isWorkshopId(value.workshopId) ||
    typeof value.submittedAt !== 'string' ||
    !Array.isArray(value.responses)
  ) {
    return null;
  }
  const content = parseContent(value.content);
  const responses = value.responses.map(parseWorkResponse);
  if (!content || responses.some((response) => response === null)) return null;
  return {
    id,
    studentEmail: value.studentEmail,
    workshopId: value.workshopId,
    submittedAt: value.submittedAt,
    content,
    responses: responses as WorkshopWorkResponse[],
    publishedInnovationId:
      typeof value.publishedInnovationId === 'string' ? value.publishedInnovationId : null,
  };
}

function parseInnovation(id: string, value: unknown): InnovationCase | null {
  if (
    !isRecord(value) ||
    !isWorkshopId(value.workshopId) ||
    typeof value.grade !== 'number' ||
    value.grade < 6 ||
    typeof value.title !== 'string' ||
    typeof value.summary !== 'string' ||
    typeof value.productType !== 'string' ||
    typeof value.work !== 'string' ||
    !Array.isArray(value.tags) ||
    !value.tags.every((tag) => typeof tag === 'string') ||
    typeof value.publishedAt !== 'string' ||
    value.approved !== true
  ) {
    return null;
  }
  return {
    id,
    workshopId: value.workshopId,
    grade: value.grade,
    title: value.title,
    summary: value.summary,
    productType: value.productType,
    work: value.work,
    tags: value.tags,
    publishedAt: value.publishedAt,
  };
}

export const innovationService = {
  async fetchPublished(): Promise<InnovationCase[]> {
    const publishedQuery = query(
      collection(getDatabase(), INNOVATION_COLLECTION),
      where('approved', '==', true),
      where('grade', '>=', 6),
    );
    const snapshot = await getDocs(publishedQuery);
    return snapshot.docs
      .map((item) => parseInnovation(item.id, item.data()))
      .filter((item): item is InnovationCase => item !== null)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  },

  async submitWork(
    workshopId: WorkshopSubmission['workshopId'],
    content: SubmissionContent,
    responses: WorkshopWorkResponse[],
  ): Promise<void> {
    if (
      Object.values(content).some((value) => value.length > 12000) ||
      responses.some(
        (response) =>
          !response.prompt.trim() ||
          !response.response.trim() ||
          response.prompt.length > 500 ||
          response.response.length > 12000,
      )
    ) {
      throw new Error(
        'Cada campo del trabajo debe tener un máximo de 12.000 caracteres y todas las respuestas deben estar completas.',
      );
    }
    if (!firebaseAuth) {
      throw new Error('Firebase no está configurado. Revisa las variables VITE_FIREBASE_*.');
    }
    const user = firebaseAuth.currentUser;
    if (!user?.uid || !user.email) {
      throw new Error('Debes iniciar sesión para enviar tu trabajo.');
    }
    const id = `${user.uid}_${workshopId}`;
    const reference = doc(getDatabase(), WORKSHOP_SUBMISSIONS_COLLECTION, id);
    const existing = await getDoc(reference);
    if (existing.exists() && typeof existing.data().publishedInnovationId === 'string') {
      throw new Error('Este trabajo ya fue publicado y no se puede reemplazar desde el asistente.');
    }
    const evaluation = await studentEvaluationService.fetchWorkshopEvaluation(
      user.email,
      workshopId,
    );
    if (evaluation?.sourceSubmissionId === id) {
      throw new Error('Este trabajo ya tiene una nota oficial y no se puede modificar.');
    }

    await setDoc(reference, {
      studentUid: user.uid,
      studentEmail: user.email.trim().toLowerCase(),
      workshopId,
      content,
      responses,
      submittedAt: new Date().toISOString(),
    }, { merge: true });
  },

  async fetchReviewSubmissions(): Promise<WorkshopSubmission[]> {
    const [submissionsSnapshot, evaluations] = await Promise.all([
      getDocs(collection(getDatabase(), WORKSHOP_SUBMISSIONS_COLLECTION)),
      studentEvaluationService.fetchAll(),
    ]);

    return submissionsSnapshot.docs
      .map((item) => {
        const submission = parseSubmission(item.id, item.data());
        if (!submission || submission.publishedInnovationId) return null;
        const evaluation = evaluations
          .get(submission.studentEmail.trim().toLowerCase())
          ?.get(submission.workshopId);
        const hasGrade = typeof evaluation?.grade === 'number';
        const gradeBelongsToSubmission = evaluation?.sourceSubmissionId === submission.id;
        return {
          ...submission,
          grade: hasGrade && gradeBelongsToSubmission ? evaluation.grade : null,
          gradeConflict: hasGrade && !gradeBelongsToSubmission,
          conflictingGrade: hasGrade && !gradeBelongsToSubmission ? evaluation.grade : null,
        };
      })
      .filter((item): item is WorkshopSubmission => item !== null)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  },

  async saveOfficialGrade(submissionId: string, grade: number): Promise<void> {
    const submissionSnapshot = await getDoc(
      doc(getDatabase(), WORKSHOP_SUBMISSIONS_COLLECTION, submissionId),
    );
    if (!submissionSnapshot.exists()) throw new Error('El trabajo ya no está disponible.');
    const submission = parseSubmission(submissionSnapshot.id, submissionSnapshot.data());
    if (!submission) throw new Error('El formato del trabajo enviado no es válido.');
    const evaluations = await studentEvaluationService.fetchAll();
    const currentEvaluation = evaluations
      .get(submission.studentEmail.trim().toLowerCase())
      ?.get(submission.workshopId);
    if (typeof currentEvaluation?.grade === 'number') {
      throw new Error(
        currentEvaluation.sourceSubmissionId === submission.id
          ? 'Este trabajo ya tiene una nota oficial.'
          : 'Ya existe una nota oficial para este taller, pero no está vinculada a esta entrega. No se reemplazó.',
      );
    }
    await studentEvaluationService.saveWorkshopGradeIfUnscored({
      email: submission.studentEmail,
      workshopId: submission.workshopId,
      grade,
      sourceSubmissionId: submission.id,
    });
  },

  async publish(payload: PublishInnovationPayload): Promise<void> {
    const title = payload.title.trim();
    const summary = payload.summary.trim();
    const work = payload.work.trim();
    const productType = payload.productType.trim();
    const tags = [...new Set(payload.tags.map((tag) => tag.trim()).filter(Boolean))];
    if (!payload.privacyReviewed) {
      throw new Error('Confirma la revisión de anonimización antes de publicar.');
    }
    if (!title || !summary || !work || !productType || tags.length === 0) {
      throw new Error('Completa el título, resumen, tipo de producto, contenido y al menos una etiqueta.');
    }
    if (
      title.length > 120 ||
      summary.length > 1000 ||
      productType.length > 100 ||
      work.length > 20000 ||
      tags.length > 10 ||
      tags.some((tag) => tag.length > 60)
    ) {
      throw new Error(
        'Revisa los límites: título 120, resumen 1.000, tipo 100, producto 20.000 caracteres y hasta 10 etiquetas de 60 caracteres.',
      );
    }

    const db = getDatabase();
    const submissionRef = doc(db, WORKSHOP_SUBMISSIONS_COLLECTION, payload.submissionId);
    const submissionSnapshot = await getDoc(submissionRef);
    if (!submissionSnapshot.exists()) throw new Error('El trabajo ya no está disponible.');
    const submission = parseSubmission(submissionSnapshot.id, submissionSnapshot.data());
    if (!submission) throw new Error('El formato del trabajo enviado no es válido.');
    if (submission.publishedInnovationId) {
      throw new Error('Este trabajo ya fue publicado.');
    }

    const innovationRef = doc(collection(db, INNOVATION_COLLECTION));
    const evaluationRef = doc(
      db,
      EVALUATIONS_COLLECTION,
      submission.studentEmail.trim().toLowerCase(),
    );
    await runTransaction(db, async (transaction) => {
      const [latestSubmissionSnapshot, evaluationSnapshot] = await Promise.all([
        transaction.get(submissionRef),
        transaction.get(evaluationRef),
      ]);
      if (!latestSubmissionSnapshot.exists()) {
        throw new Error('El trabajo ya no está disponible.');
      }
      const latestSubmission = parseSubmission(
        latestSubmissionSnapshot.id,
        latestSubmissionSnapshot.data(),
      );
      if (!latestSubmission) throw new Error('El formato del trabajo enviado no es válido.');
      if (latestSubmission.publishedInnovationId) {
        throw new Error('Este trabajo ya fue publicado.');
      }

      const workshops: unknown = evaluationSnapshot.data()?.workshops;
      const evaluationValue = isRecord(workshops)
        ? workshops[latestSubmission.workshopId]
        : null;
      if (
        !isRecord(evaluationValue) ||
        typeof evaluationValue.grade !== 'number' ||
        evaluationValue.grade < 6 ||
        evaluationValue.sourceSubmissionId !== latestSubmission.id
      ) {
        throw new Error('El trabajo requiere una nota oficial igual o superior a 6,0 vinculada a esta entrega.');
      }

      transaction.set(innovationRef, {
        workshopId: latestSubmission.workshopId,
        grade: evaluationValue.grade,
        title,
        summary,
        productType,
        work,
        tags,
        publishedAt: new Date().toISOString(),
        approved: true,
      });
      transaction.update(submissionRef, { publishedInnovationId: innovationRef.id });
    });
  },
};
