/**
 * @module views/admin-whitelist/hooks/useBulkUpload
 *
 * Lógica de la carga masiva de HU-01 / RF-01: lee un archivo CSV o TXT
 * (o texto pegado), extrae los correos y arma una vista previa que
 * indica qué pasará con cada uno antes de importarlos.
 *
 * Se aceptan correos uno por línea o separados por coma, punto y coma
 * o tabulación. En un CSV con varias columnas se toman solo las celdas
 * que contienen "@", y una primera fila sin correos se trata como
 * encabezado.
 */

import { useState, useCallback, useMemo } from 'react';

import type {
  WhitelistEntry,
  WhitelistRole,
  BulkPreviewRow,
  BulkRowStatus,
} from '../../../models/whitelist';
import {
  normalizeEmail,
  validateInstitutionalEmail,
} from '../../../utils/institutionalEmail';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

/** Desde dónde se ingresan los correos. */
export type BulkSourceMode = 'file' | 'paste';

/** Archivo leído correctamente. */
export interface LoadedFile {
  name: string;
  text: string;
}

/** Cantidad de líneas por cada estado de la vista previa. */
export type BulkPreviewCounts = Record<BulkRowStatus, number>;

/** Estado y acciones expuestos por el hook. */
export interface UseBulkUploadReturn {
  role: WhitelistRole;
  setRole: (role: WhitelistRole) => void;
  mode: BulkSourceMode;
  setMode: (mode: BulkSourceMode) => void;

  file: LoadedFile | null;
  /** Mensaje si el archivo no se pudo usar (null si no hay error). */
  fileError: string | null;
  isReadingFile: boolean;
  loadFile: (file: File) => Promise<void>;
  clearFile: () => void;

  pastedText: string;
  setPastedText: (text: string) => void;

  /** Vista previa del origen activo (vacía si no hay correos). */
  rows: BulkPreviewRow[];
  counts: BulkPreviewCounts;
  /** Correos que se enviarán al servicio (nuevos y por reactivar). */
  emailsToImport: string[];
  /** Líneas que no son correos @ucen.cl válidos; bloquean la importación. */
  rejectedRows: BulkPreviewRow[];

  downloadTemplate: () => void;
  /** Vuelve al estado inicial (al cerrar el modal o tras importar). */
  reset: () => void;
}

// ─────────────────────────────────────────────
// Constantes y funciones auxiliares
// ─────────────────────────────────────────────

/** Extensiones de archivo aceptadas. */
const ACCEPTED_EXTENSIONS = ['.csv', '.txt'];

/** Contenido de la plantilla que se descarga como ejemplo (\n = salto de línea). */
const TEMPLATE_CSV =
  'correo\nestudiante.ejemplo01@ucen.cl\nestudiante.ejemplo02@ucen.cl\n';

/** Contadores en cero, uno por cada estado posible de una línea. */
const EMPTY_COUNTS: BulkPreviewCounts = {
  new: 0,
  reactivate: 0,
  existing: 0,
  duplicate: 0,
  'invalid-format': 0,
  'invalid-domain': 0,
};

/** Separa el texto en valores candidatos, con su número de línea. */
function extractCandidates(text: string): Array<{ line: number; value: string }> {
  const candidates: Array<{ line: number; value: string }> = [];

  // Se recorre el texto línea por línea (\r?\n sirve para Windows y Mac/Linux).
  text.split(/\r?\n/).forEach((rawLine, index) => {
    // Cada línea se corta en celdas por coma, punto y coma o tabulación,
    // y se quitan espacios y comillas de los extremos.
    const cells = rawLine
      .split(/[,;\t]/)
      .map((cell) => cell.trim().replace(/^"|"$/g, '').trim())
      .filter(Boolean);
    if (cells.length === 0) return;

    // Solo interesan las celdas que parecen correos (tienen "@").
    const withAt = cells.filter((cell) => cell.includes('@'));
    if (withAt.length > 0) {
      withAt.forEach((value) => candidates.push({ line: index + 1, value }));
      return;
    }

    // Primera fila sin correos: encabezado. Si no, es una línea mal escrita.
    if (index > 0) candidates.push({ line: index + 1, value: rawLine.trim() });
  });

  return candidates;
}

