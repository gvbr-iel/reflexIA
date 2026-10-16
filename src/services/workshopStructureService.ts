/**
 * Persistencia de la configuración docente de talleres en Cloud Firestore.
 */

import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';

import {
  createDefaultWorkshopConfiguration,
  isWorkshopId,
  validateWorkshopConfiguration,
  type WorkshopId,
  type WorkshopStructureConfiguration,
} from '../models/workshopStructure';
import { firebaseAuth, firestoreDb } from './firebase';

export const WORKSHOP_CONFIGURATIONS_COLLECTION = 'workshopConfigurations';

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

function readConfiguration(
  value: unknown,
  expectedWorkshopId: WorkshopId,
): WorkshopStructureConfiguration {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('La configuración guardada del taller tiene un formato inválido.');
  }

  const configuration = value as WorkshopStructureConfiguration;
  if (configuration.workshopId !== expectedWorkshopId) {
    throw new Error('La configuración guardada no corresponde al taller solicitado.');
  }
  const validationError = validateWorkshopConfiguration(configuration);
  if (validationError) {
    throw new Error(`La configuración guardada del taller no es válida: ${validationError}`);
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

    return readConfiguration(snapshot.data(), workshopId);
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
      updatedAt: new Date().toISOString(),
      updatedBy: email,
    };

    await setDoc(
      doc(database, WORKSHOP_CONFIGURATIONS_COLLECTION, saved.workshopId),
      saved,
    );
    return saved;
  },

  async resetConfiguration(workshopId: string): Promise<WorkshopStructureConfiguration> {
    requireWorkshopId(workshopId);
    const database = requireFirestore();
    await deleteDoc(doc(database, WORKSHOP_CONFIGURATIONS_COLLECTION, workshopId));
    return createDefaultWorkshopConfiguration(workshopId);
  },
};
