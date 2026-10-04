/**
 * @module views/critical-incidents/hooks/useSensitiveDataDetector
 *
 * Hook para la detección de datos sensibles en los relatos de incidentes críticos
 * (HU-05 / RF-05 / RNF-01).
 *
 * Responsabilidades:
 * - Orquestar la llamada asíncrona hacia openRouterService.
 * - Gestionar los estados de carga (isAnalyzing), error (analysisError) y resultados (detectedWords).
 * - Proteger contra reentrancia (evitar múltiples llamadas simultáneas).
 * - Descartar respuestas obsoletas si se dispara un nuevo análisis o se limpia el estado.
 * - Proveer función de reinicio (clearResults) para cuando el usuario cambie de paso o edite el texto.
 *
 * Reglas aplicadas (AI_GUIDELINES §9):
 * - R5: Lógica y estado encapsulados en el hook; componentes puramente presentacionales.
 * - R9: Manejo explícito de estados de carga, error, vacío y contenido detectado.
 * - R10: Mensajes en español claros y formativos.
 */

import { useState, useCallback, useRef } from 'react';

import type { SensitiveWord } from '../../../models/sensitiveData';
import { openRouterService } from '../../../services/openRouterService';

/**
 * Interfaz pública del hook useSensitiveDataDetector.
 */
export interface UseSensitiveDataDetectorReturn {
  /** Indica si la petición hacia el servicio de detección está en curso. */
  isAnalyzing: boolean;
  /** Mensaje de error legible en español (null si la operación fue exitosa o no ha iniciado). */
  analysisError: string | null;
  /** Lista de palabras sensibles detectadas, normalizadas y ordenadas por startIndex. */
  detectedWords: SensitiveWord[];
  /** Texto original exacto que fue analizado en la última ejecución. */
  analyzedText: string | null;
  /** Booleano que indica si ya se completó al menos un intento de análisis en el paso actual. */
  hasAnalyzed: boolean;
  /** Booleano que indica si se detectó al menos una entidad sensible. */
  hasSensitiveData: boolean;
  /** Dispara el análisis asíncrono sobre el texto proporcionado. */
  analyze: (text: string) => Promise<void>;
  /** Reinicia el estado del detector a sus valores iniciales. */
  clearResults: () => void;
}

export function useSensitiveDataDetector(): UseSensitiveDataDetectorReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [detectedWords, setDetectedWords] = useState<SensitiveWord[]>([]);
  const [analyzedText, setAnalyzedText] = useState<string | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // Evita carreras entre peticiones y reentrancia
  const latestRequestRef = useRef(0);
  const isAnalyzingRef = useRef(false);

  const clearResults = useCallback(() => {
    // Invalida cualquier petición que pudiera estar en vuelo
    latestRequestRef.current += 1;
    isAnalyzingRef.current = false;

    setIsAnalyzing(false);
    setAnalysisError(null);
    setDetectedWords([]);
    setAnalyzedText(null);
    setHasAnalyzed(false);
  }, []);

  const analyze = useCallback(async (text: string) => {
    // Protección contra llamadas concurrentes mientras un análisis ya está en curso
    if (isAnalyzingRef.current) {
      return;
    }

    const trimmed = (text ?? '').trim();
    if (!trimmed) {
      setAnalysisError('Por favor ingresa un texto antes de solicitar la detección de datos sensibles.');
      setDetectedWords([]);
      setAnalyzedText(text ?? '');
      setHasAnalyzed(true);
      return;
    }

    const requestId = ++latestRequestRef.current;
    isAnalyzingRef.current = true;
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await openRouterService.detectSensitiveData(text);

      // Si se inició otra petición o se llamó a clearResults mientras se resolvía la API, descartar
      if (requestId !== latestRequestRef.current) {
        return;
      }

      setDetectedWords(result.detectedWords);
      setAnalyzedText(result.originalText);
      setAnalysisError(null);
      setHasAnalyzed(true);
    } catch (err: unknown) {
      if (requestId !== latestRequestRef.current) {
        return;
      }

      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Ocurrió un error inesperado al analizar el texto. Por favor, intenta nuevamente.';

      setAnalysisError(errorMessage);
      setDetectedWords([]);
      setAnalyzedText(text);
      setHasAnalyzed(true);
    } finally {
      if (requestId === latestRequestRef.current) {
        isAnalyzingRef.current = false;
        setIsAnalyzing(false);
      }
    }
  }, []);

  const hasSensitiveData = detectedWords.length > 0;

  return {
    isAnalyzing,
    analysisError,
    detectedWords,
    analyzedText,
    hasAnalyzed,
    hasSensitiveData,
    analyze,
    clearResults,
  };
}
