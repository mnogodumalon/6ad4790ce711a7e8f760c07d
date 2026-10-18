/**
 * EntityCrud — pre-generated CRUD + overlay plumbing for the dashboard.
 * Compose it; NEVER re-roll dialog state, submit handlers, an overlay stack
 * or a RecordOverlayHost in the page — this file owns all of it.
 *
 * API at a glance:
 *   const data = useDashboardData();
 *   const crud = useEntityCrud(data, {
 *     // optional — the ONE semantic slot on the overlay: the record's next
 *     // workflow step. Return undefined for types without one.
 *     footer: (top) => top.type === 'vorhaben'
 *       ? { label: …, onClick: () => … }
 *       : undefined,
 *   });
 *
 *   `top.type` is the SAME camelCase key as `crud.<entity>` — one spelling
 *   per entity, everywhere in this API.
 *   …
 *   crud.vorhaben.openCreate({ …defaults })   // create dialog, prefilled — defaults are
 *                                       // shape-tolerant: bare lookup keys / record ids are fine
 *   crud.vorhaben.openEdit(record)            // edit dialog (recordId + defaults wired)
 *   crud.vorhaben.openDetail(record)          // record overlay — pass the RAW record,
 *                                       // enrichment is resolved inside
 *   crud.overlay                         // RecordOverlayStack<OverlayItem> for drills:
 *                                       // push / pop / replace / close
 *   crud.enriched.vorhaben              // the display-ready array for EVERY entity —
 *                                       // Enriched* where relations exist, the raw array
 *                                       // otherwise. Reuse these; never call enrich*()
 *                                       // in the page, and never guess which entity has
 *                                       // one: they all do.
 *   {crud.surfaces}                      // render ONCE at the end of the page JSX:
 *                                       // all entity dialogs + the overlay host
 *
 * Built in (do NOT re-implement): optimistic update + Rückgängig counter-write
 * on edit, fetchAll-on-error, edit-from-overlay, and per-entity overlay bodies
 * (RecordHeader + <{Entity}Details> with every relation reachable and the
 * contextual "+" prefilled; list-field back-references additionally get a
 * "choose existing" picker that links an EXISTING record — built in, do not
 * re-roll). Drag writes (onEventDrop/onCardMove) stay YOURS:
 * optimistic setter first, PATCH in background, undoToast with counter-write.
 *
 * Overlay content per entity (the host renders these — you never compose
 * Details blocks yourself):
 *   vorhaben: titel, ziel, fachlicher_kontext, hintergrund_historie, arbeitszustand, naechster_schritt, verantwortlicher, beteiligte, …  ·  → nutzer · → regeln_und_berechtigungen · ← erfahrungen (list + contextual +) · ← entscheidungen (list + contextual +) · ← massnahmen (list + contextual +)
 *   lernpruefungen: pruefer, pruefdatum, ergebnis, begruendung, gueltigkeitsbereich_neu, wiederverwendbar_fuer, naechste_ueberpruefung, erfahrung, …  ·  → nutzer · → erfahrungen · → massnahmen
 *   erfahrungen: titel, kategorie, beschreibung, situation, erkenntnis, gueltigkeitsbereich, grenzen, vorhaben, …  ·  → vorhaben · → nutzer · → entscheidungen · ← lernpruefungen (list + contextual +)
 *   entscheidungen: gewaehlte_option, vorhaben, entscheidungsfrage, situationstyp, gesicherte_fakten, offene_annahmen, fehlende_informationen, geltende_regeln, …  ·  → alternativen · → vorhaben · → regeln_und_berechtigungen · → nutzer · ← erfahrungen (list + contextual +) · ← alternativen (list + contextual +) · ← massnahmen (list + contextual +)
 *   regeln_und_berechtigungen: bezeichnung, beschreibung, regeltyp, geltungsbereich, betroffene_rolle, freigabepflicht, gueltig_ab, status, …  ·  → nutzer · ← vorhaben (list + contextual + + choose existing) · ← entscheidungen (list + contextual + + choose existing)
 *   alternativen: bezeichnung, beschreibung, konsequenzen, risiken, aufwand, empfehlungsgrad, herkunft, vorgeschlagen_von, …  ·  → nutzer · → entscheidungen · ← entscheidungen (list + contextual +)
 *   nutzer: nutzer_firstname, nutzer_lastname, email, art, rolle, fachgebiet, verantwortungsbereich, aktiv  ·  ← vorhaben (list + contextual +) · ← vorhaben (list + contextual + + choose existing) · ← lernpruefungen (list + contextual +) · ← erfahrungen (list + contextual +) · ← erfahrungen (list + contextual +) · ← entscheidungen (list + contextual +) · ← regeln_und_berechtigungen (list + contextual +) · ← alternativen (list + contextual +) · ← massnahmen (list + contextual +) · ← massnahmen (list + contextual +)
 *   massnahmen: entscheidung, vorhaben, beschreibung, herkunft, vorgeschlagen_von, status, freigegeben_von, freigabedatum, …  ·  → entscheidungen · → vorhaben · → nutzer · ← lernpruefungen (list + contextual + + choose existing)
 */
