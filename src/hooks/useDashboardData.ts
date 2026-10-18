import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Vorhaben, Lernpruefungen, Erfahrungen, Entscheidungen, RegelnUndBerechtigungen, Alternativen, Nutzer, Massnahmen } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { t } from '@/i18n';

/** Dashboard data + the OPTIMISTIC-WRITE API.
 *
 *  The per-entity setters (`set<Entity>`) are exported for exactly one job:
 *  optimistic updates on drag writes (onEventDrop / onEventResize /
 *  onCardMove). Call the setter FIRST — the bar/card lands instantly — then
 *  fire the PATCH in the background and call `fetchAll()` ONLY in the catch.
 *  Never await the PATCH before updating state (the UI freezes for the full
 *  round-trip on every drag) and never refetch after a successful write.
 *  There is no other mechanism (no `__optimistic`, no `mutate`).
 */
/** Entities this hook can load — the same keys the journey layer uses. */
export type DashboardEntity = 'vorhaben' | 'lernpruefungen' | 'erfahrungen' | 'entscheidungen' | 'regeln_und_berechtigungen' | 'alternativen' | 'nutzer' | 'massnahmen';

export interface DashboardDataOptions {
  /** Entities this page does NOT need (picked through useRecordSearch instead).
   *  Every flow page mounts this hook on its own route, so without `omit` a
   *  page that searches 3.000 guests server-side would still pull all 3.000
   *  through the side door. */
  omit?: DashboardEntity[];
}

