/**
 * @module services/firebase
 *
 * Inicializa Firebase una sola vez y exporta sus dos servicios:
 * - `firebaseAuth`: inicio y cierre de sesión (Firebase Authentication).
 * - `firestoreDb`: base de datos en la nube (Cloud Firestore), donde vive la
 *   whitelist de correos autorizados (HU-01).
 *
 * El resto de la app nunca inicializa Firebase por su cuenta: siempre importa
 * estas dos constantes desde aquí.
 */

import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

/**
 * Configuración pública de Firebase (web client config).
 * Estos valores NO son credenciales privadas: son visibles en el JS del
 * navegador de cualquier app web Firebase. La seguridad la proveen las
 * Firestore Security Rules y Firebase Auth, no estas claves.
 *
 * Se pueden sobreescribir con variables VITE_FIREBASE_* en .env si se
 * necesita apuntar a otro proyecto. El operador `??` usa el valor de la
 * derecha solo cuando la variable de entorno no existe.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyBzPCI1GIezQB_mzwkY-OLhWRZHp_UrKRg',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'reflexia-a6203.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'reflexia-a6203',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'reflexia-a6203.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '400539127712',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:400539127712:web:19435f7287b41b01a05ec5',
}

/** true si todos los valores de la configuración están presentes (ninguno vacío). */
export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean)

/*
 * Instancia de Firebase:
 * - si falta configuración → null (la app mostrará un error en vez de romperse);
 * - si ya existe una (por ejemplo, tras una recarga en caliente de Vite) → se reutiliza;
 * - si no existe → se crea.
 */
const firebaseApp = isFirebaseConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null

/** Servicio de autenticación (null si Firebase no está configurado). */
export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null
/** Base de datos Firestore (null si Firebase no está configurado). */
export const firestoreDb = firebaseApp ? getFirestore(firebaseApp) : null
