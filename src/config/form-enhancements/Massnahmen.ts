// Auto-generated. Per-entity form-enhancements config for "Maßnahmen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["vorhaben", "beschreibung", "herkunft", "status", "entscheidung", {"row": ["vorgeschlagen_von", "freigegeben_von"], "cols": "1fr 1fr"}, {"row": ["freigabedatum", "umsetzungsdatum"], "cols": "1fr 1fr"}, "zustandsaenderung", "tatsaechliches_ergebnis", "abweichung"],
  defaults: {
    'status': { kind: 'lookup', key: 'vorgeschlagen', label: 'Vorgeschlagen' },
    'herkunft': { kind: 'lookup', key: 'mensch', label: 'Mensch' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
