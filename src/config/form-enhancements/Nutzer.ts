// Auto-generated. Per-entity form-enhancements config for "Nutzer".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [{"row": ["nutzer_firstname", "nutzer_lastname"]}, "email", "art", "rolle", "fachgebiet", "aktiv", "verantwortungsbereich"],
  defaults: {
    'art': { kind: 'lookup', key: 'mensch', label: 'Mensch' },
    'aktiv': { kind: 'literal', value: true },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
