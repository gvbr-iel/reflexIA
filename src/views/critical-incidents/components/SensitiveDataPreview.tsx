/**
 * @module views/critical-incidents/components/SensitiveDataPreview
 *
 * Componente presentacional que visualiza los resultados del análisis de
 * datos sensibles en el relato de un incidente crítico (HU-05 / RF-05 / RNF-01).
 *
 * Responsabilidades:
 * - Renderizar el estado de carga (skeleton animado).
 * - Renderizar el estado de error con opción de reintento.
 * - Renderizar confirmación de texto limpio cuando no se detectan datos sensibles.
 * - Renderizar el texto original con las palabras sensibles destacadas en color
 *   semántico rojo (`perf-fail`), badges con el resumen por categoría y advertencia formativa.
 *
 * Reglas aplicadas (AI_GUIDELINES §9):
 * - R1: Uso de Button global para reintentar.
 * - R2: Componente ubicado en views/critical-incidents/components/.
 * - R3: Tokens de color (perf-fail para datos sensibles, accent-ia para limpio, surface, border).
 * - R5: Sin estado propio; todo se recibe vía props.
 * - R8: Responsive y adaptable a móvil (360 px).
 * - R9: Cobertura exhaustiva de estados (cargando, error, limpio, con datos).
 * - R10: Textos en español claros y respetuosos.
 */

import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { ShieldAlert, ShieldCheck, AlertCircle, X } from 'lucide-react';

import type { SensitiveWord, SensitiveCategory } from '../../../models/sensitiveData';
import { SENSITIVE_CATEGORY_LABELS } from '../../../models/sensitiveData';
import Button from '../../../components/Button';

export interface SensitiveDataPreviewProps {
  /** Texto original que fue analizado. */
  originalText: string;
  /** Palabras sensibles detectadas con sus posiciones y categorías. */
  detectedWords: SensitiveWord[];
  /** Indica si el análisis hacia la API está en curso. */
  isAnalyzing: boolean;
  /** Mensaje de error si la petición falló (null si no hay error). */
  analysisError: string | null;
  /** Booleano que indica si ya se ejecutó al menos un análisis. */
  hasAnalyzed: boolean;
  /** Booleano que indica si se encontraron datos sensibles. */
  hasSensitiveData: boolean;
  /** Callback para volver a ejecutar el análisis del texto. */
  onRetry: () => void;
  /** Callback para cerrar o descartar la vista previa. */
  onDismiss: () => void;
}

/**
 * Segmenta el texto original y envuelve cada coincidencia en una etiqueta <mark>
 * destacada con fondo y tipografía en color semántico rojo (perf-fail).
 */
