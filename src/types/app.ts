import { lookupLabel } from '@/i18n';

// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
/** A raw record URL (applookup reference). NEVER render this directly
 *  in JSX — it is a URL, not a display value. Show the enriched `*Name`
 *  field or resolve it via the entity map instead. Assignable to/from
 *  string everywhere; the `& {}` keeps the alias NAME visible in tsc
 *  error messages (a plain primitive alias gets normalized away). */
export type RecordUrl = string & {};
export type GeoLocation = { lat: number; long: number; info?: string };

export type AttachmentType = 'file' | 'note' | 'url' | 'json';
export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string | null;
  value: string | null;
  active: boolean;
  createdat?: string | null;
  updatedat?: string | null;
}

export interface AttachmentInput {
  type: AttachmentType;
  label?: string;
  value: string;
  active?: boolean;
}

export interface Vorhaben {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    titel?: string;
    ziel?: string;
    fachlicher_kontext?: string;
    hintergrund_historie?: string;
    arbeitszustand?: LookupValue;
    naechster_schritt?: string;
    verantwortlicher?: RecordUrl; // applookup -> URL zu 'Nutzer' Record
    beteiligte?: RecordUrl[];
    geltende_regeln?: RecordUrl[];
    ansprechpartner?: string;
    start?: string; // Format: YYYY-MM-DD oder ISO String
    zieltermin?: string; // Format: YYYY-MM-DD oder ISO String
    dokumentation?: string;
  };
}

export interface Lernpruefungen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    pruefer?: RecordUrl; // applookup -> URL zu 'Nutzer' Record
    pruefdatum?: string; // Format: YYYY-MM-DD oder ISO String
    ergebnis?: LookupValue;
    begruendung?: string;
    gueltigkeitsbereich_neu?: string;
    wiederverwendbar_fuer?: string;
    naechste_ueberpruefung?: string; // Format: YYYY-MM-DD oder ISO String
    erfahrung?: RecordUrl; // applookup -> URL zu 'Erfahrungen' Record
    belege_massnahmen?: RecordUrl[];
  };
}

export interface Erfahrungen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    titel?: string;
    kategorie?: LookupValue;
    beschreibung?: string;
    situation?: string;
    erkenntnis?: string;
    gueltigkeitsbereich?: string;
    grenzen?: string;
    vorhaben?: RecordUrl; // applookup -> URL zu 'Vorhaben' Record
    wissenstraeger?: RecordUrl; // applookup -> URL zu 'Nutzer' Record
    erfasst_von?: RecordUrl; // applookup -> URL zu 'Nutzer' Record
    status?: LookupValue;
    entscheidung?: RecordUrl; // applookup -> URL zu 'Entscheidungen' Record
  };
}

export interface Entscheidungen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    gewaehlte_option?: RecordUrl; // applookup -> URL zu 'Alternativen' Record
    vorhaben?: RecordUrl; // applookup -> URL zu 'Vorhaben' Record
    entscheidungsfrage?: string;
    situationstyp?: LookupValue;
    gesicherte_fakten?: string;
    offene_annahmen?: string;
    fehlende_informationen?: string;
    geltende_regeln?: RecordUrl[];
    zustaendiger?: RecordUrl; // applookup -> URL zu 'Nutzer' Record
    frist?: string; // Format: YYYY-MM-DD oder ISO String
    status?: LookupValue;
    begruendung?: string;
    entscheidungsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    umsetzungsplan?: string;
    erwartetes_ergebnis?: string;
    tatsaechliches_ergebnis?: string;
  };
}

export interface RegelnUndBerechtigungen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    bezeichnung?: string;
    beschreibung?: string;
    regeltyp?: LookupValue;
    geltungsbereich?: string;
    betroffene_rolle?: LookupValue;
    freigabepflicht?: boolean;
    gueltig_ab?: string; // Format: YYYY-MM-DD oder ISO String
    status?: LookupValue;
    verantwortlicher?: RecordUrl; // applookup -> URL zu 'Nutzer' Record
  };
}