import { useState, useMemo, type ReactNode } from 'react';
import type { Vorhaben, Lernpruefungen, Erfahrungen, Entscheidungen, RegelnUndBerechtigungen, Alternativen, Nutzer, Massnahmen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl, extractRecordIds } from '@/services/livingAppsService';
import { enrichVorhaben, enrichLernpruefungen, enrichErfahrungen, enrichEntscheidungen, enrichRegelnUndBerechtigungen, enrichAlternativen, enrichMassnahmen } from '@/lib/enrich';
import type { EnrichedVorhaben, EnrichedLernpruefungen, EnrichedErfahrungen, EnrichedEntscheidungen, EnrichedRegelnUndBerechtigungen, EnrichedAlternativen, EnrichedMassnahmen } from '@/types/enriched';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  useRecordOverlayStack, RecordOverlayHost, RecordHeader,
  type RecordOverlayStack,
} from '@/components/widgets/RecordView';
import { VorhabenDialog, type VorhabenDialogDefaults } from '@/components/dialogs/VorhabenDialog';
import { VorhabenDetails } from '@/components/details/VorhabenDetails';
import { LernpruefungenDialog, type LernpruefungenDialogDefaults } from '@/components/dialogs/LernpruefungenDialog';
import { LernpruefungenDetails } from '@/components/details/LernpruefungenDetails';
import { ErfahrungenDialog, type ErfahrungenDialogDefaults } from '@/components/dialogs/ErfahrungenDialog';
import { ErfahrungenDetails } from '@/components/details/ErfahrungenDetails';
import { EntscheidungenDialog, type EntscheidungenDialogDefaults } from '@/components/dialogs/EntscheidungenDialog';
import { EntscheidungenDetails } from '@/components/details/EntscheidungenDetails';
import { RegelnUndBerechtigungenDialog, type RegelnUndBerechtigungenDialogDefaults } from '@/components/dialogs/RegelnUndBerechtigungenDialog';
import { RegelnUndBerechtigungenDetails } from '@/components/details/RegelnUndBerechtigungenDetails';
import { AlternativenDialog, type AlternativenDialogDefaults } from '@/components/dialogs/AlternativenDialog';
import { AlternativenDetails } from '@/components/details/AlternativenDetails';
import { NutzerDialog, type NutzerDialogDefaults } from '@/components/dialogs/NutzerDialog';
import { NutzerDetails } from '@/components/details/NutzerDetails';
import { MassnahmenDialog, type MassnahmenDialogDefaults } from '@/components/dialogs/MassnahmenDialog';
import { MassnahmenDetails } from '@/components/details/MassnahmenDetails';
import { PickExistingDialog } from '@/components/PickExistingDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { t, appLabel } from '@/i18n';
import { undoToast } from '@/lib/polish';
import { usePermissions } from '@/lib/permissions';
import { toast } from 'sonner';
import { formatDate } from '@/lib/formatters';

// The overlay union — one branch per entity, `record` typed the way the data
// flows: Enriched* where enrichment exists, the raw record type otherwise.
// The host resolves enrichment itself; pages pass raw records everywhere.
export type OverlayItem =
  | { type: 'vorhaben'; record: EnrichedVorhaben }
  | { type: 'lernpruefungen'; record: EnrichedLernpruefungen }
  | { type: 'erfahrungen'; record: EnrichedErfahrungen }
  | { type: 'entscheidungen'; record: EnrichedEntscheidungen }
  | { type: 'regelnUndBerechtigungen'; record: EnrichedRegelnUndBerechtigungen }
  | { type: 'alternativen'; record: EnrichedAlternativen }
  | { type: 'nutzer'; record: Nutzer }
  | { type: 'massnahmen'; record: EnrichedMassnahmen };

/** The useDashboardData() return — pass it in, never re-fetch inside. */
export type EntityCrudData = ReturnType<typeof useDashboardData>;

