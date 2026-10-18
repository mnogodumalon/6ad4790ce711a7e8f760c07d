import type { EnrichedAlternativen, EnrichedEntscheidungen, EnrichedErfahrungen, EnrichedLernpruefungen, EnrichedMassnahmen, EnrichedRegelnUndBerechtigungen, EnrichedVorhaben } from '@/types/enriched';
import type { Alternativen, Entscheidungen, Erfahrungen, Lernpruefungen, Massnahmen, Nutzer, RegelnUndBerechtigungen, Vorhaben } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface VorhabenMaps {
  nutzerMap: Map<string, Nutzer>;
  regelnUndBerechtigungenMap: Map<string, RegelnUndBerechtigungen>;
}

export function enrichVorhaben(
  vorhaben: Vorhaben[],
  maps: VorhabenMaps
): EnrichedVorhaben[] {
  return vorhaben.map(r => ({
    ...r,
    verantwortlicherName: resolveDisplay(r.fields.verantwortlicher, maps.nutzerMap, 'nutzer_firstname'),
    beteiligteName: resolveDisplay(r.fields.beteiligte, maps.nutzerMap, 'nutzer_firstname'),
    geltende_regelnName: resolveDisplay(r.fields.geltende_regeln, maps.regelnUndBerechtigungenMap, 'bezeichnung'),
  }));
}

interface LernpruefungenMaps {
  nutzerMap: Map<string, Nutzer>;
  erfahrungenMap: Map<string, Erfahrungen>;
  massnahmenMap: Map<string, Massnahmen>;
}

export function enrichLernpruefungen(
  lernpruefungen: Lernpruefungen[],
  maps: LernpruefungenMaps
): EnrichedLernpruefungen[] {
  return lernpruefungen.map(r => ({
    ...r,
    prueferName: resolveDisplay(r.fields.pruefer, maps.nutzerMap, 'nutzer_firstname'),
    erfahrungName: resolveDisplay(r.fields.erfahrung, maps.erfahrungenMap, 'titel'),
    belege_massnahmenName: resolveDisplay(r.fields.belege_massnahmen, maps.massnahmenMap, 'beschreibung'),
  }));
}

interface ErfahrungenMaps {
  vorhabenMap: Map<string, Vorhaben>;
  nutzerMap: Map<string, Nutzer>;
  entscheidungenMap: Map<string, Entscheidungen>;
}

export function enrichErfahrungen(
  erfahrungen: Erfahrungen[],
  maps: ErfahrungenMaps
): EnrichedErfahrungen[] {
  return erfahrungen.map(r => ({
    ...r,
    vorhabenName: resolveDisplay(r.fields.vorhaben, maps.vorhabenMap, 'titel'),
    wissenstraegerName: resolveDisplay(r.fields.wissenstraeger, maps.nutzerMap, 'nutzer_firstname'),
    erfasst_vonName: resolveDisplay(r.fields.erfasst_von, maps.nutzerMap, 'nutzer_firstname'),
    entscheidungName: resolveDisplay(r.fields.entscheidung, maps.entscheidungenMap, 'entscheidungsfrage'),
  }));
}

interface EntscheidungenMaps {
  alternativenMap: Map<string, Alternativen>;
  vorhabenMap: Map<string, Vorhaben>;
  regelnUndBerechtigungenMap: Map<string, RegelnUndBerechtigungen>;
  nutzerMap: Map<string, Nutzer>;
}

export function enrichEntscheidungen(
  entscheidungen: Entscheidungen[],
  maps: EntscheidungenMaps
): EnrichedEntscheidungen[] {
  return entscheidungen.map(r => ({
    ...r,
    gewaehlte_optionName: resolveDisplay(r.fields.gewaehlte_option, maps.alternativenMap, 'bezeichnung'),
    vorhabenName: resolveDisplay(r.fields.vorhaben, maps.vorhabenMap, 'titel'),
    geltende_regelnName: resolveDisplay(r.fields.geltende_regeln, maps.regelnUndBerechtigungenMap, 'bezeichnung'),
    zustaendigerName: resolveDisplay(r.fields.zustaendiger, maps.nutzerMap, 'nutzer_firstname'),
  }));
}

interface RegelnUndBerechtigungenMaps {
  nutzerMap: Map<string, Nutzer>;
}

export function enrichRegelnUndBerechtigungen(
  regelnUndBerechtigungen: RegelnUndBerechtigungen[],
  maps: RegelnUndBerechtigungenMaps
): EnrichedRegelnUndBerechtigungen[] {
  return regelnUndBerechtigungen.map(r => ({
    ...r,
    verantwortlicherName: resolveDisplay(r.fields.verantwortlicher, maps.nutzerMap, 'nutzer_firstname'),
  }));
}

interface AlternativenMaps {
  nutzerMap: Map<string, Nutzer>;
  entscheidungenMap: Map<string, Entscheidungen>;
}

export function enrichAlternativen(
  alternativen: Alternativen[],
  maps: AlternativenMaps
): EnrichedAlternativen[] {
  return alternativen.map(r => ({
    ...r,
    vorgeschlagen_vonName: resolveDisplay(r.fields.vorgeschlagen_von, maps.nutzerMap, 'nutzer_firstname'),
    entscheidungName: resolveDisplay(r.fields.entscheidung, maps.entscheidungenMap, 'entscheidungsfrage'),
  }));
}

interface MassnahmenMaps {
  entscheidungenMap: Map<string, Entscheidungen>;
  vorhabenMap: Map<string, Vorhaben>;
  nutzerMap: Map<string, Nutzer>;
}

export function enrichMassnahmen(
  massnahmen: Massnahmen[],
  maps: MassnahmenMaps
): EnrichedMassnahmen[] {
  return massnahmen.map(r => ({
    ...r,
    entscheidungName: resolveDisplay(r.fields.entscheidung, maps.entscheidungenMap, 'entscheidungsfrage'),
    vorhabenName: resolveDisplay(r.fields.vorhaben, maps.vorhabenMap, 'titel'),
    vorgeschlagen_vonName: resolveDisplay(r.fields.vorgeschlagen_von, maps.nutzerMap, 'nutzer_firstname'),
    freigegeben_vonName: resolveDisplay(r.fields.freigegeben_von, maps.nutzerMap, 'nutzer_firstname'),
  }));
}