export interface Alternativen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    bezeichnung?: string;
    beschreibung?: string;
    konsequenzen?: string;
    risiken?: string;
    aufwand?: string;
    empfehlungsgrad?: LookupValue;
    herkunft?: LookupValue;
    vorgeschlagen_von?: RecordUrl; // applookup -> URL zu 'Nutzer' Record
    entscheidung?: RecordUrl; // applookup -> URL zu 'Entscheidungen' Record
  };
}

export interface Nutzer {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    nutzer_firstname?: string;
    nutzer_lastname?: string;
    email?: string;
    art?: LookupValue;
    rolle?: LookupValue;
    fachgebiet?: string;
    verantwortungsbereich?: string;
    aktiv?: boolean;
  };
}

export interface Massnahmen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    entscheidung?: RecordUrl; // applookup -> URL zu 'Entscheidungen' Record
    vorhaben?: RecordUrl; // applookup -> URL zu 'Vorhaben' Record
    beschreibung?: string;
    herkunft?: LookupValue;
    vorgeschlagen_von?: RecordUrl; // applookup -> URL zu 'Nutzer' Record
    status?: LookupValue;
    freigegeben_von?: RecordUrl; // applookup -> URL zu 'Nutzer' Record
    freigabedatum?: string; // Format: YYYY-MM-DD oder ISO String
    zustandsaenderung?: string;
    umsetzungsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    tatsaechliches_ergebnis?: string;
    abweichung?: string;
  };
}

