/**
 * Required-field messages — WRITTEN BY THE BUILD AGENT, never by a heuristic.
 *
 * The layer knows two things about an empty required field: that it is
 * required and what its label is. Out of that it can only say „„Anreise" ist
 * ein Pflichtfeld". What the person should do instead („Bitte einen Gast
 * auswählen.") is meaning, and meaning is the agent's: the Phase-2 orchestrator
 * writes one short instruction per required field — what is needed, not why — to
 * `.intents-staging/messages.json`, the integration step validates it against
 * the app metadata and renders it into the block below. Scaffold updates keep
 * the block. Do not edit outside the markers.
 *
 * Every door reads this and nothing else: `useStepForm` (flows and public
 * pages), the generated {Entity}Dialog and the public form's server-error line.
 * A field without a sentence falls back to the label sentence — never to a
 * bare „Dieses Feld ist erforderlich".
 *
 * Required fields per entity (from the base view):
 *   - vorhaben: titel (Titel), ziel (Ziel), arbeitszustand (Arbeitszustand)
 *   - lernpruefungen: pruefer (Prüfer), pruefdatum (Prüfdatum), ergebnis (Ergebnis), erfahrung (Erfahrung)
 *   - erfahrungen: titel (Titel), kategorie (Kategorie), status (Status)
 *   - entscheidungen: vorhaben (Vorhaben), entscheidungsfrage (Entscheidungsfrage), situationstyp (Situationstyp), zustaendiger (Zuständiger), status (Status)
 *   - regeln_und_berechtigungen: bezeichnung (Bezeichnung), regeltyp (Regeltyp), status (Status)
 *   - alternativen: bezeichnung (Bezeichnung), herkunft (Herkunft), entscheidung (Entscheidung)
 *   - nutzer: nutzer_firstname (Vorname), nutzer_lastname (Nachname), art (Art), rolle (Rolle)
 *   - massnahmen: vorhaben (Vorhaben), beschreibung (Beschreibung der Tätigkeit), herkunft (Herkunft), status (Status)
 */
import { t, tx } from '@/i18n';
import { labelOf, type EntityKey } from './rules';

/** The writable fields of each entity — the keys a message may address (generated). */
export interface MessageFields {
  "vorhaben": "titel" | "ziel" | "fachlicher_kontext" | "hintergrund_historie" | "arbeitszustand" | "naechster_schritt" | "verantwortlicher" | "beteiligte" | "geltende_regeln" | "ansprechpartner" | "start" | "zieltermin";
  "lernpruefungen": "pruefer" | "pruefdatum" | "ergebnis" | "begruendung" | "gueltigkeitsbereich_neu" | "wiederverwendbar_fuer" | "naechste_ueberpruefung" | "erfahrung" | "belege_massnahmen";
  "erfahrungen": "titel" | "kategorie" | "beschreibung" | "situation" | "erkenntnis" | "gueltigkeitsbereich" | "grenzen" | "vorhaben" | "wissenstraeger" | "erfasst_von" | "status" | "entscheidung";
  "entscheidungen": "gewaehlte_option" | "vorhaben" | "entscheidungsfrage" | "situationstyp" | "gesicherte_fakten" | "offene_annahmen" | "fehlende_informationen" | "geltende_regeln" | "zustaendiger" | "frist" | "status" | "begruendung" | "entscheidungsdatum" | "umsetzungsplan" | "erwartetes_ergebnis" | "tatsaechliches_ergebnis";
  "regeln_und_berechtigungen": "bezeichnung" | "beschreibung" | "regeltyp" | "geltungsbereich" | "betroffene_rolle" | "freigabepflicht" | "gueltig_ab" | "status" | "verantwortlicher";
  "alternativen": "bezeichnung" | "beschreibung" | "konsequenzen" | "risiken" | "aufwand" | "empfehlungsgrad" | "herkunft" | "vorgeschlagen_von" | "entscheidung";
  "nutzer": "nutzer_firstname" | "nutzer_lastname" | "email" | "art" | "rolle" | "fachgebiet" | "verantwortungsbereich" | "aktiv";
  "massnahmen": "entscheidung" | "vorhaben" | "beschreibung" | "herkunft" | "vorgeschlagen_von" | "status" | "freigegeben_von" | "freigabedatum" | "zustandsaenderung" | "umsetzungsdatum" | "tatsaechliches_ergebnis" | "abweichung";
}
export type MessageFieldKey<E extends EntityKey> = E extends keyof MessageFields ? MessageFields[E] : never;

export const REQUIRED_MESSAGES: { [E in EntityKey]?: Partial<Record<MessageFieldKey<E>, string>> } = {
  // <custom:messages>
  // </custom:messages>
};

/** The sentence shown when `key` of `entity` is required and empty — the
 *  agent's own text (translated at runtime like every page string), else the
 *  label sentence. Call it while rendering, not at module scope. */
export function requiredMessage(entity: EntityKey, key: string): string {
  const own = (REQUIRED_MESSAGES as Record<string, Record<string, string | undefined> | undefined>)[entity]?.[key];
  if (own && own.trim()) return tx(own);
  return t('v_required', { label: labelOf(entity, key) });
}

/** True when the agent wrote a sentence for the field. */
export function hasOwnMessage(entity: EntityKey, key: string): boolean {
  const own = (REQUIRED_MESSAGES as Record<string, Record<string, string | undefined> | undefined>)[entity]?.[key];
  return Boolean(own && own.trim());
}
