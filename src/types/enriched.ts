import type { Alternativen, Entscheidungen, Erfahrungen, Lernpruefungen, Massnahmen, RegelnUndBerechtigungen, Vorhaben } from './app';

export type EnrichedVorhaben = Vorhaben & {
  verantwortlicherName: string;
  beteiligteName: string;
  geltende_regelnName: string;
};

export type EnrichedLernpruefungen = Lernpruefungen & {
  prueferName: string;
  erfahrungName: string;
  belege_massnahmenName: string;
};

export type EnrichedErfahrungen = Erfahrungen & {
  vorhabenName: string;
  wissenstraegerName: string;
  erfasst_vonName: string;
  entscheidungName: string;
};

export type EnrichedEntscheidungen = Entscheidungen & {
  gewaehlte_optionName: string;
  vorhabenName: string;
  geltende_regelnName: string;
  zustaendigerName: string;
};

export type EnrichedRegelnUndBerechtigungen = RegelnUndBerechtigungen & {
  verantwortlicherName: string;
};

export type EnrichedAlternativen = Alternativen & {
  vorgeschlagen_vonName: string;
  entscheidungName: string;
};

export type EnrichedMassnahmen = Massnahmen & {
  entscheidungName: string;
  vorhabenName: string;
  vorgeschlagen_vonName: string;
  freigegeben_vonName: string;
};