export const APP_IDS = {
  VORHABEN: '6ad478e140bebb73824babf9',
  LERNPRUEFUNGEN: '6ad478e55ad6baf028ed1a3c',
  ERFAHRUNGEN: '6ad478e4d33de030b5e08357',
  ENTSCHEIDUNGEN: '6ad478e24488328034d9650d',
  REGELN_UND_BERECHTIGUNGEN: '6ad478e0b6cd519b98e48896',
  ALTERNATIVEN: '6ad478e2f53025aaf0944873',
  NUTZER: '6ad478dad37a33c5729c18b8',
  MASSNAHMEN: '6ad478e32aa0a450934e45af',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'vorhaben': {
    arbeitszustand: [{ key: "wartet_auf_entscheidung", get label() { return lookupLabel('vorhaben', 'arbeitszustand', "wartet_auf_entscheidung") ?? "Wartet auf Entscheidung"; } }, { key: "umgesetzt", get label() { return lookupLabel('vorhaben', 'arbeitszustand', "umgesetzt") ?? "Umgesetzt"; } }, { key: "wirkung_pruefen", get label() { return lookupLabel('vorhaben', 'arbeitszustand', "wirkung_pruefen") ?? "Wirkung prüfen"; } }, { key: "abgeschlossen", get label() { return lookupLabel('vorhaben', 'arbeitszustand', "abgeschlossen") ?? "Abgeschlossen"; } }, { key: "pausiert", get label() { return lookupLabel('vorhaben', 'arbeitszustand', "pausiert") ?? "Pausiert"; } }, { key: "idee", get label() { return lookupLabel('vorhaben', 'arbeitszustand', "idee") ?? "Idee"; } }, { key: "geplant", get label() { return lookupLabel('vorhaben', 'arbeitszustand', "geplant") ?? "Geplant"; } }, { key: "in_arbeit", get label() { return lookupLabel('vorhaben', 'arbeitszustand', "in_arbeit") ?? "In Arbeit"; } }],
  },
  'lernpruefungen': {
    ergebnis: [{ key: "eingeschraenkt", get label() { return lookupLabel('lernpruefungen', 'ergebnis', "eingeschraenkt") ?? "Eingeschränkt"; } }, { key: "widerlegt", get label() { return lookupLabel('lernpruefungen', 'ergebnis', "widerlegt") ?? "Widerlegt"; } }, { key: "bestaetigt", get label() { return lookupLabel('lernpruefungen', 'ergebnis', "bestaetigt") ?? "Bestätigt"; } }],
  },
  'erfahrungen': {
    kategorie: [{ key: "historische_entscheidung", get label() { return lookupLabel('erfahrungen', 'kategorie', "historische_entscheidung") ?? "Historische Entscheidung"; } }, { key: "technische_besonderheit", get label() { return lookupLabel('erfahrungen', 'kategorie', "technische_besonderheit") ?? "Technische Besonderheit"; } }, { key: "frueherer_fehler", get label() { return lookupLabel('erfahrungen', 'kategorie', "frueherer_fehler") ?? "Früherer Fehler"; } }, { key: "informelle_regel", get label() { return lookupLabel('erfahrungen', 'kategorie', "informelle_regel") ?? "Informelle Regel"; } }, { key: "ansprechpartner", get label() { return lookupLabel('erfahrungen', 'kategorie', "ansprechpartner") ?? "Ansprechpartner"; } }, { key: "loesungsweg", get label() { return lookupLabel('erfahrungen', 'kategorie', "loesungsweg") ?? "Funktionierender Lösungsweg"; } }],
    status: [{ key: "entwurf", get label() { return lookupLabel('erfahrungen', 'status', "entwurf") ?? "Entwurf"; } }, { key: "geprueft", get label() { return lookupLabel('erfahrungen', 'status', "geprueft") ?? "Geprüft"; } }, { key: "veraltet", get label() { return lookupLabel('erfahrungen', 'status', "veraltet") ?? "Veraltet"; } }],
  },
  'entscheidungen': {
    situationstyp: [{ key: "strategisch", get label() { return lookupLabel('entscheidungen', 'situationstyp', "strategisch") ?? "Strategisch"; } }, { key: "technisch", get label() { return lookupLabel('entscheidungen', 'situationstyp', "technisch") ?? "Technisch"; } }, { key: "risiko", get label() { return lookupLabel('entscheidungen', 'situationstyp', "risiko") ?? "Risiko"; } }, { key: "eilentscheidung", get label() { return lookupLabel('entscheidungen', 'situationstyp', "eilentscheidung") ?? "Eilentscheidung"; } }, { key: "routine", get label() { return lookupLabel('entscheidungen', 'situationstyp', "routine") ?? "Routine"; } }],
    status: [{ key: "vorbereitet", get label() { return lookupLabel('entscheidungen', 'status', "vorbereitet") ?? "Vorbereitet"; } }, { key: "in_pruefung", get label() { return lookupLabel('entscheidungen', 'status', "in_pruefung") ?? "In Prüfung"; } }, { key: "entschieden", get label() { return lookupLabel('entscheidungen', 'status', "entschieden") ?? "Entschieden"; } }, { key: "umgesetzt", get label() { return lookupLabel('entscheidungen', 'status', "umgesetzt") ?? "Umgesetzt"; } }, { key: "verworfen", get label() { return lookupLabel('entscheidungen', 'status', "verworfen") ?? "Verworfen"; } }],
  },
  'regeln_und_berechtigungen': {
    regeltyp: [{ key: "regel", get label() { return lookupLabel('regeln_und_berechtigungen', 'regeltyp', "regel") ?? "Regel"; } }, { key: "berechtigung", get label() { return lookupLabel('regeln_und_berechtigungen', 'regeltyp', "berechtigung") ?? "Berechtigung"; } }, { key: "grenze", get label() { return lookupLabel('regeln_und_berechtigungen', 'regeltyp', "grenze") ?? "Grenze"; } }],
    betroffene_rolle: [{ key: "alle", get label() { return lookupLabel('regeln_und_berechtigungen', 'betroffene_rolle', "alle") ?? "Alle"; } }, { key: "administrator", get label() { return lookupLabel('regeln_und_berechtigungen', 'betroffene_rolle', "administrator") ?? "Administrator"; } }, { key: "projektverantwortlicher", get label() { return lookupLabel('regeln_und_berechtigungen', 'betroffene_rolle', "projektverantwortlicher") ?? "Projektverantwortlicher"; } }, { key: "entscheider", get label() { return lookupLabel('regeln_und_berechtigungen', 'betroffene_rolle', "entscheider") ?? "Entscheider"; } }, { key: "fachexperte", get label() { return lookupLabel('regeln_und_berechtigungen', 'betroffene_rolle', "fachexperte") ?? "Fachexperte"; } }, { key: "pruefer", get label() { return lookupLabel('regeln_und_berechtigungen', 'betroffene_rolle', "pruefer") ?? "Prüfer"; } }, { key: "mitarbeiter", get label() { return lookupLabel('regeln_und_berechtigungen', 'betroffene_rolle', "mitarbeiter") ?? "Mitarbeiter"; } }, { key: "ki_assistent", get label() { return lookupLabel('regeln_und_berechtigungen', 'betroffene_rolle', "ki_assistent") ?? "KI-Assistent"; } }],
    status: [{ key: "entwurf", get label() { return lookupLabel('regeln_und_berechtigungen', 'status', "entwurf") ?? "Entwurf"; } }, { key: "gueltig", get label() { return lookupLabel('regeln_und_berechtigungen', 'status', "gueltig") ?? "Gültig"; } }, { key: "ausser_kraft", get label() { return lookupLabel('regeln_und_berechtigungen', 'status', "ausser_kraft") ?? "Außer Kraft"; } }],
  },
  'alternativen': {
    empfehlungsgrad: [{ key: "empfohlen", get label() { return lookupLabel('alternativen', 'empfehlungsgrad', "empfohlen") ?? "Empfohlen"; } }, { key: "neutral", get label() { return lookupLabel('alternativen', 'empfehlungsgrad', "neutral") ?? "Neutral"; } }, { key: "nicht_empfohlen", get label() { return lookupLabel('alternativen', 'empfehlungsgrad', "nicht_empfohlen") ?? "Nicht empfohlen"; } }],
    herkunft: [{ key: "mensch", get label() { return lookupLabel('alternativen', 'herkunft', "mensch") ?? "Mensch"; } }, { key: "ki", get label() { return lookupLabel('alternativen', 'herkunft', "ki") ?? "KI"; } }],
  },
  'nutzer': {
    art: [{ key: "mensch", get label() { return lookupLabel('nutzer', 'art', "mensch") ?? "Mensch"; } }, { key: "ki_assistent", get label() { return lookupLabel('nutzer', 'art', "ki_assistent") ?? "KI-Assistent"; } }],
    rolle: [{ key: "administrator", get label() { return lookupLabel('nutzer', 'rolle', "administrator") ?? "Administrator"; } }, { key: "projektverantwortlicher", get label() { return lookupLabel('nutzer', 'rolle', "projektverantwortlicher") ?? "Projektverantwortlicher"; } }, { key: "entscheider", get label() { return lookupLabel('nutzer', 'rolle', "entscheider") ?? "Entscheider"; } }, { key: "fachexperte", get label() { return lookupLabel('nutzer', 'rolle', "fachexperte") ?? "Fachexperte"; } }, { key: "pruefer", get label() { return lookupLabel('nutzer', 'rolle', "pruefer") ?? "Prüfer"; } }, { key: "mitarbeiter", get label() { return lookupLabel('nutzer', 'rolle', "mitarbeiter") ?? "Mitarbeiter"; } }, { key: "ki_assistent", get label() { return lookupLabel('nutzer', 'rolle', "ki_assistent") ?? "KI-Assistent"; } }],
  },
  'massnahmen': {
    herkunft: [{ key: "mensch", get label() { return lookupLabel('massnahmen', 'herkunft', "mensch") ?? "Mensch"; } }, { key: "ki_vorschlag", get label() { return lookupLabel('massnahmen', 'herkunft', "ki_vorschlag") ?? "KI-Vorschlag"; } }],
    status: [{ key: "vorgeschlagen", get label() { return lookupLabel('massnahmen', 'status', "vorgeschlagen") ?? "Vorgeschlagen"; } }, { key: "abgelehnt", get label() { return lookupLabel('massnahmen', 'status', "abgelehnt") ?? "Abgelehnt"; } }, { key: "in_umsetzung", get label() { return lookupLabel('massnahmen', 'status', "in_umsetzung") ?? "In Umsetzung"; } }, { key: "erledigt", get label() { return lookupLabel('massnahmen', 'status', "erledigt") ?? "Erledigt"; } }, { key: "freigegeben", get label() { return lookupLabel('massnahmen', 'status', "freigegeben") ?? "Freigegeben"; } }],
  },
};

