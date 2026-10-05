/**
 * @module views/admin-whitelist/hooks/useWhitelist
 *
 * Estado y acciones de la whitelist para HU-01 / RF-01: carga de la
 * lista, filtros de búsqueda, altas, cargas masivas, revocación y
 * restablecimiento de accesos.
 *
 * Las acciones actualizan la lista local con la respuesta del servicio,
 * sin volver a mostrar la carga, y dejan un aviso (`notice`) que se
 * oculta solo a los pocos segundos.
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';

import type {
  WhitelistEntry,
  WhitelistRole,
  WhitelistStatus,
  WhitelistStats,
  AddEntryPayload,
  BulkImportPayload,
  BulkImportResult,
} from '../../../models/whitelist';
import { whitelistService, WhitelistError } from '../../../services/whitelistService';
import { normalizeEmail } from '../../../utils/institutionalEmail';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

export type StatusFilter = 'all' | WhitelistStatus;
export type RoleFilter = 'all' | WhitelistRole;

export interface WhitelistFilters {
  /** Texto buscado dentro del correo. */
  query: string;
  status: StatusFilter;
  role: RoleFilter;
}

/** Aviso que se muestra sobre la lista tras una acción. */
export interface WhitelistNotice {
  /** Cambia en cada aviso para reiniciar el temporizador. */
  id: number;
  tone: 'success' | 'error';
  message: string;
}

/** Resultado de una acción que puede fallar con un mensaje para el usuario. */
export type ActionResult = { ok: true } | { ok: false; message: string };

/** Estado y acciones expuestos por el hook. */
export interface UseWhitelistReturn {
  /** Todas las entradas (sin filtrar). */
  entries: WhitelistEntry[];
  /** Entradas que cumplen los filtros actuales. */
  filteredEntries: WhitelistEntry[];
  stats: WhitelistStats;
  /** Si se está cargando la lista por primera vez o al reintentar. */
  isLoading: boolean;
  /** Mensaje de error de la carga (null si no hay error). */
  error: string | null;
  retry: () => Promise<void>;

  filters: WhitelistFilters;
  setQuery: (query: string) => void;
  setStatusFilter: (status: StatusFilter) => void;
  setRoleFilter: (role: RoleFilter) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;

  /** Si la entrada tiene una revocación o restablecimiento en curso. */
  isPending: (id: string) => boolean;
  addEntry: (payload: AddEntryPayload) => Promise<ActionResult>;
  importEntries: (payload: BulkImportPayload) => Promise<ActionResult>;
  revokeAccess: (entry: WhitelistEntry) => Promise<void>;
  restoreAccess: (entry: WhitelistEntry) => Promise<void>;

  notice: WhitelistNotice | null;
  dismissNotice: () => void;
}

// ─────────────────────────────────────────────
// Constantes y funciones auxiliares
// ─────────────────────────────────────────────

const EMPTY_FILTERS: WhitelistFilters = { query: '', status: 'all', role: 'all' };

/** Tiempo que el aviso permanece visible. */
const NOTICE_DURATION_MS = 6000;

const GENERIC_ERROR =
  'No se pudo completar la acción. Verifica tu conexión e intenta nuevamente.';

/** Traduce un error del servicio a un mensaje que explica cómo corregirlo. */
function toMessage(error: unknown): string {
  if (!(error instanceof WhitelistError)) return GENERIC_ERROR;

  switch (error.code) {
    case 'invalid-format':
      return 'El correo no tiene un formato válido. Escríbelo como usuario@ucen.cl.';
    case 'invalid-domain':
      return 'Solo se pueden autorizar correos institucionales @ucen.cl.';
    case 'already-active':
      return 'Este correo ya está autorizado y tiene el acceso activo.';
    case 'not-found':
      return 'No encontramos este correo en la lista. Recarga la página e intenta nuevamente.';
  }
}

/** Arma el texto del aviso tras una carga masiva. */
function describeImport({ added, reactivated, skipped }: BulkImportResult): string {
  const parts = [`${added} ${added === 1 ? 'correo agregado' : 'correos agregados'}`];
  if (reactivated > 0) {
    parts.push(`${reactivated} ${reactivated === 1 ? 'reactivado' : 'reactivados'}`);
  }
  if (skipped > 0) {
    parts.push(`${skipped} ${skipped === 1 ? 'omitido' : 'omitidos'}`);
  }
  return `Carga masiva completada: ${parts.join(', ')}.`;
}

function computeStats(entries: WhitelistEntry[]): WhitelistStats {
  const active = entries.filter((e) => e.status === 'active');
  return {
    total: entries.length,
    active: active.length,
    revoked: entries.length - active.length,
    students: active.filter((e) => e.role === 'student').length,
    teachers: active.filter((e) => e.role === 'teacher').length,
    admins: active.filter((e) => e.role === 'admin').length,
  };
}

