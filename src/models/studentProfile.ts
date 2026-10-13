/**
 * @module models/studentProfile
 *
 * Perfil de un estudiante para el panel docente: su nombre.
 *
 * Vive en la colección `profiles` de Cloud Firestore, con un documento por
 * estudiante (el id es su correo en minúsculas, igual que en la whitelist).
 * Por ahora el administrador lo carga a mano desde la consola de Firebase.
 *
 * Privacidad (AI_GUIDELINES §8): este nombre es el del estudiante en práctica,
 * usuario de ReflexIA. Es distinto de los nombres de las personas que aparecen
 * en los relatos de los talleres (niños, apoderados, colegas), que nunca se
 * registran.
 *
 * Los campos deben coincidir con las validaciones de `firestore.rules`.
 */

/** Nombre de la colección de Firestore. */
export const PROFILES_COLLECTION = 'profiles';

/** Documento de la colección `profiles`. */
export interface StudentProfile {
  /** Correo institucional en minúsculas; es también el id del documento. */
  email: string;
  /** Nombre completo del estudiante, para mostrar en el panel docente. */
  name: string;
}
