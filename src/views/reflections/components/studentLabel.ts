import type { Reflection } from '../../../models/reflection'

/* ------------------------------------------------
   getStudentLabel — HU-02 / RF-02

   Texto con que se identifica al estudiante de una
   reflexión: su nombre o, si aún no tiene un perfil
   cargado, su correo. Lo usan la lista, el relato y la
   ventana de validación, para que siempre se llame igual.
   ------------------------------------------------ */

export function getStudentLabel(
  reflection: Pick<Reflection, 'studentName' | 'studentEmail'>,
): string {
  return reflection.studentName ?? reflection.studentEmail
}