/** Clasifica cada candidato según el formato y la whitelist actual. */
function buildPreview(text: string, entries: WhitelistEntry[]): BulkPreviewRow[] {
  // Estado actual de cada correo en la whitelist (activo o revocado).
  const statusByEmail = new Map(entries.map((e) => [e.email, e.status]));
  // Correos ya vistos en esta misma carga, para marcar los repetidos.
  const seen = new Set<string>();

  return extractCandidates(text).map(({ line, value }) => {
    const validation = validateInstitutionalEmail(value);
    if (validation !== 'valid') return { line, value, status: validation };

    // Correo válido: se decide qué pasará con él al importar.
    const email = normalizeEmail(value);
    let status: BulkRowStatus;
    if (seen.has(email)) status = 'duplicate';
    else if (statusByEmail.get(email) === 'active') status = 'existing';
    else if (statusByEmail.get(email) === 'revoked') status = 'reactivate';
    else status = 'new';

    seen.add(email);
    return { line, value: email, status };
  });
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

/**
 * @param entries Whitelist actual, para detectar correos ya registrados.
 */
export function useBulkUpload(entries: WhitelistEntry[]): UseBulkUploadReturn {
  const [role, setRole] = useState<WhitelistRole>('student');
  const [mode, setMode] = useState<BulkSourceMode>('file');
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [pastedText, setPastedText] = useState('');

  /** Valida la extensión, lee el texto del archivo y confirma que tenga correos. */
  const loadFile = useCallback(async (selected: File) => {
    setFileError(null);

    const name = selected.name.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
      setFile(null);
      setFileError(
        `"${selected.name}" no es un archivo CSV o TXT. ` +
        'Si tienes un Excel, guárdalo como CSV y vuelve a subirlo.',
      );
      return;
    }

    setIsReadingFile(true);
    try {
      const text = await selected.text();
      if (extractCandidates(text).length === 0) {
        setFile(null);
        setFileError(
          `"${selected.name}" no contiene correos. ` +
          'Revisa que tenga un correo por fila.',
        );
        return;
      }
      setFile({ name: selected.name, text });
    } catch {
      setFile(null);
      setFileError('No se pudo leer el archivo. Intenta subirlo nuevamente.');
    } finally {
      setIsReadingFile(false);
    }
  }, []);

  const clearFile = useCallback(() => {
    setFile(null);
    setFileError(null);
  }, []);

  // Texto que se analiza: el del archivo o el pegado, según la pestaña elegida.
  const sourceText = mode === 'file' ? file?.text ?? '' : pastedText;

  const rows = useMemo(() => buildPreview(sourceText, entries), [sourceText, entries]);

  const counts = useMemo(() => {
    const result = { ...EMPTY_COUNTS };
    rows.forEach((row) => result[row.status]++);
    return result;
  }, [rows]);

  const emailsToImport = useMemo(
    () =>
      rows
        .filter((row) => row.status === 'new' || row.status === 'reactivate')
        .map((row) => row.value),
    [rows],
  );

  const rejectedRows = useMemo(
    () =>
      rows.filter((row) => row.status === 'invalid-domain' || row.status === 'invalid-format'),
    [rows],
  );

  /** Descarga la plantilla CSV: crea un archivo en memoria (Blob) y simula un clic en un enlace. */
  const downloadTemplate = useCallback(() => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla-whitelist.csv';
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const reset = useCallback(() => {
    setRole('student');
    setMode('file');
    setFile(null);
    setFileError(null);
    setPastedText('');
  }, []);

  return {
    role,
    setRole,
    mode,
    setMode,
    file,
    fileError,
    isReadingFile,
    loadFile,
    clearFile,
    pastedText,
    setPastedText,
    rows,
    counts,
    emailsToImport,
    rejectedRows,
    downloadTemplate,
    reset,
  };
}
