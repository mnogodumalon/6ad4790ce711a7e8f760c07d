/**
 * Field rules — GENERATED from the app metadata. Do not edit.
 *
 * The mechanical truth about every field: what kind it is, whether the
 * platform's base view marks it required, which lookup keys exist, where an
 * applookup points, what the label is. `useStepForm` validates against these
 * rules and phrases its messages with the real labels; `toWirePayload` uses
 * them to shape the create payload; `SHAPES` tells a page which input FORM
 * fits the data (a date pair wants a calendar, not two fields) — it is a
 * signal, not a gate.
 */
import { appLabel, fieldLabel, lookupLabel } from '@/i18n';
import { policyLabel } from './policy';
import { LOOKUP_OPTIONS } from '@/types/app';

export type EntityKey = 'vorhaben' | 'lernpruefungen' | 'erfahrungen' | 'entscheidungen' | 'regeln_und_berechtigungen' | 'alternativen' | 'nutzer' | 'massnahmen';

/** The text fields of each entity — what a search may run over (generated;
 *  `never` for an entity without text of its own, e.g. a link table). */
export interface StringFields {
  "vorhaben": "titel" | "ziel" | "fachlicher_kontext" | "hintergrund_historie" | "naechster_schritt" | "ansprechpartner";
  "lernpruefungen": "begruendung" | "gueltigkeitsbereich_neu" | "wiederverwendbar_fuer";
  "erfahrungen": "titel" | "beschreibung" | "situation" | "erkenntnis" | "gueltigkeitsbereich" | "grenzen";
  "entscheidungen": "entscheidungsfrage" | "gesicherte_fakten" | "offene_annahmen" | "fehlende_informationen" | "begruendung" | "umsetzungsplan" | "erwartetes_ergebnis" | "tatsaechliches_ergebnis";
  "regeln_und_berechtigungen": "bezeichnung" | "beschreibung" | "geltungsbereich";
  "alternativen": "bezeichnung" | "beschreibung" | "konsequenzen" | "risiken" | "aufwand";
  "nutzer": "nutzer_firstname" | "nutzer_lastname" | "email" | "fachgebiet" | "verantwortungsbereich";
  "massnahmen": "beschreibung" | "zustandsaenderung" | "tatsaechliches_ergebnis" | "abweichung";
}
export type StringFieldKey<E extends EntityKey> = E extends keyof StringFields ? StringFields[E] : never;

/** The applookup fields of each entity (generated). A pick stored through
 *  `form.set` on one of these must carry its display name — at compile time
 *  (`StepForm.set`), because the review would otherwise show the id. */
export interface RecordFields {
  "vorhaben": "verantwortlicher" | "beteiligte" | "geltende_regeln";
  "lernpruefungen": "pruefer" | "erfahrung" | "belege_massnahmen";
  "erfahrungen": "vorhaben" | "wissenstraeger" | "erfasst_von" | "entscheidung";
  "entscheidungen": "gewaehlte_option" | "vorhaben" | "geltende_regeln" | "zustaendiger";
  "regeln_und_berechtigungen": "verantwortlicher";
  "alternativen": "vorgeschlagen_von" | "entscheidung";
  "nutzer": never;
  "massnahmen": "entscheidung" | "vorhaben" | "vorgeschlagen_von" | "freigegeben_von";
}
export type RecordFieldKey<E extends EntityKey> = E extends keyof RecordFields ? RecordFields[E] : never;

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'url'
  | 'number'
  | 'bool'
  | 'date'
  | 'datetime'
  | 'lookup'
  | 'multilookup'
  | 'record'
  | 'multirecord'
  | 'file'
  | 'geo';

export interface FieldRule {
  key: string;
  fulltype: string;
  kind: FieldKind;
  /** From the app's base view. A public page may override this per field. */
  required: boolean;
  /** Build-time label — `labelOf()` prefers the runtime i18n bundle. */
  label: string;
  /** Whether a journey may write it (`file` is upload-only, never via a journey). */
  writable: boolean;
  maxLength?: number;
  /** lookup / multilookup: the ONLY valid write values. */
  options?: string[];
  /** record / multirecord: the target app (always) and its entity key (when inside this appgroup). */
  targetAppId?: string;
  targetEntity?: EntityKey;
  format?: 'currency';
  /** HTML autocomplete token derived from the field name (given-name, email, tel, …). */
  autoComplete?: string;
}