function renderHighlightedText(text: string, words: SensitiveWord[]): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  for (const item of words) {
    if (item.startIndex > lastIndex) {
      parts.push(text.substring(lastIndex, item.startIndex));
    }
    parts.push(
      <mark
        key={`${item.startIndex}-${item.endIndex}`}
        className="bg-perf-fail/15 text-perf-fail font-semibold rounded px-1 py-0.5"
        title={SENSITIVE_CATEGORY_LABELS[item.category]}
      >
        {item.word}
      </mark>
    );
    lastIndex = item.endIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

export default function SensitiveDataPreview({
  originalText,
  detectedWords,
  isAnalyzing,
  analysisError,
  hasAnalyzed,
  hasSensitiveData,
  onRetry,
  onDismiss,
}: SensitiveDataPreviewProps) {
  // 1. Si no se está analizando, no hay error y no se ha analizado, no renderizar nada
  if (!isAnalyzing && !analysisError && !hasAnalyzed) {
    return null;
  }

  // 2. Estado de carga: skeleton animado
  if (isAnalyzing) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label="Analizando relato en busca de datos sensibles"
        className="rounded-xl border border-border bg-surface p-4 md:p-5 space-y-3"
      >
        <div className="flex items-center gap-2.5 text-primary">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm font-medium">
            Analizando relato en busca de datos sensibles...
          </p>
        </div>
        <div className="space-y-2 animate-pulse pt-1">
          <div className="h-4 w-full rounded bg-border/50" />
          <div className="h-4 w-5/6 rounded bg-border/50" />
          <div className="h-4 w-2/3 rounded bg-border/50" />
        </div>
      </div>
    );
  }

  // 3. Estado de error: alerta informativa y botón reintentar
  if (analysisError) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-border bg-surface p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
          <div className="space-y-1">
            <h3 className="font-heading font-semibold text-sm text-texto">
              No se pudo completar el análisis de datos sensibles
            </h3>
            <p className="text-sm text-texto/80 leading-relaxed">
              {analysisError}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <Button variant="outline" size="sm" onClick={onRetry}>
            Reintentar
          </Button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Cerrar aviso de error"
            className="rounded-lg p-1.5 text-texto/60 hover:text-texto hover:bg-bg transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  // 4. Estado limpio: ningún dato sensible encontrado
  if (!hasSensitiveData) {
    return (
      <div
        role="status"
        className="rounded-xl border border-accent-ia/30 bg-accent-ia/5 p-4 md:p-5 flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <ShieldCheck size={22} className="text-accent-ia shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium text-texto">
            No se detectaron datos sensibles en este paso del relato.
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar resultado"
          className="rounded-lg p-1.5 text-texto/60 hover:text-texto hover:bg-accent-ia/10 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  // 5. Estado con datos sensibles detectados
  return (
    <SensitiveDataDetectedView
      originalText={originalText}
      detectedWords={detectedWords}
      onDismiss={onDismiss}
    />
  );
}

/**
 * Subcomponente auxiliar que organiza la visualización detallada de datos sensibles.
 */
function SensitiveDataDetectedView({
  originalText,
  detectedWords,
  onDismiss,
}: {
  originalText: string;
  detectedWords: SensitiveWord[];
  onDismiss: () => void;
}) {
  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<SensitiveCategory, number>> = {};
    for (const item of detectedWords) {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
    }
    return counts;
  }, [detectedWords]);

  const countEntries = Object.entries(categoryCounts) as [SensitiveCategory, number][];
  const totalCount = detectedWords.length;
  const titleText =
    totalCount === 1
      ? 'Se detectó 1 posible dato sensible'
      : `Se detectaron ${totalCount} posibles datos sensibles`;

  return (
    <section
      role="alert"
      aria-label="Datos sensibles detectados en el relato"
      className="rounded-xl border border-perf-fail/30 bg-surface p-4 md:p-5 space-y-4 shadow-sm"
    >
      {/* Encabezado con ícono, conteo y botón de cerrar */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldAlert size={22} className="text-perf-fail shrink-0" aria-hidden="true" />
          <h3 className="font-heading font-semibold text-base text-texto">
            {titleText}
          </h3>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar vista previa de datos sensibles"
          className="rounded-lg p-1.5 text-texto/60 hover:text-texto hover:bg-bg transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Resumen por categorías en badges */}
      <div className="flex flex-wrap items-center gap-2" aria-label="Resumen por categoría">
        {countEntries.map(([category, count]) => (
          <span
            key={category}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-perf-fail/10 text-perf-fail border border-perf-fail/20"
          >
            <span>{SENSITIVE_CATEGORY_LABELS[category]}:</span>
            <span className="font-bold">{count}</span>
          </span>
        ))}
      </div>

      {/* Texto original con coincidencias resaltadas */}
      <div className="rounded-lg border border-border bg-bg/50 p-4 font-body text-sm leading-relaxed text-texto whitespace-pre-wrap max-h-80 overflow-y-auto">
        {renderHighlightedText(originalText, detectedWords)}
      </div>

      {/* Aviso pedagógico explicativo */}
      <p className="text-xs md:text-sm text-texto/70 leading-relaxed">
        <strong>Nota de confidencialidad:</strong> Modifica los nombres o instituciones señalados en el campo de texto de arriba antes de continuar. El sistema no altera tu redacción automáticamente para preservar tu intención pedagógica.
      </p>
    </section>
  );
}