// Optimistic LookupValue writes: never re-type a label — resolve the schema
// option instead (its label is a locale-aware getter; falls back to the key).
// WRONG: status: { key: 'offen', label: 'Offen' }   (frozen in one language)
// RIGHT: status: lookupOption('<appKey>', 'status', 'offen')
export function lookupOption(app: string, field: string, key: string): LookupValue {
  return LOOKUP_OPTIONS[app]?.[field]?.find(o => o.key === key) ?? { key, label: key };
}

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'vorhaben': {
    'titel': 'string/text',
    'ziel': 'string/textarea',
    'fachlicher_kontext': 'string/textarea',
    'hintergrund_historie': 'string/textarea',
    'arbeitszustand': 'lookup/select',
    'naechster_schritt': 'string/text',
    'verantwortlicher': 'applookup/select',
    'beteiligte': 'multipleapplookup/select',
    'geltende_regeln': 'multipleapplookup/select',
    'ansprechpartner': 'string/textarea',
    'start': 'date/date',
    'zieltermin': 'date/date',
    'dokumentation': 'file',
  },
  'lernpruefungen': {
    'pruefer': 'applookup/select',
    'pruefdatum': 'date/date',
    'ergebnis': 'lookup/radio',
    'begruendung': 'string/textarea',
    'gueltigkeitsbereich_neu': 'string/textarea',
    'wiederverwendbar_fuer': 'string/text',
    'naechste_ueberpruefung': 'date/date',
    'erfahrung': 'applookup/select',
    'belege_massnahmen': 'multipleapplookup/select',
  },
  'erfahrungen': {
    'titel': 'string/text',
    'kategorie': 'lookup/select',
    'beschreibung': 'string/textarea',
    'situation': 'string/textarea',
    'erkenntnis': 'string/textarea',
    'gueltigkeitsbereich': 'string/textarea',
    'grenzen': 'string/textarea',
    'vorhaben': 'applookup/select',
    'wissenstraeger': 'applookup/select',
    'erfasst_von': 'applookup/select',
    'status': 'lookup/select',
    'entscheidung': 'applookup/select',
  },
  'entscheidungen': {
    'gewaehlte_option': 'applookup/select',
    'vorhaben': 'applookup/select',
    'entscheidungsfrage': 'string/textarea',
    'situationstyp': 'lookup/select',
    'gesicherte_fakten': 'string/textarea',
    'offene_annahmen': 'string/textarea',
    'fehlende_informationen': 'string/textarea',
    'geltende_regeln': 'multipleapplookup/select',
    'zustaendiger': 'applookup/select',
    'frist': 'date/date',
    'status': 'lookup/select',
    'begruendung': 'string/textarea',
    'entscheidungsdatum': 'date/date',
    'umsetzungsplan': 'string/textarea',
    'erwartetes_ergebnis': 'string/textarea',
    'tatsaechliches_ergebnis': 'string/textarea',
  },
  'regeln_und_berechtigungen': {
    'bezeichnung': 'string/text',
    'beschreibung': 'string/textarea',
    'regeltyp': 'lookup/radio',
    'geltungsbereich': 'string/text',
    'betroffene_rolle': 'lookup/select',
    'freigabepflicht': 'bool',
    'gueltig_ab': 'date/date',
    'status': 'lookup/select',
    'verantwortlicher': 'applookup/select',
  },
  'alternativen': {
    'bezeichnung': 'string/text',
    'beschreibung': 'string/textarea',
    'konsequenzen': 'string/textarea',
    'risiken': 'string/textarea',
    'aufwand': 'string/text',
    'empfehlungsgrad': 'lookup/radio',
    'herkunft': 'lookup/radio',
    'vorgeschlagen_von': 'applookup/select',
    'entscheidung': 'applookup/select',
  },
  'nutzer': {
    'nutzer_firstname': 'string/text',
    'nutzer_lastname': 'string/text',
    'email': 'string/email',
    'art': 'lookup/radio',
    'rolle': 'lookup/select',
    'fachgebiet': 'string/text',
    'verantwortungsbereich': 'string/textarea',
    'aktiv': 'bool',
  },
  'massnahmen': {
    'entscheidung': 'applookup/select',
    'vorhaben': 'applookup/select',
    'beschreibung': 'string/textarea',
    'herkunft': 'lookup/radio',
    'vorgeschlagen_von': 'applookup/select',
    'status': 'lookup/select',
    'freigegeben_von': 'applookup/select',
    'freigabedatum': 'date/datetimeminute',
    'zustandsaenderung': 'string/textarea',
    'umsetzungsdatum': 'date/date',
    'tatsaechliches_ergebnis': 'string/textarea',
    'abweichung': 'string/textarea',
  },
};