export interface EntityCrudOptions {
  /** Per-type overlay footer — the record's next workflow step. */
  footer?: (top: OverlayItem) => ReactNode | { label: ReactNode; onClick: () => void } | undefined;
  placement?: 'side' | 'center';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface EntityCrudApi<TRecord, TDefaults> {
  /** Open the create dialog, optionally prefilled (shape-tolerant defaults). */
  openCreate: (defaults?: TDefaults) => void;
  /** Open the edit dialog for a record (recordId + defaults are wired). */
  openEdit: (record: TRecord) => void;
  /** Open the record overlay (raw record is fine — enrichment resolved inside). */
  openDetail: (record: TRecord) => void;
  /** May the signed-in user create/change records of this list? (the
   *  platform's rights — show a „+ Neu“ only when true; openCreate/openEdit
   *  refuse with a notice otherwise). */
  canWrite: boolean;
}

export interface EntityCrud {
  /** The overlay stack for drills: push / pop / replace / close. */
  overlay: RecordOverlayStack<OverlayItem>;
  /** Render ONCE at the end of the page JSX — all dialogs + the overlay host. */
  surfaces: ReactNode;
  vorhaben: EntityCrudApi<Vorhaben, VorhabenDialogDefaults>;
  lernpruefungen: EntityCrudApi<Lernpruefungen, LernpruefungenDialogDefaults>;
  erfahrungen: EntityCrudApi<Erfahrungen, ErfahrungenDialogDefaults>;
  entscheidungen: EntityCrudApi<Entscheidungen, EntscheidungenDialogDefaults>;
  regelnUndBerechtigungen: EntityCrudApi<RegelnUndBerechtigungen, RegelnUndBerechtigungenDialogDefaults>;
  alternativen: EntityCrudApi<Alternativen, AlternativenDialogDefaults>;
  nutzer: EntityCrudApi<Nutzer, NutzerDialogDefaults>;
  massnahmen: EntityCrudApi<Massnahmen, MassnahmenDialogDefaults>;
  /** The display-ready array per entity: Enriched* where an enrich function
   *  exists, the raw array otherwise. One key per entity so no page has to
   *  know which is which. Reuse these; never re-enrich in the page. */
  enriched: { vorhaben: EnrichedVorhaben[]; lernpruefungen: EnrichedLernpruefungen[]; erfahrungen: EnrichedErfahrungen[]; entscheidungen: EnrichedEntscheidungen[]; regelnUndBerechtigungen: EnrichedRegelnUndBerechtigungen[]; alternativen: EnrichedAlternativen[]; nutzer: Nutzer[]; massnahmen: EnrichedMassnahmen[] };
}

export function useEntityCrud(data: EntityCrudData, options?: EntityCrudOptions): EntityCrud {
  const overlay = useRecordOverlayStack<OverlayItem>();
  // the platform's rights of the signed-in user (lib/permissions.ts) — unknown = allowed
  const perms = usePermissions();
  const refuse = () => { toast.error(t('perm_denied_title'), { description: t('perm_denied_desc') }); };
  const [vorhabenDialog, setVorhabenDialog] = useState<{ defaults?: VorhabenDialogDefaults; editing?: Vorhaben } | null>(null);
  const [lernpruefungenDialog, setLernpruefungenDialog] = useState<{ defaults?: LernpruefungenDialogDefaults; editing?: Lernpruefungen } | null>(null);
  const [erfahrungenDialog, setErfahrungenDialog] = useState<{ defaults?: ErfahrungenDialogDefaults; editing?: Erfahrungen } | null>(null);
  const [entscheidungenDialog, setEntscheidungenDialog] = useState<{ defaults?: EntscheidungenDialogDefaults; editing?: Entscheidungen } | null>(null);
  const [regelnUndBerechtigungenDialog, setRegelnUndBerechtigungenDialog] = useState<{ defaults?: RegelnUndBerechtigungenDialogDefaults; editing?: RegelnUndBerechtigungen } | null>(null);
  const [alternativenDialog, setAlternativenDialog] = useState<{ defaults?: AlternativenDialogDefaults; editing?: Alternativen } | null>(null);
  const [nutzerDialog, setNutzerDialog] = useState<{ defaults?: NutzerDialogDefaults; editing?: Nutzer } | null>(null);
  const [massnahmenDialog, setMassnahmenDialog] = useState<{ defaults?: MassnahmenDialogDefaults; editing?: Massnahmen } | null>(null);
  // „Vorhandene wählen" für den Listenfeld-Rückbezug vorhaben.geltende_regeln → regeln_und_berechtigungen: hält die Hub-record_id.
  const [pickRegelnUndBerechtigungenVorhaben, setPickRegelnUndBerechtigungenVorhaben] = useState<string | null>(null);
  // „Vorhandene wählen" für den Listenfeld-Rückbezug entscheidungen.geltende_regeln → regeln_und_berechtigungen: hält die Hub-record_id.
  const [pickRegelnUndBerechtigungenEntscheidungen, setPickRegelnUndBerechtigungenEntscheidungen] = useState<string | null>(null);
  // „Vorhandene wählen" für den Listenfeld-Rückbezug vorhaben.beteiligte → nutzer: hält die Hub-record_id.
  const [pickNutzerVorhabenBeteiligte, setPickNutzerVorhabenBeteiligte] = useState<string | null>(null);
  // „Vorhandene wählen" für den Listenfeld-Rückbezug lernpruefungen.belege_massnahmen → massnahmen: hält die Hub-record_id.
  const [pickMassnahmenLernpruefungen, setPickMassnahmenLernpruefungen] = useState<string | null>(null);
  const enrichedVorhaben = useMemo(() => enrichVorhaben(data.vorhaben, { nutzerMap: data.nutzerMap, regelnUndBerechtigungenMap: data.regelnUndBerechtigungenMap }), [data.vorhaben, data.nutzerMap, data.regelnUndBerechtigungenMap]);
  const enrichedLernpruefungen = useMemo(() => enrichLernpruefungen(data.lernpruefungen, { nutzerMap: data.nutzerMap, erfahrungenMap: data.erfahrungenMap, massnahmenMap: data.massnahmenMap }), [data.lernpruefungen, data.nutzerMap, data.erfahrungenMap, data.massnahmenMap]);
  const enrichedErfahrungen = useMemo(() => enrichErfahrungen(data.erfahrungen, { vorhabenMap: data.vorhabenMap, nutzerMap: data.nutzerMap, entscheidungenMap: data.entscheidungenMap }), [data.erfahrungen, data.vorhabenMap, data.nutzerMap, data.entscheidungenMap]);
  const enrichedEntscheidungen = useMemo(() => enrichEntscheidungen(data.entscheidungen, { alternativenMap: data.alternativenMap, vorhabenMap: data.vorhabenMap, regelnUndBerechtigungenMap: data.regelnUndBerechtigungenMap, nutzerMap: data.nutzerMap }), [data.entscheidungen, data.alternativenMap, data.vorhabenMap, data.regelnUndBerechtigungenMap, data.nutzerMap]);
  const enrichedRegelnUndBerechtigungen = useMemo(() => enrichRegelnUndBerechtigungen(data.regelnUndBerechtigungen, { nutzerMap: data.nutzerMap }), [data.regelnUndBerechtigungen, data.nutzerMap]);
  const enrichedAlternativen = useMemo(() => enrichAlternativen(data.alternativen, { nutzerMap: data.nutzerMap, entscheidungenMap: data.entscheidungenMap }), [data.alternativen, data.nutzerMap, data.entscheidungenMap]);
  const enrichedMassnahmen = useMemo(() => enrichMassnahmen(data.massnahmen, { entscheidungenMap: data.entscheidungenMap, vorhabenMap: data.vorhabenMap, nutzerMap: data.nutzerMap }), [data.massnahmen, data.entscheidungenMap, data.vorhabenMap, data.nutzerMap]);

  function detailVorhaben(record: Vorhaben, push = false) {
    const rec = enrichedVorhaben.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'vorhaben', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitVorhaben(fields: Vorhaben['fields']) {
    const editing = vorhabenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setVorhaben(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateVorhabenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('vorhaben')} — ${t('crud_updated')}`, async () => {
        data.setVorhaben(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateVorhabenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createVorhabenEntry(fields);
      undoToast(`${appLabel('vorhaben')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailLernpruefungen(record: Lernpruefungen, push = false) {
    const rec = enrichedLernpruefungen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'lernpruefungen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitLernpruefungen(fields: Lernpruefungen['fields']) {
    const editing = lernpruefungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setLernpruefungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateLernpruefungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('lernpruefungen')} — ${t('crud_updated')}`, async () => {
        data.setLernpruefungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateLernpruefungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createLernpruefungenEntry(fields);
      undoToast(`${appLabel('lernpruefungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailErfahrungen(record: Erfahrungen, push = false) {
    const rec = enrichedErfahrungen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'erfahrungen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitErfahrungen(fields: Erfahrungen['fields']) {
    const editing = erfahrungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setErfahrungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateErfahrungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('erfahrungen')} — ${t('crud_updated')}`, async () => {
        data.setErfahrungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateErfahrungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createErfahrungenEntry(fields);
      undoToast(`${appLabel('erfahrungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailEntscheidungen(record: Entscheidungen, push = false) {
    const rec = enrichedEntscheidungen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'entscheidungen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitEntscheidungen(fields: Entscheidungen['fields']) {
    const editing = entscheidungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setEntscheidungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateEntscheidungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('entscheidungen')} — ${t('crud_updated')}`, async () => {
        data.setEntscheidungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateEntscheidungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createEntscheidungenEntry(fields);
      undoToast(`${appLabel('entscheidungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailRegelnUndBerechtigungen(record: RegelnUndBerechtigungen, push = false) {
    const rec = enrichedRegelnUndBerechtigungen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'regelnUndBerechtigungen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitRegelnUndBerechtigungen(fields: RegelnUndBerechtigungen['fields']) {
    const editing = regelnUndBerechtigungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setRegelnUndBerechtigungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateRegelnUndBerechtigungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('regeln_und_berechtigungen')} — ${t('crud_updated')}`, async () => {
        data.setRegelnUndBerechtigungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateRegelnUndBerechtigungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createRegelnUndBerechtigungenEntry(fields);
      undoToast(`${appLabel('regeln_und_berechtigungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  // Link an EXISTING Vorhaben to the RegelnUndBerechtigungen hub: append the hub URL to the
  // source's list field. Optimistic setter first, PATCH, undoToast counter-write.
  async function linkRegelnUndBerechtigungenVorhaben(sourceId: string) {
    const hub = pickRegelnUndBerechtigungenVorhaben;
    const src = data.vorhaben.find(r => r.record_id === sourceId);
    if (!hub || !src) return;
    const ids = extractRecordIds(src.fields.geltende_regeln);
    if (ids.includes(hub)) return;
    const next = [...ids, hub].map(id => createRecordUrl(APP_IDS.REGELN_UND_BERECHTIGUNGEN, id));
    data.setVorhaben(list => list.map(r => (r.record_id === sourceId ? { ...r, fields: { ...r.fields, geltende_regeln: next } } : r)));
    try {
      await LivingAppsService.updateVorhabenEntry(sourceId, { geltende_regeln: next });
    } catch (err) {
      data.fetchAll();
      throw err;
    }
    undoToast(`${appLabel('vorhaben')} — ${t('pick_linked')}`, async () => {
      data.setVorhaben(list => list.map(r => (r.record_id === sourceId ? src : r)));
      try { await LivingAppsService.updateVorhabenEntry(sourceId, { geltende_regeln: src.fields.geltende_regeln }); } catch { data.fetchAll(); }
    });
  }

  // Link an EXISTING Entscheidungen to the RegelnUndBerechtigungen hub: append the hub URL to the
  // source's list field. Optimistic setter first, PATCH, undoToast counter-write.
  async function linkRegelnUndBerechtigungenEntscheidungen(sourceId: string) {
    const hub = pickRegelnUndBerechtigungenEntscheidungen;
    const src = data.entscheidungen.find(r => r.record_id === sourceId);
    if (!hub || !src) return;
    const ids = extractRecordIds(src.fields.geltende_regeln);
    if (ids.includes(hub)) return;
    const next = [...ids, hub].map(id => createRecordUrl(APP_IDS.REGELN_UND_BERECHTIGUNGEN, id));
    data.setEntscheidungen(list => list.map(r => (r.record_id === sourceId ? { ...r, fields: { ...r.fields, geltende_regeln: next } } : r)));
    try {
      await LivingAppsService.updateEntscheidungenEntry(sourceId, { geltende_regeln: next });
    } catch (err) {
      data.fetchAll();
      throw err;
    }
    undoToast(`${appLabel('entscheidungen')} — ${t('pick_linked')}`, async () => {
      data.setEntscheidungen(list => list.map(r => (r.record_id === sourceId ? src : r)));
      try { await LivingAppsService.updateEntscheidungenEntry(sourceId, { geltende_regeln: src.fields.geltende_regeln }); } catch { data.fetchAll(); }
    });
  }

  function detailAlternativen(record: Alternativen, push = false) {
    const rec = enrichedAlternativen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'alternativen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitAlternativen(fields: Alternativen['fields']) {
    const editing = alternativenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setAlternativen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateAlternativenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('alternativen')} — ${t('crud_updated')}`, async () => {
        data.setAlternativen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateAlternativenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createAlternativenEntry(fields);
      undoToast(`${appLabel('alternativen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailNutzer(record: Nutzer, push = false) {
    const item: OverlayItem = { type: 'nutzer', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitNutzer(fields: Nutzer['fields']) {
    const editing = nutzerDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setNutzer(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateNutzerEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('nutzer')} — ${t('crud_updated')}`, async () => {
        data.setNutzer(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateNutzerEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createNutzerEntry(fields);
      undoToast(`${appLabel('nutzer')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  // Link an EXISTING Vorhaben to the Nutzer hub: append the hub URL to the
  // source's list field. Optimistic setter first, PATCH, undoToast counter-write.
  async function linkNutzerVorhabenBeteiligte(sourceId: string) {
    const hub = pickNutzerVorhabenBeteiligte;
    const src = data.vorhaben.find(r => r.record_id === sourceId);
    if (!hub || !src) return;
    const ids = extractRecordIds(src.fields.beteiligte);
    if (ids.includes(hub)) return;
    const next = [...ids, hub].map(id => createRecordUrl(APP_IDS.NUTZER, id));
    data.setVorhaben(list => list.map(r => (r.record_id === sourceId ? { ...r, fields: { ...r.fields, beteiligte: next } } : r)));
    try {
      await LivingAppsService.updateVorhabenEntry(sourceId, { beteiligte: next });
    } catch (err) {
      data.fetchAll();
      throw err;
    }
    undoToast(`${appLabel('vorhaben')} — ${t('pick_linked')}`, async () => {
      data.setVorhaben(list => list.map(r => (r.record_id === sourceId ? src : r)));
      try { await LivingAppsService.updateVorhabenEntry(sourceId, { beteiligte: src.fields.beteiligte }); } catch { data.fetchAll(); }
    });
  }

  function detailMassnahmen(record: Massnahmen, push = false) {
    const rec = enrichedMassnahmen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'massnahmen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitMassnahmen(fields: Massnahmen['fields']) {
    const editing = massnahmenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setMassnahmen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateMassnahmenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('massnahmen')} — ${t('crud_updated')}`, async () => {
        data.setMassnahmen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateMassnahmenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createMassnahmenEntry(fields);
      undoToast(`${appLabel('massnahmen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  // Link an EXISTING Lernpruefungen to the Massnahmen hub: append the hub URL to the
  // source's list field. Optimistic setter first, PATCH, undoToast counter-write.
  async function linkMassnahmenLernpruefungen(sourceId: string) {
    const hub = pickMassnahmenLernpruefungen;
    const src = data.lernpruefungen.find(r => r.record_id === sourceId);
    if (!hub || !src) return;
    const ids = extractRecordIds(src.fields.belege_massnahmen);
    if (ids.includes(hub)) return;
    const next = [...ids, hub].map(id => createRecordUrl(APP_IDS.MASSNAHMEN, id));
    data.setLernpruefungen(list => list.map(r => (r.record_id === sourceId ? { ...r, fields: { ...r.fields, belege_massnahmen: next } } : r)));
    try {
      await LivingAppsService.updateLernpruefungenEntry(sourceId, { belege_massnahmen: next });
    } catch (err) {
      data.fetchAll();
      throw err;
    }
    undoToast(`${appLabel('lernpruefungen')} — ${t('pick_linked')}`, async () => {
      data.setLernpruefungen(list => list.map(r => (r.record_id === sourceId ? src : r)));
      try { await LivingAppsService.updateLernpruefungenEntry(sourceId, { belege_massnahmen: src.fields.belege_massnahmen }); } catch { data.fetchAll(); }
    });
  }

  const surfaces = (
    <>
      <VorhabenDialog
        open={vorhabenDialog !== null}
        onClose={() => setVorhabenDialog(null)}
        onSubmit={submitVorhaben}
        defaultValues={vorhabenDialog?.defaults}
        recordId={vorhabenDialog?.editing?.record_id}
        nutzerList={data.nutzer}
        regelnUndBerechtigungenList={data.regelnUndBerechtigungen}
        enablePhotoScan={AI_PHOTO_SCAN['Vorhaben']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Vorhaben']}
      />
      <LernpruefungenDialog
        open={lernpruefungenDialog !== null}
        onClose={() => setLernpruefungenDialog(null)}
        onSubmit={submitLernpruefungen}
        defaultValues={lernpruefungenDialog?.defaults}
        recordId={lernpruefungenDialog?.editing?.record_id}
        nutzerList={data.nutzer}
        erfahrungenList={data.erfahrungen}
        massnahmenList={data.massnahmen}
        enablePhotoScan={AI_PHOTO_SCAN['Lernpruefungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Lernpruefungen']}
      />
      <ErfahrungenDialog
        open={erfahrungenDialog !== null}
        onClose={() => setErfahrungenDialog(null)}
        onSubmit={submitErfahrungen}
        defaultValues={erfahrungenDialog?.defaults}
        recordId={erfahrungenDialog?.editing?.record_id}
        vorhabenList={data.vorhaben}
        nutzerList={data.nutzer}
        entscheidungenList={data.entscheidungen}
        enablePhotoScan={AI_PHOTO_SCAN['Erfahrungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Erfahrungen']}
      />
      <EntscheidungenDialog
        open={entscheidungenDialog !== null}
        onClose={() => setEntscheidungenDialog(null)}
        onSubmit={submitEntscheidungen}
        defaultValues={entscheidungenDialog?.defaults}
        recordId={entscheidungenDialog?.editing?.record_id}
        alternativenList={data.alternativen}
        vorhabenList={data.vorhaben}
        regelnUndBerechtigungenList={data.regelnUndBerechtigungen}
        nutzerList={data.nutzer}
        enablePhotoScan={AI_PHOTO_SCAN['Entscheidungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Entscheidungen']}
      />
      <RegelnUndBerechtigungenDialog
        open={regelnUndBerechtigungenDialog !== null}
        onClose={() => setRegelnUndBerechtigungenDialog(null)}
        onSubmit={submitRegelnUndBerechtigungen}
        defaultValues={regelnUndBerechtigungenDialog?.defaults}
        recordId={regelnUndBerechtigungenDialog?.editing?.record_id}
        nutzerList={data.nutzer}
        enablePhotoScan={AI_PHOTO_SCAN['RegelnUndBerechtigungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['RegelnUndBerechtigungen']}
      />
      <AlternativenDialog
        open={alternativenDialog !== null}
        onClose={() => setAlternativenDialog(null)}
        onSubmit={submitAlternativen}
        defaultValues={alternativenDialog?.defaults}
        recordId={alternativenDialog?.editing?.record_id}
        nutzerList={data.nutzer}
        entscheidungenList={data.entscheidungen}
        enablePhotoScan={AI_PHOTO_SCAN['Alternativen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Alternativen']}
      />
      <NutzerDialog
        open={nutzerDialog !== null}
        onClose={() => setNutzerDialog(null)}
        onSubmit={submitNutzer}
        defaultValues={nutzerDialog?.defaults}
        recordId={nutzerDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Nutzer']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Nutzer']}
      />
      <MassnahmenDialog
        open={massnahmenDialog !== null}
        onClose={() => setMassnahmenDialog(null)}
        onSubmit={submitMassnahmen}
        defaultValues={massnahmenDialog?.defaults}
        recordId={massnahmenDialog?.editing?.record_id}
        entscheidungenList={data.entscheidungen}
        vorhabenList={data.vorhaben}
        nutzerList={data.nutzer}
        enablePhotoScan={AI_PHOTO_SCAN['Massnahmen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Massnahmen']}
      />
      <PickExistingDialog
        open={pickRegelnUndBerechtigungenVorhaben !== null}
        onClose={() => setPickRegelnUndBerechtigungenVorhaben(null)}
        title={t('pick_title', { title: appLabel('vorhaben') })}
        items={data.vorhaben
          .filter(r => !extractRecordIds(r.fields.geltende_regeln).includes(pickRegelnUndBerechtigungenVorhaben ?? ''))
          .map(r => ({ id: r.record_id, label: String(r.fields.titel ?? appLabel('vorhaben')), hint: r.fields.start ? String(r.fields.start) : undefined }))}
        onPick={linkRegelnUndBerechtigungenVorhaben}
      />
      <PickExistingDialog
        open={pickRegelnUndBerechtigungenEntscheidungen !== null}
        onClose={() => setPickRegelnUndBerechtigungenEntscheidungen(null)}
        title={t('pick_title', { title: appLabel('entscheidungen') })}
        items={data.entscheidungen
          .filter(r => !extractRecordIds(r.fields.geltende_regeln).includes(pickRegelnUndBerechtigungenEntscheidungen ?? ''))
          .map(r => ({ id: r.record_id, label: String(appLabel('entscheidungen')), hint: r.fields.frist ? String(r.fields.frist) : undefined }))}
        onPick={linkRegelnUndBerechtigungenEntscheidungen}
      />
      <PickExistingDialog
        open={pickNutzerVorhabenBeteiligte !== null}
        onClose={() => setPickNutzerVorhabenBeteiligte(null)}
        title={t('pick_title', { title: appLabel('vorhaben') })}
        items={data.vorhaben
          .filter(r => !extractRecordIds(r.fields.beteiligte).includes(pickNutzerVorhabenBeteiligte ?? ''))
          .map(r => ({ id: r.record_id, label: String(r.fields.titel ?? appLabel('vorhaben')), hint: r.fields.start ? String(r.fields.start) : undefined }))}
        onPick={linkNutzerVorhabenBeteiligte}
      />
      <PickExistingDialog
        open={pickMassnahmenLernpruefungen !== null}
        onClose={() => setPickMassnahmenLernpruefungen(null)}
        title={t('pick_title', { title: appLabel('lernpruefungen') })}
        items={data.lernpruefungen
          .filter(r => !extractRecordIds(r.fields.belege_massnahmen).includes(pickMassnahmenLernpruefungen ?? ''))
          .map(r => ({ id: r.record_id, label: String(r.fields.wiederverwendbar_fuer ?? appLabel('lernpruefungen')), hint: r.fields.pruefdatum ? String(r.fields.pruefdatum) : undefined }))}
        onPick={linkMassnahmenLernpruefungen}
      />
      <RecordOverlayHost
        overlay={overlay}
        placement={options?.placement}
        size={options?.size}
        footer={options?.footer}
        render={(top) => {
          if (top.type === 'vorhaben') {
            return (
              <>
                <RecordHeader title={top.record.fields.titel ?? appLabel('vorhaben')} subtitle={top.record.fields.start ? formatDate(top.record.fields.start) : undefined} />
                <VorhabenDetails
                  record={top.record}
                  nutzerList={data.nutzer}
                  onOpenNutzer={(r) => detailNutzer(r, true)}
                  regelnUndBerechtigungenList={data.regelnUndBerechtigungen}
                  erfahrungenList={data.erfahrungen}
                  onOpenErfahrungen={(r) => detailErfahrungen(r, true)}
                  onAddErfahrungen={perms.canWrite('erfahrungen') ? () => setErfahrungenDialog({ defaults: { vorhaben: createRecordUrl(APP_IDS.VORHABEN, top.record.record_id) } }) : undefined}
                  entscheidungenList={data.entscheidungen}
                  onOpenEntscheidungen={(r) => detailEntscheidungen(r, true)}
                  onAddEntscheidungen={perms.canWrite('entscheidungen') ? () => setEntscheidungenDialog({ defaults: { vorhaben: createRecordUrl(APP_IDS.VORHABEN, top.record.record_id) } }) : undefined}
                  massnahmenList={data.massnahmen}
                  onOpenMassnahmen={(r) => detailMassnahmen(r, true)}
                  onAddMassnahmen={perms.canWrite('massnahmen') ? () => setMassnahmenDialog({ defaults: { vorhaben: createRecordUrl(APP_IDS.VORHABEN, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'lernpruefungen') {
            return (
              <>
                <RecordHeader title={top.record.fields.wiederverwendbar_fuer ?? appLabel('lernpruefungen')} subtitle={top.record.fields.pruefdatum ? formatDate(top.record.fields.pruefdatum) : undefined} />
                <LernpruefungenDetails
                  record={top.record}
                  nutzerList={data.nutzer}
                  onOpenNutzer={(r) => detailNutzer(r, true)}
                  erfahrungenList={data.erfahrungen}
                  onOpenErfahrungen={(r) => detailErfahrungen(r, true)}
                  massnahmenList={data.massnahmen}
                />
              </>
            );
          }
          if (top.type === 'erfahrungen') {
            return (
              <>
                <RecordHeader title={top.record.fields.titel ?? appLabel('erfahrungen')} subtitle={undefined} />
                <ErfahrungenDetails
                  record={top.record}
                  vorhabenList={data.vorhaben}
                  onOpenVorhaben={(r) => detailVorhaben(r, true)}
                  nutzerList={data.nutzer}
                  onOpenNutzer={(r) => detailNutzer(r, true)}
                  entscheidungenList={data.entscheidungen}
                  onOpenEntscheidungen={(r) => detailEntscheidungen(r, true)}
                  lernpruefungenList={data.lernpruefungen}
                  onOpenLernpruefungen={(r) => detailLernpruefungen(r, true)}
                  onAddLernpruefungen={perms.canWrite('lernpruefungen') ? () => setLernpruefungenDialog({ defaults: { erfahrung: createRecordUrl(APP_IDS.ERFAHRUNGEN, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'entscheidungen') {
            return (
              <>
                <RecordHeader title={appLabel('entscheidungen')} subtitle={top.record.fields.frist ? formatDate(top.record.fields.frist) : undefined} />
                <EntscheidungenDetails
                  record={top.record}
                  alternativenList={data.alternativen}
                  onOpenAlternativen={(r) => detailAlternativen(r, true)}
                  vorhabenList={data.vorhaben}
                  onOpenVorhaben={(r) => detailVorhaben(r, true)}
                  regelnUndBerechtigungenList={data.regelnUndBerechtigungen}
                  nutzerList={data.nutzer}
                  onOpenNutzer={(r) => detailNutzer(r, true)}
                  erfahrungenList={data.erfahrungen}
                  onOpenErfahrungen={(r) => detailErfahrungen(r, true)}
                  onAddErfahrungen={perms.canWrite('erfahrungen') ? () => setErfahrungenDialog({ defaults: { entscheidung: createRecordUrl(APP_IDS.ENTSCHEIDUNGEN, top.record.record_id) } }) : undefined}
                  alternativenEntscheidungList={data.alternativen}
                  onOpenAlternativenEntscheidung={(r) => detailAlternativen(r, true)}
                  onAddAlternativenEntscheidung={perms.canWrite('alternativen') ? () => setAlternativenDialog({ defaults: { entscheidung: createRecordUrl(APP_IDS.ENTSCHEIDUNGEN, top.record.record_id) } }) : undefined}
                  massnahmenList={data.massnahmen}
                  onOpenMassnahmen={(r) => detailMassnahmen(r, true)}
                  onAddMassnahmen={perms.canWrite('massnahmen') ? () => setMassnahmenDialog({ defaults: { entscheidung: createRecordUrl(APP_IDS.ENTSCHEIDUNGEN, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'regelnUndBerechtigungen') {
            return (
              <>
                <RecordHeader title={top.record.fields.bezeichnung ?? appLabel('regeln_und_berechtigungen')} subtitle={top.record.fields.gueltig_ab ? formatDate(top.record.fields.gueltig_ab) : undefined} />
                <RegelnUndBerechtigungenDetails
                  record={top.record}
                  nutzerList={data.nutzer}
                  onOpenNutzer={(r) => detailNutzer(r, true)}
                  vorhabenList={data.vorhaben}
                  onOpenVorhaben={(r) => detailVorhaben(r, true)}
                  onAddVorhaben={perms.canWrite('vorhaben') ? () => setVorhabenDialog({ defaults: { geltende_regeln: [createRecordUrl(APP_IDS.REGELN_UND_BERECHTIGUNGEN, top.record.record_id)] } }) : undefined}
                  onPickVorhaben={perms.canWrite('vorhaben') ? () => setPickRegelnUndBerechtigungenVorhaben(top.record.record_id) : undefined}
                  entscheidungenList={data.entscheidungen}
                  onOpenEntscheidungen={(r) => detailEntscheidungen(r, true)}
                  onAddEntscheidungen={perms.canWrite('entscheidungen') ? () => setEntscheidungenDialog({ defaults: { geltende_regeln: [createRecordUrl(APP_IDS.REGELN_UND_BERECHTIGUNGEN, top.record.record_id)] } }) : undefined}
                  onPickEntscheidungen={perms.canWrite('entscheidungen') ? () => setPickRegelnUndBerechtigungenEntscheidungen(top.record.record_id) : undefined}
                />
              </>
            );
          }
          if (top.type === 'alternativen') {
            return (
              <>
                <RecordHeader title={top.record.fields.bezeichnung ?? appLabel('alternativen')} subtitle={undefined} />
                <AlternativenDetails
                  record={top.record}
                  nutzerList={data.nutzer}
                  onOpenNutzer={(r) => detailNutzer(r, true)}
                  entscheidungenList={data.entscheidungen}
                  onOpenEntscheidungen={(r) => detailEntscheidungen(r, true)}
                  entscheidungenGewaehlteOptionList={data.entscheidungen}
                  onOpenEntscheidungenGewaehlteOption={(r) => detailEntscheidungen(r, true)}
                  onAddEntscheidungenGewaehlteOption={perms.canWrite('entscheidungen') ? () => setEntscheidungenDialog({ defaults: { gewaehlte_option: createRecordUrl(APP_IDS.ALTERNATIVEN, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'nutzer') {
            return (
              <>
                <RecordHeader title={top.record.fields.nutzer_firstname ?? appLabel('nutzer')} subtitle={undefined} />
                <NutzerDetails
                  record={top.record}
                  vorhabenVerantwortlicherList={data.vorhaben}
                  onOpenVorhabenVerantwortlicher={(r) => detailVorhaben(r, true)}
                  onAddVorhabenVerantwortlicher={perms.canWrite('vorhaben') ? () => setVorhabenDialog({ defaults: { verantwortlicher: createRecordUrl(APP_IDS.NUTZER, top.record.record_id) } }) : undefined}
                  vorhabenBeteiligteList={data.vorhaben}
                  onOpenVorhabenBeteiligte={(r) => detailVorhaben(r, true)}
                  onAddVorhabenBeteiligte={perms.canWrite('vorhaben') ? () => setVorhabenDialog({ defaults: { beteiligte: [createRecordUrl(APP_IDS.NUTZER, top.record.record_id)] } }) : undefined}
                  onPickVorhabenBeteiligte={perms.canWrite('vorhaben') ? () => setPickNutzerVorhabenBeteiligte(top.record.record_id) : undefined}
                  lernpruefungenList={data.lernpruefungen}
                  onOpenLernpruefungen={(r) => detailLernpruefungen(r, true)}
                  onAddLernpruefungen={perms.canWrite('lernpruefungen') ? () => setLernpruefungenDialog({ defaults: { pruefer: createRecordUrl(APP_IDS.NUTZER, top.record.record_id) } }) : undefined}
                  erfahrungenWissenstraegerList={data.erfahrungen}
                  onOpenErfahrungenWissenstraeger={(r) => detailErfahrungen(r, true)}
                  onAddErfahrungenWissenstraeger={perms.canWrite('erfahrungen') ? () => setErfahrungenDialog({ defaults: { wissenstraeger: createRecordUrl(APP_IDS.NUTZER, top.record.record_id) } }) : undefined}
                  erfahrungenErfasstVonList={data.erfahrungen}
                  onOpenErfahrungenErfasstVon={(r) => detailErfahrungen(r, true)}
                  onAddErfahrungenErfasstVon={perms.canWrite('erfahrungen') ? () => setErfahrungenDialog({ defaults: { erfasst_von: createRecordUrl(APP_IDS.NUTZER, top.record.record_id) } }) : undefined}
                  entscheidungenList={data.entscheidungen}
                  onOpenEntscheidungen={(r) => detailEntscheidungen(r, true)}
                  onAddEntscheidungen={perms.canWrite('entscheidungen') ? () => setEntscheidungenDialog({ defaults: { zustaendiger: createRecordUrl(APP_IDS.NUTZER, top.record.record_id) } }) : undefined}
                  regelnUndBerechtigungenList={data.regelnUndBerechtigungen}
                  onOpenRegelnUndBerechtigungen={(r) => detailRegelnUndBerechtigungen(r, true)}
                  onAddRegelnUndBerechtigungen={perms.canWrite('regeln_und_berechtigungen') ? () => setRegelnUndBerechtigungenDialog({ defaults: { verantwortlicher: createRecordUrl(APP_IDS.NUTZER, top.record.record_id) } }) : undefined}
                  alternativenList={data.alternativen}
                  onOpenAlternativen={(r) => detailAlternativen(r, true)}
                  onAddAlternativen={perms.canWrite('alternativen') ? () => setAlternativenDialog({ defaults: { vorgeschlagen_von: createRecordUrl(APP_IDS.NUTZER, top.record.record_id) } }) : undefined}
                  massnahmenVorgeschlagenVonList={data.massnahmen}
                  onOpenMassnahmenVorgeschlagenVon={(r) => detailMassnahmen(r, true)}
                  onAddMassnahmenVorgeschlagenVon={perms.canWrite('massnahmen') ? () => setMassnahmenDialog({ defaults: { vorgeschlagen_von: createRecordUrl(APP_IDS.NUTZER, top.record.record_id) } }) : undefined}
                  massnahmenFreigegebenVonList={data.massnahmen}
                  onOpenMassnahmenFreigegebenVon={(r) => detailMassnahmen(r, true)}
                  onAddMassnahmenFreigegebenVon={perms.canWrite('massnahmen') ? () => setMassnahmenDialog({ defaults: { freigegeben_von: createRecordUrl(APP_IDS.NUTZER, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'massnahmen') {
            return (
              <>
                <RecordHeader title={appLabel('massnahmen')} subtitle={top.record.fields.freigabedatum ? formatDate(top.record.fields.freigabedatum) : undefined} />
                <MassnahmenDetails
                  record={top.record}
                  entscheidungenList={data.entscheidungen}
                  onOpenEntscheidungen={(r) => detailEntscheidungen(r, true)}
                  vorhabenList={data.vorhaben}
                  onOpenVorhaben={(r) => detailVorhaben(r, true)}
                  nutzerList={data.nutzer}
                  onOpenNutzer={(r) => detailNutzer(r, true)}
                  lernpruefungenList={data.lernpruefungen}
                  onOpenLernpruefungen={(r) => detailLernpruefungen(r, true)}
                  onAddLernpruefungen={perms.canWrite('lernpruefungen') ? () => setLernpruefungenDialog({ defaults: { belege_massnahmen: [createRecordUrl(APP_IDS.MASSNAHMEN, top.record.record_id)] } }) : undefined}
                  onPickLernpruefungen={perms.canWrite('lernpruefungen') ? () => setPickMassnahmenLernpruefungen(top.record.record_id) : undefined}
                />
              </>
            );
          }
          return null;
        }}
        canEdit={(top) => {
          if (top.type === 'vorhaben') return perms.canWrite('vorhaben');
          if (top.type === 'lernpruefungen') return perms.canWrite('lernpruefungen');
          if (top.type === 'erfahrungen') return perms.canWrite('erfahrungen');
          if (top.type === 'entscheidungen') return perms.canWrite('entscheidungen');
          if (top.type === 'regelnUndBerechtigungen') return perms.canWrite('regeln_und_berechtigungen');
          if (top.type === 'alternativen') return perms.canWrite('alternativen');
          if (top.type === 'nutzer') return perms.canWrite('nutzer');
          if (top.type === 'massnahmen') return perms.canWrite('massnahmen');
          return true;
        }}
        onEdit={(top) => {
          overlay.close();
          if (top.type === 'vorhaben') setVorhabenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'lernpruefungen') setLernpruefungenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'erfahrungen') setErfahrungenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'entscheidungen') setEntscheidungenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'regelnUndBerechtigungen') setRegelnUndBerechtigungenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'alternativen') setAlternativenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'nutzer') setNutzerDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'massnahmen') setMassnahmenDialog({ editing: top.record, defaults: top.record.fields });
        }}
      />
    </>
  );

  return {
    overlay,
    surfaces,
    vorhaben: {
      openCreate: (defaults?: VorhabenDialogDefaults) => (perms.canWrite('vorhaben') ? setVorhabenDialog({ defaults }) : refuse()),
      openEdit: (record: Vorhaben) => (perms.canWrite('vorhaben') ? setVorhabenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Vorhaben) => detailVorhaben(record, false),
      canWrite: perms.canWrite('vorhaben'),
    },
    lernpruefungen: {
      openCreate: (defaults?: LernpruefungenDialogDefaults) => (perms.canWrite('lernpruefungen') ? setLernpruefungenDialog({ defaults }) : refuse()),
      openEdit: (record: Lernpruefungen) => (perms.canWrite('lernpruefungen') ? setLernpruefungenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Lernpruefungen) => detailLernpruefungen(record, false),
      canWrite: perms.canWrite('lernpruefungen'),
    },
    erfahrungen: {
      openCreate: (defaults?: ErfahrungenDialogDefaults) => (perms.canWrite('erfahrungen') ? setErfahrungenDialog({ defaults }) : refuse()),
      openEdit: (record: Erfahrungen) => (perms.canWrite('erfahrungen') ? setErfahrungenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Erfahrungen) => detailErfahrungen(record, false),
      canWrite: perms.canWrite('erfahrungen'),
    },
    entscheidungen: {
      openCreate: (defaults?: EntscheidungenDialogDefaults) => (perms.canWrite('entscheidungen') ? setEntscheidungenDialog({ defaults }) : refuse()),
      openEdit: (record: Entscheidungen) => (perms.canWrite('entscheidungen') ? setEntscheidungenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Entscheidungen) => detailEntscheidungen(record, false),
      canWrite: perms.canWrite('entscheidungen'),
    },
    regelnUndBerechtigungen: {
      openCreate: (defaults?: RegelnUndBerechtigungenDialogDefaults) => (perms.canWrite('regeln_und_berechtigungen') ? setRegelnUndBerechtigungenDialog({ defaults }) : refuse()),
      openEdit: (record: RegelnUndBerechtigungen) => (perms.canWrite('regeln_und_berechtigungen') ? setRegelnUndBerechtigungenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: RegelnUndBerechtigungen) => detailRegelnUndBerechtigungen(record, false),
      canWrite: perms.canWrite('regeln_und_berechtigungen'),
    },
    alternativen: {
      openCreate: (defaults?: AlternativenDialogDefaults) => (perms.canWrite('alternativen') ? setAlternativenDialog({ defaults }) : refuse()),
      openEdit: (record: Alternativen) => (perms.canWrite('alternativen') ? setAlternativenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Alternativen) => detailAlternativen(record, false),
      canWrite: perms.canWrite('alternativen'),
    },
    nutzer: {
      openCreate: (defaults?: NutzerDialogDefaults) => (perms.canWrite('nutzer') ? setNutzerDialog({ defaults }) : refuse()),
      openEdit: (record: Nutzer) => (perms.canWrite('nutzer') ? setNutzerDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Nutzer) => detailNutzer(record, false),
      canWrite: perms.canWrite('nutzer'),
    },
    massnahmen: {
      openCreate: (defaults?: MassnahmenDialogDefaults) => (perms.canWrite('massnahmen') ? setMassnahmenDialog({ defaults }) : refuse()),
      openEdit: (record: Massnahmen) => (perms.canWrite('massnahmen') ? setMassnahmenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Massnahmen) => detailMassnahmen(record, false),
      canWrite: perms.canWrite('massnahmen'),
    },
    enriched: { vorhaben: enrichedVorhaben, lernpruefungen: enrichedLernpruefungen, erfahrungen: enrichedErfahrungen, entscheidungen: enrichedEntscheidungen, regelnUndBerechtigungen: enrichedRegelnUndBerechtigungen, alternativen: enrichedAlternativen, nutzer: data.nutzer, massnahmen: enrichedMassnahmen },
  };
}