/** Reemplaza una entrada por su versión actualizada, o la agrega al inicio. */
function upsert(entries: WhitelistEntry[], updated: WhitelistEntry): WhitelistEntry[] {
  const exists = entries.some((e) => e.id === updated.id);
  return exists
    ? entries.map((e) => (e.id === updated.id ? updated : e))
    : [updated, ...entries];
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useWhitelist(): UseWhitelistReturn {
  const [entries, setEntries] = useState<WhitelistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<WhitelistFilters>(EMPTY_FILTERS);
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set());
  const [notice, setNotice] = useState<WhitelistNotice | null>(null);

  // Identifica la consulta más reciente; las anteriores se ignoran.
  const latestRequestRef = useRef(0);
  const noticeIdRef = useRef(0);

  // ── Carga ──────────────────────────────────

  const load = useCallback(async (silent: boolean) => {
    const requestId = ++latestRequestRef.current;

    try {
      if (!silent) {
        setIsLoading(true);
        setError(null);
      }

      const loaded = await whitelistService.fetchEntries();
      if (requestId !== latestRequestRef.current) return;

      setEntries(loaded);
    } catch {
      if (requestId !== latestRequestRef.current) return;

      // Una actualización silenciosa que falla conserva la lista actual.
      if (!silent) {
        setError(
          'No se pudo cargar la lista de correos autorizados. ' +
          'Verifica tu conexión e intenta nuevamente.',
        );
      }
    } finally {
      if (requestId === latestRequestRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const retry = useCallback(() => load(false), [load]);

  // ── Avisos ─────────────────────────────────

  const showNotice = useCallback((tone: WhitelistNotice['tone'], message: string) => {
    noticeIdRef.current += 1;
    setNotice({ id: noticeIdRef.current, tone, message });
  }, []);

  const dismissNotice = useCallback(() => setNotice(null), []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  // ── Filtros ────────────────────────────────

  const setQuery = useCallback((query: string) => {
    setFilters((current) => ({ ...current, query }));
  }, []);

  const setStatusFilter = useCallback((status: StatusFilter) => {
    setFilters((current) => ({ ...current, status }));
  }, []);

  const setRoleFilter = useCallback((role: RoleFilter) => {
    setFilters((current) => ({ ...current, role }));
  }, []);

  const clearFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const hasActiveFilters =
    filters.query.trim() !== '' || filters.status !== 'all' || filters.role !== 'all';

  const filteredEntries = useMemo(() => {
    const query = normalizeEmail(filters.query);
    return entries.filter(
      (e) =>
        (query === '' || e.email.includes(query)) &&
        (filters.status === 'all' || e.status === filters.status) &&
        (filters.role === 'all' || e.role === filters.role),
    );
  }, [entries, filters]);

  const stats = useMemo(() => computeStats(entries), [entries]);

  // ── Acciones ───────────────────────────────

  const isPending = useCallback((id: string) => pendingIds.has(id), [pendingIds]);

  const setPending = useCallback((id: string, pending: boolean) => {
    setPendingIds((current) => {
      const next = new Set(current);
      if (pending) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const addEntry = useCallback(
    async (payload: AddEntryPayload): Promise<ActionResult> => {
      try {
        const { entry, reactivated } = await whitelistService.addEntry(payload);
        setEntries((current) => upsert(current, entry));
        showNotice(
          'success',
          reactivated
            ? `Se restableció el acceso de ${entry.email}.`
            : `${entry.email} fue autorizado correctamente.`,
        );
        return { ok: true };
      } catch (err) {
        return { ok: false, message: toMessage(err) };
      }
    },
    [showNotice],
  );

  const importEntries = useCallback(
    async (payload: BulkImportPayload): Promise<ActionResult> => {
      try {
        const result = await whitelistService.importEntries(payload);
        showNotice('success', describeImport(result));
        await load(true);
        return { ok: true };
      } catch (err) {
        return { ok: false, message: toMessage(err) };
      }
    },
    [load, showNotice],
  );

  const changeAccess = useCallback(
    async (entry: WhitelistEntry, revoke: boolean) => {
      setPending(entry.id, true);
      try {
        const updated = revoke
          ? await whitelistService.revokeAccess(entry.id)
          : await whitelistService.restoreAccess(entry.id);
        setEntries((current) => upsert(current, updated));
        showNotice(
          'success',
          revoke
            ? `Se revocó el acceso de ${entry.email}. Ya no puede ingresar a ReflexIA.`
            : `Se restableció el acceso de ${entry.email}.`,
        );
      } catch (err) {
        showNotice('error', toMessage(err));
      } finally {
        setPending(entry.id, false);
      }
    },
    [setPending, showNotice],
  );

  const revokeAccess = useCallback(
    (entry: WhitelistEntry) => changeAccess(entry, true),
    [changeAccess],
  );

  const restoreAccess = useCallback(
    (entry: WhitelistEntry) => changeAccess(entry, false),
    [changeAccess],
  );

  return {
    entries,
    filteredEntries,
    stats,
    isLoading,
    error,
    retry,
    filters,
    setQuery,
    setStatusFilter,
    setRoleFilter,
    clearFilters,
    hasActiveFilters,
    isPending,
    addEntry,
    importEntries,
    revokeAccess,
    restoreAccess,
    notice,
    dismissNotice,
  };
}