export interface EntityInfo {
  key: EntityKey;
  appId: string;
  label: string;
  /** PascalCase plural — `get<pascal>()` on the service. */
  pascal: string;
  /** The single-record suffix — `create<single>()` on the service. */
  single: string;
}

/** Input-form signals per entity: which data shape each field (pair) has.
 *  `range`  — two date fields that form a stay/period → AvailabilityRangePicker
 *  `choice` — a lookup with few options → ChoiceGroup pills instead of a select
 *  `record` — an applookup → EntitySelectStep with search, never a raw id field
 *  `stock`  — a quantity that has a stock/capacity counterpart → show it, warn on overshoot */
export type Shape =
  | { kind: 'range'; from: string; to: string }
  | { kind: 'choice'; field: string; count: number }
  | { kind: 'record'; field: string; targetEntity?: EntityKey }
  | { kind: 'stock'; field: string };

export const ENTITIES: Record<EntityKey, EntityInfo> = {
  "vorhaben": {
    "key": "vorhaben",
    "appId": "6ad478e140bebb73824babf9",
    "label": "Vorhaben",
    "pascal": "Vorhaben",
    "single": "VorhabenEntry"
  },
  "lernpruefungen": {
    "key": "lernpruefungen",
    "appId": "6ad478e55ad6baf028ed1a3c",
    "label": "Lernprüfungen",
    "pascal": "Lernpruefungen",
    "single": "LernpruefungenEntry"
  },
  "erfahrungen": {
    "key": "erfahrungen",
    "appId": "6ad478e4d33de030b5e08357",
    "label": "Erfahrungen",
    "pascal": "Erfahrungen",
    "single": "ErfahrungenEntry"
  },
  "entscheidungen": {
    "key": "entscheidungen",
    "appId": "6ad478e24488328034d9650d",
    "label": "Entscheidungen",
    "pascal": "Entscheidungen",
    "single": "EntscheidungenEntry"
  },
  "regeln_und_berechtigungen": {
    "key": "regeln_und_berechtigungen",
    "appId": "6ad478e0b6cd519b98e48896",
    "label": "Regeln und Berechtigungen",
    "pascal": "RegelnUndBerechtigungen",
    "single": "RegelnUndBerechtigungenEntry"
  },
  "alternativen": {
    "key": "alternativen",
    "appId": "6ad478e2f53025aaf0944873",
    "label": "Alternativen",
    "pascal": "Alternativen",
    "single": "AlternativenEntry"
  },
  "nutzer": {
    "key": "nutzer",
    "appId": "6ad478dad37a33c5729c18b8",
    "label": "Nutzer",
    "pascal": "Nutzer",
    "single": "NutzerEntry"
  },
  "massnahmen": {
    "key": "massnahmen",
    "appId": "6ad478e32aa0a450934e45af",
    "label": "Maßnahmen",
    "pascal": "Massnahmen",
    "single": "MassnahmenEntry"
  }
};

