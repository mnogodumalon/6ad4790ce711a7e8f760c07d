/**
 * Occupancy semantics — DECIDED BY THE BUILD AGENT, never by a heuristic.
 *
 * The Phase-2 orchestrator writes its decision to `.intents-staging/occupancy.json`
 * (stay pair, booked resource, statuses that do not occupy); the integration
 * step validates it against the app metadata and renders it into the block
 * below. Scaffold updates keep the block. Do not edit outside the markers.
 *
 * Both doors read this and nothing else: `occupancyFor` (internal flows AND
 * public pages) and the owner service (the public grant's occupancy read).
 * No rule for an entity = no availability calendar, no occupancy claim —
 * a plain date field pair is shown instead.
 *
 * Facts from the metadata — candidates, NOT decisions:
 *   - vorhaben: applookups verantwortlicher→nutzer, beteiligte→nutzer, geltende_regeln→regeln_und_berechtigungen · lookups arbeitszustand[wartet_auf_entscheidung|umgesetzt|wirkung_pruefen|abgeschlossen|pausiert|idee|geplant|in_arbeit]
 *   - lernpruefungen: applookups pruefer→nutzer, erfahrung→erfahrungen, belege_massnahmen→massnahmen · lookups ergebnis[eingeschraenkt|widerlegt|bestaetigt]
 *   - erfahrungen: applookups vorhaben→vorhaben, wissenstraeger→nutzer, erfasst_von→nutzer, entscheidung→entscheidungen · lookups kategorie[historische_entscheidung|technische_besonderheit|frueherer_fehler|informelle_regel|ansprechpartner|loesungsweg], status[entwurf|geprueft|veraltet]
 *   - entscheidungen: applookups gewaehlte_option→alternativen, vorhaben→vorhaben, geltende_regeln→regeln_und_berechtigungen, zustaendiger→nutzer · lookups situationstyp[strategisch|technisch|risiko|eilentscheidung|routine], status[vorbereitet|in_pruefung|entschieden|umgesetzt|verworfen]
 *   - regeln_und_berechtigungen: applookups verantwortlicher→nutzer · lookups regeltyp[regel|berechtigung|grenze], betroffene_rolle[alle|administrator|projektverantwortlicher|entscheider|fachexperte|pruefer|mitarbeiter|ki_assistent], status[entwurf|gueltig|ausser_kraft]
 *   - alternativen: applookups vorgeschlagen_von→nutzer, entscheidung→entscheidungen · lookups empfehlungsgrad[empfohlen|neutral|nicht_empfohlen], herkunft[mensch|ki]
 *   - nutzer: lookups art[mensch|ki_assistent], rolle[administrator|projektverantwortlicher|entscheider|fachexperte|pruefer|mitarbeiter|ki_assistent]
 *   - massnahmen: applookups entscheidung→entscheidungen, vorhaben→vorhaben, vorgeschlagen_von→nutzer, freigegeben_von→nutzer · lookups herkunft[mensch|ki_vorschlag], status[vorgeschlagen|abgelehnt|in_umsetzung|erledigt|freigegeben]
 */
import type { EntityKey } from '@/lib/journey/rules';

export interface OccupancyRule {
  /** Arrival / departure fields (the departure day is exclusive). */
  from: string;
  to: string;
  /** applookup field naming the booked RESOURCE (room, vehicle, court).
   *  Omit when the entity itself is the one resource (a single holiday flat). */
  resource?: string;
  /** lookup field + the keys that mean "does NOT occupy" (cancelled, no-show). */
  statusField?: string;
  freeKeys?: string[];
}

export const OCCUPANCY: Partial<Record<EntityKey, OccupancyRule>> = {
  // <custom:occupancy>
  // </custom:occupancy>
};

/**
 * A record of the KEY entity is TAKEN while a record of `entity` points at it
 * through `field` — a slot with a booking, a seat with a ticket. Generated
 * from the plan's blocking `unique` check on that reference (05.10.2026:
 * the salon's public page offered booked slots again). Pickers on both
 * doors leave taken records out (useRecordSearch); a public page reads only
 * `field` of `entity` — never who booked. Generator-owned: no markers.
 */
export interface TakenRule {
  entity: EntityKey;
  field: string;
}

export const TAKEN_BY: Partial<Record<EntityKey, TakenRule>> = {
};
