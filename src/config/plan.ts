// The orchestrator's plan, as far as the running app needs it
// (docs/orchestrator/SPEC.md). Generated — do not edit; regenerated on every
// build and update from the stored plan. Without a plan every map is empty.
//
//   SYSTEM_ASSIGNED entity → fields a tool fills when a record is CREATED — the
//                   value does not exist before; dialogs hide these on create and
//                   the form-polish sets no default on them. A scheduled or
//                   update-triggered tool owns its field but is NOT in here.
//   PLAN_SENTENCES  slug → the plan in the owner's words (flows' field page)
//
// The runtime write guard (FLOW_WRITES/OWNERSHIP, planGuard.ts) left on
// 23.09.2026: a flow page composes against its generated hook, whose submit
// plan IS the Schreibliste — there is no way to spell a write outside it.

export const SYSTEM_ASSIGNED: Record<string, string[]> = {};

export const PLAN_SENTENCES: Record<string, string[]> = {
  "entscheidung-vorbereiten": [
    "Legt an: alternativen, entscheidungen",
    "Ändert: vorhaben",
    "Automatisch: status (fester Wert „vorbereitet“), arbeitszustand (fester Wert „wartet_auf_entscheidung“)"
  ],
  "entscheidung-treffen": [
    "Legt an: massnahmen",
    "Ändert: entscheidungen",
    "Automatisch: entscheidungsdatum (heutiges Datum, automatisch), status (fester Wert „vorgeschlagen“)"
  ],
  "massnahme-freigeben": [
    "Ändert: massnahmen",
    "Automatisch: freigabedatum (aktueller Zeitpunkt, automatisch)"
  ],
  "massnahme-abschliessen": [
    "Ändert: massnahmen, vorhaben",
    "Automatisch: status (fester Wert „erledigt“), arbeitszustand (fester Wert „wirkung_pruefen“)"
  ],
  "erfahrung-erfassen": [
    "Legt an: erfahrungen",
    "Automatisch: status (fester Wert „entwurf“)"
  ],
  "erfahrung-pruefen": [
    "Legt an: lernpruefungen",
    "Ändert: erfahrungen",
    "Automatisch: pruefdatum (heutiges Datum, automatisch), status (Bei Ergebnis „Bestätigt“ oder „Eingeschränkt“ auf „Geprüft“, bei „Widerlegt“ auf „Veral …)"
  ]
};

export const PLAN_SUMMARY = "Eine gemeinsame Arbeitsplattform, in der Menschen und KI komplexe Vorhaben bearbeiten. Jedes Vorhaben behält seinen fachlichen Kontext und einen klaren Arbeitszustand. Entscheidungen werden mit Frage, Alternativen, Fakten, Annahmen und geltenden Regeln vorbereitet. Maßnahmen, auch KI-Vorschläge, werden kontrolliert freigegeben und umgesetzt. Erfahrungen werden dokumentiert, geprüft und für spätere Vorhaben nutzbar gemacht, damit kein Wissen bei Einzelnen hängen bleibt.";

/** slug → the lists a flow writes (the plan's Schreibliste). The nav leaves a
 *  flow out for a user who may not write one of them (lib/permissions.ts). */
export const FLOW_ENTITIES: Record<string, string[]> = {
  "entscheidung-vorbereiten": [
    "alternativen",
    "entscheidungen",
    "vorhaben"
  ],
  "entscheidung-treffen": [
    "entscheidungen",
    "massnahmen"
  ],
  "massnahme-freigeben": [
    "massnahmen"
  ],
  "massnahme-abschliessen": [
    "massnahmen",
    "vorhaben"
  ],
  "erfahrung-erfassen": [
    "erfahrungen"
  ],
  "erfahrung-pruefen": [
    "erfahrungen",
    "lernpruefungen"
  ]
};