export const FIELD_RULES: Record<EntityKey, Record<string, FieldRule>> = {
  "vorhaben": {
    "titel": {
      "key": "titel",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Titel",
      "writable": true,
      "maxLength": 4000
    },
    "ziel": {
      "key": "ziel",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Ziel",
      "writable": true
    },
    "fachlicher_kontext": {
      "key": "fachlicher_kontext",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Fachlicher Kontext",
      "writable": true
    },
    "hintergrund_historie": {
      "key": "hintergrund_historie",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Hintergrund und Historie",
      "writable": true
    },
    "arbeitszustand": {
      "key": "arbeitszustand",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Arbeitszustand",
      "writable": true,
      "options": [
        "wartet_auf_entscheidung",
        "umgesetzt",
        "wirkung_pruefen",
        "abgeschlossen",
        "pausiert",
        "idee",
        "geplant",
        "in_arbeit"
      ]
    },
    "naechster_schritt": {
      "key": "naechster_schritt",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Nächster Schritt",
      "writable": true,
      "maxLength": 4000
    },
    "verantwortlicher": {
      "key": "verantwortlicher",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Verantwortlicher",
      "writable": true,
      "targetAppId": "6ad478dad37a33c5729c18b8",
      "targetEntity": "nutzer"
    },
    "beteiligte": {
      "key": "beteiligte",
      "fulltype": "multipleapplookup/select",
      "kind": "multirecord",
      "required": false,
      "label": "Beteiligte",
      "writable": true,
      "targetAppId": "6ad478dad37a33c5729c18b8",
      "targetEntity": "nutzer"
    },
    "geltende_regeln": {
      "key": "geltende_regeln",
      "fulltype": "multipleapplookup/select",
      "kind": "multirecord",
      "required": false,
      "label": "Geltende Regeln",
      "writable": true,
      "targetAppId": "6ad478e0b6cd519b98e48896",
      "targetEntity": "regeln_und_berechtigungen"
    },
    "ansprechpartner": {
      "key": "ansprechpartner",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Ansprechpartner und Besonderheiten",
      "writable": true,
      "autoComplete": "name"
    },
    "start": {
      "key": "start",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Start",
      "writable": true
    },
    "zieltermin": {
      "key": "zieltermin",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Zieltermin",
      "writable": true
    },
    "dokumentation": {
      "key": "dokumentation",
      "fulltype": "file",
      "kind": "file",
      "required": false,
      "label": "Dokumentation",
      "writable": false
    }
  },
  "lernpruefungen": {
    "pruefer": {
      "key": "pruefer",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Prüfer",
      "writable": true,
      "targetAppId": "6ad478dad37a33c5729c18b8",
      "targetEntity": "nutzer"
    },
    "pruefdatum": {
      "key": "pruefdatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": true,
      "label": "Prüfdatum",
      "writable": true
    },
    "ergebnis": {
      "key": "ergebnis",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Ergebnis",
      "writable": true,
      "options": [
        "eingeschraenkt",
        "widerlegt",
        "bestaetigt"
      ]
    },
    "begruendung": {
      "key": "begruendung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Begründung",
      "writable": true
    },
    "gueltigkeitsbereich_neu": {
      "key": "gueltigkeitsbereich_neu",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Gültigkeitsbereich nach Prüfung",
      "writable": true
    },
    "wiederverwendbar_fuer": {
      "key": "wiederverwendbar_fuer",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Wiederverwendbar für",
      "writable": true,
      "maxLength": 4000
    },
    "naechste_ueberpruefung": {
      "key": "naechste_ueberpruefung",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Nächste Überprüfung",
      "writable": true
    },
    "erfahrung": {
      "key": "erfahrung",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Erfahrung",
      "writable": true,
      "targetAppId": "6ad478e4d33de030b5e08357",
      "targetEntity": "erfahrungen"
    },
    "belege_massnahmen": {
      "key": "belege_massnahmen",
      "fulltype": "multipleapplookup/select",
      "kind": "multirecord",
      "required": false,
      "label": "Belege aus Maßnahmen",
      "writable": true,
      "targetAppId": "6ad478e32aa0a450934e45af",
      "targetEntity": "massnahmen"
    }
  },
  "erfahrungen": {
    "titel": {
      "key": "titel",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Titel",
      "writable": true,
      "maxLength": 4000
    },
    "kategorie": {
      "key": "kategorie",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Kategorie",
      "writable": true,
      "options": [
        "historische_entscheidung",
        "technische_besonderheit",
        "frueherer_fehler",
        "informelle_regel",
        "ansprechpartner",
        "loesungsweg"
      ]
    },
    "beschreibung": {
      "key": "beschreibung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Beschreibung",
      "writable": true
    },
    "situation": {
      "key": "situation",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Situation",
      "writable": true
    },
    "erkenntnis": {
      "key": "erkenntnis",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Lösung oder Erkenntnis",
      "writable": true
    },
    "gueltigkeitsbereich": {
      "key": "gueltigkeitsbereich",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Gültigkeitsbereich",
      "writable": true
    },
    "grenzen": {
      "key": "grenzen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Grenzen",
      "writable": true
    },
    "vorhaben": {
      "key": "vorhaben",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Quelle: Vorhaben",
      "writable": true,
      "targetAppId": "6ad478e140bebb73824babf9",
      "targetEntity": "vorhaben"
    },
    "wissenstraeger": {
      "key": "wissenstraeger",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Quelle: Wissensträger",
      "writable": true,
      "targetAppId": "6ad478dad37a33c5729c18b8",
      "targetEntity": "nutzer"
    },
    "erfasst_von": {
      "key": "erfasst_von",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Erfasst von",
      "writable": true,
      "targetAppId": "6ad478dad37a33c5729c18b8",
      "targetEntity": "nutzer"
    },
    "status": {
      "key": "status",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Status",
      "writable": true,
      "options": [
        "entwurf",
        "geprueft",
        "veraltet"
      ]
    },
    "entscheidung": {
      "key": "entscheidung",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Quelle: Entscheidung",
      "writable": true,
      "targetAppId": "6ad478e24488328034d9650d",
      "targetEntity": "entscheidungen"
    }
  },
  "entscheidungen": {
    "gewaehlte_option": {
      "key": "gewaehlte_option",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Gewählte Option",
      "writable": true,
      "targetAppId": "6ad478e2f53025aaf0944873",
      "targetEntity": "alternativen"
    },
    "vorhaben": {
      "key": "vorhaben",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Vorhaben",
      "writable": true,
      "targetAppId": "6ad478e140bebb73824babf9",
      "targetEntity": "vorhaben"
    },
    "entscheidungsfrage": {
      "key": "entscheidungsfrage",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Entscheidungsfrage",
      "writable": true
    },
    "situationstyp": {
      "key": "situationstyp",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Situationstyp",
      "writable": true,
      "options": [
        "strategisch",
        "technisch",
        "risiko",
        "eilentscheidung",
        "routine"
      ]
    },
    "gesicherte_fakten": {
      "key": "gesicherte_fakten",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Gesicherte Fakten",
      "writable": true
    },
    "offene_annahmen": {
      "key": "offene_annahmen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Offene Annahmen",
      "writable": true
    },
    "fehlende_informationen": {
      "key": "fehlende_informationen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Fehlende Informationen",
      "writable": true
    },
    "geltende_regeln": {
      "key": "geltende_regeln",
      "fulltype": "multipleapplookup/select",
      "kind": "multirecord",
      "required": false,
      "label": "Geltende Regeln und Grenzen",
      "writable": true,
      "targetAppId": "6ad478e0b6cd519b98e48896",
      "targetEntity": "regeln_und_berechtigungen"
    },
    "zustaendiger": {
      "key": "zustaendiger",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Zuständiger",
      "writable": true,
      "targetAppId": "6ad478dad37a33c5729c18b8",
      "targetEntity": "nutzer"
    },
    "frist": {
      "key": "frist",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Frist",
      "writable": true
    },
    "status": {
      "key": "status",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Status",
      "writable": true,
      "options": [
        "vorbereitet",
        "in_pruefung",
        "entschieden",
        "umgesetzt",
        "verworfen"
      ]
    },
    "begruendung": {
      "key": "begruendung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Begründung",
      "writable": true
    },
    "entscheidungsdatum": {
      "key": "entscheidungsdatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Entscheidungsdatum",
      "writable": true
    },
    "umsetzungsplan": {
      "key": "umsetzungsplan",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Umsetzungsplan",
      "writable": true
    },
    "erwartetes_ergebnis": {
      "key": "erwartetes_ergebnis",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Erwartetes Ergebnis",
      "writable": true
    },
    "tatsaechliches_ergebnis": {
      "key": "tatsaechliches_ergebnis",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Tatsächliches Ergebnis",
      "writable": true
    }
  },
  "regeln_und_berechtigungen": {
    "bezeichnung": {
      "key": "bezeichnung",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Bezeichnung",
      "writable": true,
      "maxLength": 4000
    },
    "beschreibung": {
      "key": "beschreibung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Beschreibung",
      "writable": true
    },
    "regeltyp": {
      "key": "regeltyp",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Regeltyp",
      "writable": true,
      "options": [
        "regel",
        "berechtigung",
        "grenze"
      ]
    },
    "geltungsbereich": {
      "key": "geltungsbereich",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Geltungsbereich",
      "writable": true,
      "maxLength": 4000
    },
    "betroffene_rolle": {
      "key": "betroffene_rolle",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Betroffene Rolle",
      "writable": true,
      "options": [
        "alle",
        "administrator",
        "projektverantwortlicher",
        "entscheider",
        "fachexperte",
        "pruefer",
        "mitarbeiter",
        "ki_assistent"
      ]
    },
    "freigabepflicht": {
      "key": "freigabepflicht",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Freigabe durch einen Menschen erforderlich",
      "writable": true
    },
    "gueltig_ab": {
      "key": "gueltig_ab",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Gültig ab",
      "writable": true
    },
    "status": {
      "key": "status",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Status",
      "writable": true,
      "options": [
        "entwurf",
        "gueltig",
        "ausser_kraft"
      ]
    },
    "verantwortlicher": {
      "key": "verantwortlicher",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Verantwortlicher",
      "writable": true,
      "targetAppId": "6ad478dad37a33c5729c18b8",
      "targetEntity": "nutzer"
    }
  },
  "alternativen": {
    "bezeichnung": {
      "key": "bezeichnung",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Bezeichnung",
      "writable": true,
      "maxLength": 4000
    },
    "beschreibung": {
      "key": "beschreibung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Beschreibung",
      "writable": true
    },
    "konsequenzen": {
      "key": "konsequenzen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Konsequenzen",
      "writable": true
    },
    "risiken": {
      "key": "risiken",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Risiken",
      "writable": true
    },
    "aufwand": {
      "key": "aufwand",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Aufwand",
      "writable": true,
      "maxLength": 4000
    },
    "empfehlungsgrad": {
      "key": "empfehlungsgrad",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": false,
      "label": "Empfehlungsgrad",
      "writable": true,
      "options": [
        "empfohlen",
        "neutral",
        "nicht_empfohlen"
      ]
    },
    "herkunft": {
      "key": "herkunft",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Herkunft",
      "writable": true,
      "options": [
        "mensch",
        "ki"
      ]
    },
    "vorgeschlagen_von": {
      "key": "vorgeschlagen_von",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Vorgeschlagen von",
      "writable": true,
      "targetAppId": "6ad478dad37a33c5729c18b8",
      "targetEntity": "nutzer"
    },
    "entscheidung": {
      "key": "entscheidung",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Entscheidung",
      "writable": true,
      "targetAppId": "6ad478e24488328034d9650d",
      "targetEntity": "entscheidungen"
    }
  },
  "nutzer": {
    "nutzer_firstname": {
      "key": "nutzer_firstname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Vorname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "nutzer_lastname": {
      "key": "nutzer_lastname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Nachname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "email": {
      "key": "email",
      "fulltype": "string/email",
      "kind": "email",
      "required": false,
      "label": "E-Mail",
      "writable": true,
      "autoComplete": "email"
    },
    "art": {
      "key": "art",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Art",
      "writable": true,
      "options": [
        "mensch",
        "ki_assistent"
      ]
    },
    "rolle": {
      "key": "rolle",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Rolle",
      "writable": true,
      "options": [
        "administrator",
        "projektverantwortlicher",
        "entscheider",
        "fachexperte",
        "pruefer",
        "mitarbeiter",
        "ki_assistent"
      ]
    },
    "fachgebiet": {
      "key": "fachgebiet",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Fachgebiet",
      "writable": true,
      "maxLength": 4000
    },
    "verantwortungsbereich": {
      "key": "verantwortungsbereich",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Verantwortungsbereich",
      "writable": true
    },
    "aktiv": {
      "key": "aktiv",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Aktiv",
      "writable": true
    }
  },
  "massnahmen": {
    "entscheidung": {
      "key": "entscheidung",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Entscheidung",
      "writable": true,
      "targetAppId": "6ad478e24488328034d9650d",
      "targetEntity": "entscheidungen"
    },
    "vorhaben": {
      "key": "vorhaben",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Vorhaben",
      "writable": true,
      "targetAppId": "6ad478e140bebb73824babf9",
      "targetEntity": "vorhaben"
    },
    "beschreibung": {
      "key": "beschreibung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Beschreibung der Tätigkeit",
      "writable": true
    },
    "herkunft": {
      "key": "herkunft",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Herkunft",
      "writable": true,
      "options": [
        "mensch",
        "ki_vorschlag"
      ]
    },
    "vorgeschlagen_von": {
      "key": "vorgeschlagen_von",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Vorgeschlagen von",
      "writable": true,
      "targetAppId": "6ad478dad37a33c5729c18b8",
      "targetEntity": "nutzer"
    },
    "status": {
      "key": "status",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Status",
      "writable": true,
      "options": [
        "vorgeschlagen",
        "abgelehnt",
        "in_umsetzung",
        "erledigt",
        "freigegeben"
      ]
    },
    "freigegeben_von": {
      "key": "freigegeben_von",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Freigegeben von",
      "writable": true,
      "targetAppId": "6ad478dad37a33c5729c18b8",
      "targetEntity": "nutzer"
    },
    "freigabedatum": {
      "key": "freigabedatum",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": false,
      "label": "Freigabedatum",
      "writable": true
    },
    "zustandsaenderung": {
      "key": "zustandsaenderung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Zustandsänderung",
      "writable": true
    },
    "umsetzungsdatum": {
      "key": "umsetzungsdatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Datum der Umsetzung",
      "writable": true
    },
    "tatsaechliches_ergebnis": {
      "key": "tatsaechliches_ergebnis",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Tatsächliches Ergebnis",
      "writable": true
    },
    "abweichung": {
      "key": "abweichung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Abweichung vom Erwarteten",
      "writable": true
    }
  }
};

