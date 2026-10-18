// Auto-generated. Per-entity form-enhancements config for "Alternativen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["bezeichnung", "entscheidung", {"row": ["herkunft", "empfehlungsgrad"], "cols": "1fr 1fr"}, {"row": ["vorgeschlagen_von", "aufwand"], "cols": "1fr 1fr"}, "beschreibung", "konsequenzen", "risiken"],
  defaults: {
    'herkunft': { kind: 'lookup', key: 'mensch', label: 'Mensch' },
    'empfehlungsgrad': { kind: 'lookup', key: 'neutral', label: 'Neutral' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
