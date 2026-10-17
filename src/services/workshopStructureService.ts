/**
 * Persistencia de la configuración docente de talleres en Cloud Firestore.
 */

import { doc, getDoc, writeBatch } from 'firebase/firestore';

import {
  createDefaultWorkshopConfiguration,
  isWorkshopId,
  toStudentWorkshopConfiguration,
  validateWorkshopConfiguration,
  type WorkshopId,
  type WorkshopOpenEndedQuestion,
  type WorkshopStudentConfiguration,
  type WorkshopStructureConfiguration,
} from '../models/workshopStructure';
import { firebaseAuth, firestoreDb } from './firebase';

export const WORKSHOP_CONFIGURATIONS_COLLECTION = 'workshopConfigurations';
const PRIVATE_CONFIGURATIONS_COLLECTION = 'private';
const ANSWER_KEY_DOCUMENT = 'answerKey';

function requireFirestore() {
  if (!firestoreDb) {
    throw new Error('Firebase no está configurado. Revisa las variables VITE_FIREBASE_*.');
  }
  return firestoreDb;
}

function requireWorkshopId(workshopId: string): asserts workshopId is WorkshopId {
  if (!isWorkshopId(workshopId)) {
    throw new Error(`El identificador de taller "${workshopId}" no es válido.`);
  }
}

function normalizeEvaluationType(value: unknown): unknown {
  return value === 'matrix' || value === 'file' ? 'text' : value;
}

function normalizeQuestions(questions: unknown[]): unknown[] {
  return questions.map((question) => {
    if (typeof question !== 'object' || question === null || Array.isArray(question)) {
      return question;
    }
    const record = question as Record<string, unknown>;
    return { ...record, type: record.type ?? 'multiple-choice' };
  });
}

function readStudentConfiguration(
  value: unknown,
  expectedWorkshopId: WorkshopId,
): WorkshopStudentConfiguration {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('La configuración guardada del taller tiene un formato inválido.');
  }
  const raw = value as Record<string, unknown>;
  if (raw.workshopId !== expectedWorkshopId || typeof raw.formSchema !== 'object' || raw.formSchema === null) {
    throw new Error('La configuración guardada no corresponde al taller solicitado.');
  }

  const formSchema = raw.formSchema as Record<string, unknown>;
  if (!Array.isArray(formSchema.questions)) {
    throw new Error('Las preguntas configuradas del taller no tienen un formato válido.');
  }
  const configuration = {
    ...raw,
    evaluationType: normalizeEvaluationType(raw.evaluationType),
    formSchema: {
      ...formSchema,
      questions: normalizeQuestions(formSchema.questions).map((question) => {
        if (typeof question !== 'object' || question === null || Array.isArray(question)) {
          throw new Error('Una pregunta del taller tiene un formato inválido.');
        }
        const { correctOptionIndex: _, ...publicQuestion } = question as Record<string, unknown>;
        return publicQuestion;
      }),
    },
  } as WorkshopStudentConfiguration;

  const validationConfiguration: WorkshopStructureConfiguration = {
    ...configuration,
    formSchema: {
      ...configuration.formSchema,
      questions: configuration.formSchema.questions.map((question) =>
        question.type === 'multiple-choice'
          ? { ...question, correctOptionIndex: 0 }
          : question as WorkshopOpenEndedQuestion,
      ),
    },
  };
  const validationError = validateWorkshopConfiguration(validationConfiguration);
  if (validationError) {
    throw new Error(`La configuración del taller no es válida: ${validationError}`);
  }
  return configuration;
}

