// Auto-generated. Per-entity form-enhancements config for "Lernprüfungen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["erfahrung", {"row": ["pruefer", "pruefdatum"], "cols": "1fr 1fr"}, "ergebnis", {"row": ["naechste_ueberpruefung", "wiederverwendbar_fuer"], "cols": "1fr 1fr"}, "belege_massnahmen", "begruendung", "gueltigkeitsbereich_neu"],
  defaults: {
    'pruefdatum': { kind: 'today' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
