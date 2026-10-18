// Auto-generated. Per-entity form-enhancements config for "Erfahrungen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["titel", {"row": ["kategorie", "status"], "cols": "2fr 1fr"}, {"row": ["vorhaben", "entscheidung"], "cols": "1fr 1fr"}, {"row": ["wissenstraeger", "erfasst_von"], "cols": "1fr 1fr"}, "beschreibung", "situation", "erkenntnis", "gueltigkeitsbereich", "grenzen"],
  defaults: {
    'status': { kind: 'lookup', key: 'entwurf', label: 'Entwurf' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
