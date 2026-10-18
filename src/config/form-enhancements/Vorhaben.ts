// Auto-generated. Per-entity form-enhancements config for "Vorhaben".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["titel", "arbeitszustand", {"row": ["start", "zieltermin"], "cols": "1fr 1fr"}, "verantwortlicher", "beteiligte", "geltende_regeln", "naechster_schritt", "ziel", "fachlicher_kontext", "hintergrund_historie", "ansprechpartner"],
  defaults: {
    'arbeitszustand': { kind: 'lookup', key: 'idee', label: 'Idee' },
    'start': { kind: 'today' },
  },
  computed: {
    '_vorhaben_dauer_tage': { kind: 'dateDiff', from: 'start', to: 'zieltermin', unit: 'days' },
  },
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
