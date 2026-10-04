/**
 * @module utils/institutionalEmail
 *
 * Validación de correos institucionales (RNF-02).
 * La usan la whitelist (HU-01) y el inicio de sesión (RF-08).
 */

import { INSTITUTIONAL_DOMAIN } from '../models/whitelist';

/** Resultado de validar un correo. */
export type EmailValidation = 'valid' | 'invalid-format' | 'invalid-domain';

// Formato general usuario@dominio.tld, sin espacios.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Quita espacios y pasa a minúsculas para comparar correos. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Valida que el correo tenga formato correcto y dominio `@ucen.cl`. */
export function validateInstitutionalEmail(email: string): EmailValidation {
  const normalized = normalizeEmail(email);

  if (!EMAIL_PATTERN.test(normalized)) return 'invalid-format';
  if (!normalized.endsWith(INSTITUTIONAL_DOMAIN)) return 'invalid-domain';
  return 'valid';
}
