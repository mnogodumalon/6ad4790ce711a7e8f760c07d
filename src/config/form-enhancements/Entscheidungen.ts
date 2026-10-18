// Auto-generated. Per-entity form-enhancements config for "Entscheidungen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["vorhaben", "entscheidungsfrage", {"row": ["situationstyp", "status"], "cols": "1fr 1fr"}, "zustaendiger", {"row": ["frist", "entscheidungsdatum"], "cols": "1fr 1fr"}, "gewaehlte_option", "geltende_regeln", "gesicherte_fakten", "offene_annahmen", "fehlende_informationen", "begruendung", "umsetzungsplan", "erwartetes_ergebnis", "tatsaechliches_ergebnis"],
  defaults: {
    'status': { kind: 'lookup', key: 'vorbereitet', label: 'Vorbereitet' },
    'frist': { kind: 'todayOffset', days: 14 },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