export const workshopStructureService = {
  async fetchConfiguration(workshopId: string): Promise<WorkshopStructureConfiguration> {
    requireWorkshopId(workshopId);
    const database = requireFirestore();
    const snapshot = await getDoc(doc(database, WORKSHOP_CONFIGURATIONS_COLLECTION, workshopId));

    if (!snapshot.exists()) {
      return createDefaultWorkshopConfiguration(workshopId);
    }

    const rawConfiguration = snapshot.data();
    if (rawConfiguration.answerKeyPrivate !== true) {
      const email = firebaseAuth?.currentUser?.email;
      if (!email) throw new Error('No se pudo identificar al docente para migrar la configuración.');
      const legacy = {
        ...rawConfiguration,
        evaluationType: normalizeEvaluationType(rawConfiguration.evaluationType),
        formSchema: {
          ...rawConfiguration.formSchema,
          questions: Array.isArray(rawConfiguration.formSchema?.questions)
            ? normalizeQuestions(rawConfiguration.formSchema.questions)
            : rawConfiguration.formSchema?.questions,
        },
        answerKeyPrivate: true,
        updatedAt: new Date().toISOString(),
        updatedBy: email,
      } as WorkshopStructureConfiguration;
      const validationError = validateWorkshopConfiguration(legacy);
      if (validationError) {
        throw new Error(`La configuración antigua del taller no es válida: ${validationError}`);
      }
      const migrated = toStudentWorkshopConfiguration(legacy);
      const legacyAnswers = Object.fromEntries(
        legacy.formSchema.questions
          .filter((question) => question.type === 'multiple-choice')
          .map((question) => [question.id, question.correctOptionIndex]),
      );
      const migration = writeBatch(database);
      migration.set(
        doc(database, WORKSHOP_CONFIGURATIONS_COLLECTION, workshopId),
        migrated,
      );
      migration.set(
        doc(
          database,
          WORKSHOP_CONFIGURATIONS_COLLECTION,
          workshopId,
          PRIVATE_CONFIGURATIONS_COLLECTION,
          ANSWER_KEY_DOCUMENT,
        ),
        {
          workshopId,
          answers: legacyAnswers,
          updatedAt: legacy.updatedAt,
          updatedBy: email,
        },
      );
      await migration.commit();
      return legacy;
    }

    const publicConfiguration = readStudentConfiguration(rawConfiguration, workshopId);
    const answerKeySnapshot = await getDoc(
      doc(
        database,
        WORKSHOP_CONFIGURATIONS_COLLECTION,
        workshopId,
        PRIVATE_CONFIGURATIONS_COLLECTION,
        ANSWER_KEY_DOCUMENT,
      ),
    );
    if (!answerKeySnapshot.exists()) {
      throw new Error('No se encontró la pauta privada de respuestas del taller.');
    }
    const answerKey: unknown = answerKeySnapshot.data().answers;
    if (typeof answerKey !== 'object' || answerKey === null || Array.isArray(answerKey)) {
      throw new Error('La pauta privada de respuestas del taller no es válida.');
    }

    const configuration: WorkshopStructureConfiguration = {
      ...publicConfiguration,
      formSchema: {
        ...publicConfiguration.formSchema,
        questions: publicConfiguration.formSchema.questions.map((question) => {
          if (question.type === 'open-ended') return question;
          const correctOptionIndex = (answerKey as Record<string, unknown>)[question.id];
          if (
            !Number.isInteger(correctOptionIndex) ||
            (correctOptionIndex as number) < 0 ||
            (correctOptionIndex as number) >= question.options.length
          ) {
            throw new Error('La pauta privada contiene una respuesta correcta inválida.');
          }
          return { ...question, correctOptionIndex: correctOptionIndex as number };
        }),
      },
    };
    const validationError = validateWorkshopConfiguration(configuration);
    if (validationError) throw new Error(validationError);
    return configuration;
  },

  async fetchStudentConfiguration(workshopId: string): Promise<WorkshopStudentConfiguration> {
    requireWorkshopId(workshopId);
    const database = requireFirestore();
    const snapshot = await getDoc(doc(database, WORKSHOP_CONFIGURATIONS_COLLECTION, workshopId));
    if (!snapshot.exists()) {
      return toStudentWorkshopConfiguration(createDefaultWorkshopConfiguration(workshopId));
    }
    return readStudentConfiguration(snapshot.data(), workshopId);
  },

  async saveConfiguration(
    configuration: WorkshopStructureConfiguration,
  ): Promise<WorkshopStructureConfiguration> {
    const database = requireFirestore();
    const validationError = validateWorkshopConfiguration(configuration);
    if (validationError) throw new Error(validationError);

    const email = firebaseAuth?.currentUser?.email;
    if (!email) throw new Error('No se pudo identificar al docente con sesión activa.');

    const saved: WorkshopStructureConfiguration = {
      ...configuration,
      answerKeyPrivate: true,
      updatedAt: new Date().toISOString(),
      updatedBy: email,
    };

    const publicConfiguration = toStudentWorkshopConfiguration(saved);
    const answers = Object.fromEntries(
      saved.formSchema.questions
        .filter((question) => question.type === 'multiple-choice')
        .map((question) => [question.id, question.correctOptionIndex]),
    );
    const batch = writeBatch(database);
    batch.set(
      doc(database, WORKSHOP_CONFIGURATIONS_COLLECTION, saved.workshopId),
      publicConfiguration,
    );
    batch.set(
      doc(
        database,
        WORKSHOP_CONFIGURATIONS_COLLECTION,
        saved.workshopId,
        PRIVATE_CONFIGURATIONS_COLLECTION,
        ANSWER_KEY_DOCUMENT,
      ),
      { workshopId: saved.workshopId, answers, updatedAt: saved.updatedAt, updatedBy: email },
    );
    await batch.commit();
    return saved;
  },

  async resetConfiguration(workshopId: string): Promise<WorkshopStructureConfiguration> {
    requireWorkshopId(workshopId);
    const database = requireFirestore();
    const batch = writeBatch(database);
    batch.delete(doc(database, WORKSHOP_CONFIGURATIONS_COLLECTION, workshopId));
    batch.delete(
      doc(
        database,
        WORKSHOP_CONFIGURATIONS_COLLECTION,
        workshopId,
        PRIVATE_CONFIGURATIONS_COLLECTION,
        ANSWER_KEY_DOCUMENT,
      ),
    );
    await batch.commit();
    return createDefaultWorkshopConfiguration(workshopId);
  },
};