export const SHAPES: Record<EntityKey, Shape[]> = {
  "vorhaben": [
    {
      "kind": "record",
      "field": "verantwortlicher",
      "targetEntity": "nutzer"
    },
    {
      "kind": "record",
      "field": "beteiligte",
      "targetEntity": "nutzer"
    },
    {
      "kind": "record",
      "field": "geltende_regeln",
      "targetEntity": "regeln_und_berechtigungen"
    }
  ],
  "lernpruefungen": [
    {
      "kind": "choice",
      "field": "ergebnis",
      "count": 3
    },
    {
      "kind": "record",
      "field": "pruefer",
      "targetEntity": "nutzer"
    },
    {
      "kind": "record",
      "field": "erfahrung",
      "targetEntity": "erfahrungen"
    },
    {
      "kind": "record",
      "field": "belege_massnahmen",
      "targetEntity": "massnahmen"
    }
  ],
  "erfahrungen": [
    {
      "kind": "choice",
      "field": "kategorie",
      "count": 6
    },
    {
      "kind": "choice",
      "field": "status",
      "count": 3
    },
    {
      "kind": "record",
      "field": "vorhaben",
      "targetEntity": "vorhaben"
    },
    {
      "kind": "record",
      "field": "wissenstraeger",
      "targetEntity": "nutzer"
    },
    {
      "kind": "record",
      "field": "erfasst_von",
      "targetEntity": "nutzer"
    },
    {
      "kind": "record",
      "field": "entscheidung",
      "targetEntity": "entscheidungen"
    }
  ],
  "entscheidungen": [
    {
      "kind": "choice",
      "field": "situationstyp",
      "count": 5
    },
    {
      "kind": "choice",
      "field": "status",
      "count": 5
    },
    {
      "kind": "record",
      "field": "gewaehlte_option",
      "targetEntity": "alternativen"
    },
    {
      "kind": "record",
      "field": "vorhaben",
      "targetEntity": "vorhaben"
    },
    {
      "kind": "record",
      "field": "geltende_regeln",
      "targetEntity": "regeln_und_berechtigungen"
    },
    {
      "kind": "record",
      "field": "zustaendiger",
      "targetEntity": "nutzer"
    }
  ],
  "regeln_und_berechtigungen": [
    {
      "kind": "choice",
      "field": "regeltyp",
      "count": 3
    },
    {
      "kind": "choice",
      "field": "status",
      "count": 3
    },
    {
      "kind": "record",
      "field": "verantwortlicher",
      "targetEntity": "nutzer"
    }
  ],
  "alternativen": [
    {
      "kind": "choice",
      "field": "empfehlungsgrad",
      "count": 3
    },
    {
      "kind": "choice",
      "field": "herkunft",
      "count": 2
    },
    {
      "kind": "record",
      "field": "vorgeschlagen_von",
      "targetEntity": "nutzer"
    },
    {
      "kind": "record",
      "field": "entscheidung",
      "targetEntity": "entscheidungen"
    }
  ],
  "nutzer": [
    {
      "kind": "choice",
      "field": "art",
      "count": 2
    }
  ],
  "massnahmen": [
    {
      "kind": "choice",
      "field": "herkunft",
      "count": 2
    },
    {
      "kind": "choice",
      "field": "status",
      "count": 5
    },
    {
      "kind": "record",
      "field": "entscheidung",
      "targetEntity": "entscheidungen"
    },
    {
      "kind": "record",
      "field": "vorhaben",
      "targetEntity": "vorhaben"
    },
    {
      "kind": "record",
      "field": "vorgeschlagen_von",
      "targetEntity": "nutzer"
    },
    {
      "kind": "record",
      "field": "freigegeben_von",
      "targetEntity": "nutzer"
    }
  ]
};

