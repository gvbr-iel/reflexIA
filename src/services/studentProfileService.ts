/**
 * @module services/studentProfileService
 *
 * Lee el nombre de los estudiantes desde Cloud Firestore.
 *
 * Los nombres viven en la colección `profiles`, con un documento por
 * estudiante (el id es su correo en minúsculas). Ver `models/studentProfile.ts`.
 *
 * Lo usan el panel docente (`/docente`) y la revisión de reflexiones
 * (`/docente/reflexiones`), para mostrar el mismo nombre en las dos pantallas.
 *
 * Regla R4 (AI_GUIDELINES §9): las vistas y componentes NO llaman
 * a la API directamente; lo hacen a través de un servicio (vía hook).
 *
 * Los permisos los aplican las reglas de seguridad de Firestore.
 */

import { collection, getDocs } from 'firebase/firestore';

import { PROFILES_COLLECTION } from '../models/studentProfile';
import { firestoreDb } from './firebase';

/** Operaciones de los perfiles de estudiantes. */
export const studentProfileService = {
  /**
   * Devuelve el nombre de cada estudiante que tiene perfil, en un Map
   * (correo → nombre).
   *
   * Los perfiles se cargan a mano, así que un documento sin nombre o con el
   * nombre vacío se ignora en vez de dar error: ese estudiante simplemente
   * no aparece en el Map.
   */
  async fetchNames(): Promise<Map<string, string>> {
    if (!firestoreDb) {
      throw new Error('Firebase no está configurado. Revisa las variables VITE_FIREBASE_*.');
    }

    const snapshot = await getDocs(collection(firestoreDb, PROFILES_COLLECTION));
    const names = new Map<string, string>();

    for (const item of snapshot.docs) {
      const name: unknown = item.data().name;
      if (typeof name === 'string' && name.trim() !== '') {
        names.set(item.id, name.trim());
      }
    }

    return names;
  },
};