export function useDashboardData(options: DashboardDataOptions = {}) {
  // A string key, not the array: an inline `omit={['gaeste']}` is a new array
  // on every render and would restart the fetch forever.
  const omitKey = (options.omit ?? []).slice().sort().join('|');
  const [vorhaben, setVorhaben] = useState<Vorhaben[]>([]);
  const [lernpruefungen, setLernpruefungen] = useState<Lernpruefungen[]>([]);
  const [erfahrungen, setErfahrungen] = useState<Erfahrungen[]>([]);
  const [entscheidungen, setEntscheidungen] = useState<Entscheidungen[]>([]);
  const [regelnUndBerechtigungen, setRegelnUndBerechtigungen] = useState<RegelnUndBerechtigungen[]>([]);
  const [alternativen, setAlternativen] = useState<Alternativen[]>([]);
  const [nutzer, setNutzer] = useState<Nutzer[]>([]);
  const [massnahmen, setMassnahmen] = useState<Massnahmen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  /** Lists the signed-in user may not read (403 on the platform). They load as
   *  empty and the rest of the page loads normally — one forbidden list used to
   *  empty the whole dashboard (05.10.2026). Hide a block whose list is here. */
  const [forbidden, setForbidden] = useState<DashboardEntity[]>([]);

  // Every list on its own: a 403 is „not yours“, any other failure is an error.
  const settle = useCallback((settled: PromiseSettledResult<unknown>[]) => {
    const denied: DashboardEntity[] = [];
    let failure: unknown = null;
    // null = this list failed for another reason: its current data stays
    const pick = <T,>(i: number, key: DashboardEntity): T[] | null => {
      const s = settled[i];
      if (s.status === 'fulfilled') return s.value as T[];
      if ((s.reason as { status?: number } | null)?.status === 403) { denied.push(key); return []; }
      failure = failure ?? s.reason;
      return null;
    };
    { const rows = pick<Vorhaben>(0, 'vorhaben'); if (rows) setVorhaben(rows); }
    { const rows = pick<Lernpruefungen>(1, 'lernpruefungen'); if (rows) setLernpruefungen(rows); }
    { const rows = pick<Erfahrungen>(2, 'erfahrungen'); if (rows) setErfahrungen(rows); }
    { const rows = pick<Entscheidungen>(3, 'entscheidungen'); if (rows) setEntscheidungen(rows); }
    { const rows = pick<RegelnUndBerechtigungen>(4, 'regeln_und_berechtigungen'); if (rows) setRegelnUndBerechtigungen(rows); }
    { const rows = pick<Alternativen>(5, 'alternativen'); if (rows) setAlternativen(rows); }
    { const rows = pick<Nutzer>(6, 'nutzer'); if (rows) setNutzer(rows); }
    { const rows = pick<Massnahmen>(7, 'massnahmen'); if (rows) setMassnahmen(rows); }
    setForbidden(prev => (prev.join('|') === denied.join('|') ? prev : denied));
    return failure;
  }, []);

  const fetchAll = useCallback(async () => {
    setError(null);
    const omit = new Set(omitKey ? omitKey.split('|') : []);
    try {
      const failure = settle(await Promise.allSettled([
        omit.has('vorhaben') ? Promise.resolve([] as Vorhaben[]) : LivingAppsService.getVorhaben(),
        omit.has('lernpruefungen') ? Promise.resolve([] as Lernpruefungen[]) : LivingAppsService.getLernpruefungen(),
        omit.has('erfahrungen') ? Promise.resolve([] as Erfahrungen[]) : LivingAppsService.getErfahrungen(),
        omit.has('entscheidungen') ? Promise.resolve([] as Entscheidungen[]) : LivingAppsService.getEntscheidungen(),
        omit.has('regeln_und_berechtigungen') ? Promise.resolve([] as RegelnUndBerechtigungen[]) : LivingAppsService.getRegelnUndBerechtigungen(),
        omit.has('alternativen') ? Promise.resolve([] as Alternativen[]) : LivingAppsService.getAlternativen(),
        omit.has('nutzer') ? Promise.resolve([] as Nutzer[]) : LivingAppsService.getNutzer(),
        omit.has('massnahmen') ? Promise.resolve([] as Massnahmen[]) : LivingAppsService.getMassnahmen(),
      ]));
      if (failure) throw failure;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(t('data_load_failed')));
    } finally {
      setLoading(false);
    }
  }, [omitKey, settle]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    const omit = new Set(omitKey ? omitKey.split('|') : []);
    async function silentRefresh() {
      try {
        // a failed list keeps its stale data out of the way: settle() only
        // replaces what loaded or was refused
        settle(await Promise.allSettled([
          omit.has('vorhaben') ? Promise.resolve([] as Vorhaben[]) : LivingAppsService.getVorhaben(),
          omit.has('lernpruefungen') ? Promise.resolve([] as Lernpruefungen[]) : LivingAppsService.getLernpruefungen(),
          omit.has('erfahrungen') ? Promise.resolve([] as Erfahrungen[]) : LivingAppsService.getErfahrungen(),
          omit.has('entscheidungen') ? Promise.resolve([] as Entscheidungen[]) : LivingAppsService.getEntscheidungen(),
          omit.has('regeln_und_berechtigungen') ? Promise.resolve([] as RegelnUndBerechtigungen[]) : LivingAppsService.getRegelnUndBerechtigungen(),
          omit.has('alternativen') ? Promise.resolve([] as Alternativen[]) : LivingAppsService.getAlternativen(),
          omit.has('nutzer') ? Promise.resolve([] as Nutzer[]) : LivingAppsService.getNutzer(),
          omit.has('massnahmen') ? Promise.resolve([] as Massnahmen[]) : LivingAppsService.getMassnahmen(),
        ]));
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    // assistant:data-changed comes from the assistant (<la-klar-assistant>)
    // after every mutation. The element additionally fires the legacy
    // dashboard-refresh event for OLD deployed bundles — do NOT subscribe to
    // both here, or every mutation fetches twice.
    window.addEventListener('assistant:data-changed', handleRefresh);
    return () => window.removeEventListener('assistant:data-changed', handleRefresh);
  }, [omitKey, settle]);

  const vorhabenMap = useMemo(() => {
    const m = new Map<string, Vorhaben>();
    vorhaben.forEach(r => m.set(r.record_id, r));
    return m;
  }, [vorhaben]);

  const erfahrungenMap = useMemo(() => {
    const m = new Map<string, Erfahrungen>();
    erfahrungen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [erfahrungen]);

  const entscheidungenMap = useMemo(() => {
    const m = new Map<string, Entscheidungen>();
    entscheidungen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [entscheidungen]);

  const regelnUndBerechtigungenMap = useMemo(() => {
    const m = new Map<string, RegelnUndBerechtigungen>();
    regelnUndBerechtigungen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [regelnUndBerechtigungen]);

  const alternativenMap = useMemo(() => {
    const m = new Map<string, Alternativen>();
    alternativen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [alternativen]);

  const nutzerMap = useMemo(() => {
    const m = new Map<string, Nutzer>();
    nutzer.forEach(r => m.set(r.record_id, r));
    return m;
  }, [nutzer]);

  const massnahmenMap = useMemo(() => {
    const m = new Map<string, Massnahmen>();
    massnahmen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [massnahmen]);

  return { vorhaben, setVorhaben, lernpruefungen, setLernpruefungen, erfahrungen, setErfahrungen, entscheidungen, setEntscheidungen, regelnUndBerechtigungen, setRegelnUndBerechtigungen, alternativen, setAlternativen, nutzer, setNutzer, massnahmen, setMassnahmen, loading, error, fetchAll, forbidden, vorhabenMap, erfahrungenMap, entscheidungenMap, regelnUndBerechtigungenMap, alternativenMap, nutzerMap, massnahmenMap };
}

/** The hook's return — the `data` prop of DashboardOverview in the Ready-Wrapper form. */
export type DashboardData = ReturnType<typeof useDashboardData>;