/** The fields a record of this entity is recognised by (a person: first and
 *  last name; else its title-like text field) — the same choice the dashboard's
 *  enrichment makes for `<key>Name`. `useRecordSearch` resolves an applookup to
 *  this name (`ctx.ref('gast')` in `toItem`). */
export const DISPLAY_FIELDS: Record<EntityKey, string[]> = {
  "vorhaben": [
    "titel"
  ],
  "lernpruefungen": [
    "begruendung"
  ],
  "erfahrungen": [
    "titel"
  ],
  "entscheidungen": [
    "entscheidungsfrage"
  ],
  "regeln_und_berechtigungen": [
    "bezeichnung"
  ],
  "alternativen": [
    "bezeichnung"
  ],
  "nutzer": [
    "nutzer_firstname"
  ],
  "massnahmen": [
    "beschreibung"
  ]
};

/** The display name of a record: its display fields joined, else the first
 *  non-empty text value, else ''. */
/** A display-field value as text: strings as they are, a lookup `{ key, label }`
 *  (either door hydrates lookups to objects) by its label — an entity whose
 *  only title-like field is a lookup/select otherwise had no name at all. */
function displayPart(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (v && typeof v === 'object' && 'label' in v) {
    const l = (v as { label?: unknown }).label;
    return l === null || l === undefined ? '' : String(l).trim();
  }
  return '';
}