export const HUB_TOPOLOGY: Record<string, { field: string; entity: string }[]> = {
  'vorhaben': [
    { field: 'vorhaben', entity: 'erfahrungen' },
    { field: 'vorhaben', entity: 'entscheidungen' },
    { field: 'vorhaben', entity: 'massnahmen' },
  ],
  'entscheidungen': [
    { field: 'entscheidung', entity: 'erfahrungen' },
    { field: 'entscheidung', entity: 'alternativen' },
    { field: 'entscheidung', entity: 'massnahmen' },
  ],
  'nutzer': [
    { field: 'verantwortlicher', entity: 'vorhaben' },
    { field: 'beteiligte', entity: 'vorhaben' },
    { field: 'pruefer', entity: 'lernpruefungen' },
    { field: 'wissenstraeger', entity: 'erfahrungen' },
    { field: 'erfasst_von', entity: 'erfahrungen' },
    { field: 'zustaendiger', entity: 'entscheidungen' },
    { field: 'verantwortlicher', entity: 'regeln_und_berechtigungen' },
    { field: 'vorgeschlagen_von', entity: 'alternativen' },
    { field: 'vorgeschlagen_von', entity: 'massnahmen' },
    { field: 'freigegeben_von', entity: 'massnahmen' },
  ],
};

// Aliases for the pre-0.0.279 app keys (see 4c).
LOOKUP_OPTIONS['maßnahmen'] = LOOKUP_OPTIONS['massnahmen'];
FIELD_TYPES['maßnahmen'] = FIELD_TYPES['massnahmen'];

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateVorhaben = StripLookup<Vorhaben['fields']>;
export type CreateLernpruefungen = StripLookup<Lernpruefungen['fields']>;
export type CreateErfahrungen = StripLookup<Erfahrungen['fields']>;
export type CreateEntscheidungen = StripLookup<Entscheidungen['fields']>;
export type CreateRegelnUndBerechtigungen = StripLookup<RegelnUndBerechtigungen['fields']>;
export type CreateAlternativen = StripLookup<Alternativen['fields']>;
export type CreateNutzer = StripLookup<Nutzer['fields']>;
export type CreateMassnahmen = StripLookup<Massnahmen['fields']>;