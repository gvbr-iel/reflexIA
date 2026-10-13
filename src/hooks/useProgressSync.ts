/**
 * @module hooks/useProgressSync
 *
 * Sube el resumen de avance del estudiante a Firestore al abrir su sesión.
 *
 * Los servicios de talleres y marco teórico ya publican el avance cada vez
 * que algo cambia. Este hook cubre el avance que el estudiante ya tenía
 * guardado en su navegador antes de que existiera la publicación.
 */

import { useEffect } from 'react'

import { studentProgressService } from '../services/studentProgressService'
import { useAuth } from './useAuth'

export function useProgressSync(): void {
  const { user } = useAuth()
  const uid = user?.uid

  // Se ejecuta una vez por sesión (y de nuevo si cambia el usuario).
  useEffect(() => {
    if (!uid) return
    void studentProgressService.sync()
  }, [uid])
}