export function displayNameOf(entity: EntityKey, fields: Record<string, unknown>): string {
  const parts = (DISPLAY_FIELDS[entity] ?? [])
    .map(k => displayPart(fields[k]))
    .filter(v => v !== '');
  if (parts.length > 0) return parts.join(' ');
  for (const [k, rule] of Object.entries(FIELD_RULES[entity] ?? {})) {
    if (rule.kind !== 'text' && rule.kind !== 'email') continue;
    const v = fields[k];
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
  }
  return '';
}

export function ruleOf(entity: EntityKey, key: string): FieldRule | undefined {
  return FIELD_RULES[entity]?.[key];
}

/** The field label as the user sees it — the owner's policy label first (a
 *  public page's "Felder anpassen"), runtime bundle second, generated label last. */
export function labelOf(entity: EntityKey, key: string): string {
  const own = policyLabel(entity, key);
  if (own) return own;
  const fromBundle = fieldLabel(entity, key);
  if (fromBundle !== key) return fromBundle;
  return ruleOf(entity, key)?.label ?? key;
}

export function entityLabel(entity: EntityKey): string {
  const fromBundle = appLabel(entity);
  if (fromBundle !== entity) return fromBundle;
  return ENTITIES[entity]?.label ?? entity;
}

/** Lookup options with runtime labels — the only legitimate source of `{key,label}` pairs. */
export function optionsOf(entity: EntityKey, key: string): Array<{ key: string; label: string }> {
  const generated = (LOOKUP_OPTIONS as Record<string, Record<string, Array<{ key: string; label: string }>>>)[entity]?.[key];
  if (generated && generated.length) return generated.map(o => ({ key: o.key, label: o.label }));
  const keys = ruleOf(entity, key)?.options ?? [];
  return keys.map(k => ({ key: k, label: lookupLabel(entity, key, k) ?? k }));
}

export function isEmptyValue(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object' && 'from' in (v as object) && 'to' in (v as object)) {
    const r = v as { from: unknown; to: unknown };
    return isEmptyValue(r.from) && isEmptyValue(r.to);
  }
  return false;
}
