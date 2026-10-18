/**
 * useEntscheidungVorbereitenFlow — the plumbing of the flow « Entscheidung vorbereiten », generated from the plan.
 *
 * Writes `entscheidungen`: asks `vorhaben`, `entscheidungsfrage`, `situationstyp`, `gesicherte_fakten`, `offene_annahmen`, `fehlende_informationen`, `geltende_regeln`, `zustaendiger`, `frist`; sets `status` itself.
Writes `alternativen`: asks `bezeichnung`, `beschreibung`, `konsequenzen`, `risiken`, `aufwand`, `empfehlungsgrad`, `herkunft`, `vorgeschlagen_von`; links `entscheidung` ← the created `entscheidungen`.
Changes `vorhaben`: the record to change is picked (`flow.pick('vorhaben')`), the form is prefilled with its values; ; sets `arbeitszustand` itself.
 * The hook OWNS: the form(s) with exactly these fields and the plan's required
 * ingredients, one record search per picked field (columns and filter from
 * the plan), and the submit plan with its fixed and derived values. A page
 * that only calls `flow.submit.run()` cannot write a field the plan does not
 * know — there is no way to spell it.
 *
 * YOU decide what a person notices, through the options:
 *   steps     which wizard step asks which field (default: one step per pick,
 *             then one for the typed fields, then "Prüfen" = step 7)
 *   items     how a search hit is displayed per pick (title, subtitle, status …)
 *   initial   prefills for typed fields
 *   messages  the sentence for an empty required field, per field
 *
 *   const flow = useEntscheidungVorbereitenFlow({
 *     steps: { vorhaben: 2, geltende_regeln: 3, zustaendiger: 4, vorgeschlagen_von: 5, entscheidungsfrage: 6, situationstyp: 6, gesicherte_fakten: 6, offene_annahmen: 6, fehlende_informationen: 6, frist: 6, bezeichnung: 6, beschreibung: 6, konsequenzen: 6, risiken: 6, aufwand: 6, empfehlungsgrad: 6, herkunft: 6 },
 *     items: { vorhaben: r => ({ id: r.id, title: fieldText(r, 'titel') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.vorhaben.select} {...flow.pick('vorhaben')} />
 *     <EntitySelectStep {...flow.picks.geltende_regeln.select} {...flow.pickMany('geltende_regeln')} />
 *     <EntitySelectStep {...flow.picks.zustaendiger.select} {...flow.pick('zustaendiger')} />
 *     <EntitySelectStep {...flow.picks.vorgeschlagen_von.select} {...flow.pick('vorgeschlagen_von')} />
 *     // the record this flow changes: <EntitySelectStep {...flow.picks.vorhaben.select} {...flow.pick('vorhaben')} />
 *     <Bound form={flow.forms.entscheidungen} name="entscheidungsfrage" />
 *     <Bound form={flow.forms.entscheidungen} name="situationstyp" />
 *     <Bound form={flow.forms.entscheidungen} name="gesicherte_fakten" />
 *     <Bound form={flow.forms.entscheidungen} name="offene_annahmen" />
 *     <Bound form={flow.forms.entscheidungen} name="fehlende_informationen" />
 *     <Bound form={flow.forms.entscheidungen} name="frist" />
 *     <Bound form={flow.forms.alternativen} name="bezeichnung" />
 *     <Bound form={flow.forms.alternativen} name="beschreibung" />
 *     <Bound form={flow.forms.alternativen} name="konsequenzen" />
 *     <Bound form={flow.forms.alternativen} name="risiken" />
 *     <Bound form={flow.forms.alternativen} name="aufwand" />
 *     <Bound form={flow.forms.alternativen} name="empfehlungsgrad" />
 *     <Bound form={flow.forms.alternativen} name="herkunft" />
 *     <StepNav onNext={() => flow.validateStep(n)} />
 *     {!flow.submit.done && <SummaryStep forms={flow.formList} submit={flow.submit} />}
 *     {flow.submit.result && <SuccessStep result={flow.submit.result} forms={flow.formList} submit={flow.submit} />}
 *   </IntentWizardShell>
 */
import { useState } from 'react';
import {
  useStepForm, useJourneySubmit, useRecordSearch,
  fieldText, fieldLookup, fieldLookups, fieldNumber, fieldDate, fieldRef,
  todayIso, nowIso, isEmptyValue, policyFixedValue, withPickPolicy, usePolicyVersion,
  type StepForm, type JourneyRecord, type RefContext, type SelectItemLike, type FormValues, type PlanStep, type SummaryItem,} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { pickHint, whereSentence, type PickWhere } from '@/lib/journey/policy';
import { labelOf, optionsOf, type EntityKey } from '@/lib/journey/rules';
import { entityLabel } from '@/lib/journey/rules';
export type EntscheidungVorbereitenFieldKey = 'aufwand' | 'beschreibung' | 'bezeichnung' | 'empfehlungsgrad' | 'entscheidungsfrage' | 'fehlende_informationen' | 'frist' | 'geltende_regeln' | 'gesicherte_fakten' | 'herkunft' | 'konsequenzen' | 'offene_annahmen' | 'risiken' | 'situationstyp' | 'vorgeschlagen_von' | 'vorhaben' | 'zustaendiger';

export interface EntscheidungVorbereitenForms {
  entscheidungen: StepForm<'entscheidungen'>;
  alternativen: StepForm<'alternativen'>;
  vorhaben: StepForm<'vorhaben'>;
}

// Alias so the option generics stay readable.
type Key = EntscheidungVorbereitenFieldKey;

export interface EntscheidungVorbereitenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    vorhaben?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    geltende_regeln?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    zustaendiger?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    vorgeschlagen_von?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"aufwand": 6, "beschreibung": 6, "bezeichnung": 6, "empfehlungsgrad": 6, "entscheidungsfrage": 6, "fehlende_informationen": 6, "frist": 6, "geltende_regeln": 3, "gesicherte_fakten": 6, "herkunft": 6, "konsequenzen": 6, "offene_annahmen": 6, "risiken": 6, "situationstyp": 6, "vorgeschlagen_von": 5, "vorhaben": 2, "zustaendiger": 4};
export const ENTSCHEIDUNGVORBEREITEN_REVIEW_STEP = 7;

function fromPick<T>(pick: { recordOf(id: string): JourneyRecord | undefined }, form: StepForm, field: string, read: (r: JourneyRecord) => T): T | undefined {
  const id = form.get(field);
  const rec = typeof id === 'string' && id ? pick.recordOf(id) : undefined;
  return rec ? read(rec) : undefined;
}
function isoDaysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Returns T, not Partial<T>: a Record's index signature is already "maybe
// absent", and Partial<Record<string, string>> does not assign to the
// Record<string, string> useStepForm wants (tsc, live 23.09.2026 — eight
// errors, one per hook, caught only in the sandbox build).
function only<T extends Record<string, unknown>>(obj: T | undefined, keys: string[]): T | undefined {
  if (!obj) return undefined;
  const out: Record<string, unknown> = {};
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out as T;
}

function hasValues(form: StepForm): boolean {
  return form.keys.some(k => !isEmptyValue(form.values[k]));
}

export function useEntscheidungVorbereitenFlow(options: EntscheidungVorbereitenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const [vorhabenTargetId, setVorhabenTargetId] = useState<string | null>(null);
  const entscheidungen = useStepForm('entscheidungen', {
    fields: ["vorhaben", "entscheidungsfrage", "situationstyp", "gesicherte_fakten", "offene_annahmen", "fehlende_informationen", "geltende_regeln", "zustaendiger", "frist"],
    steps: only(steps, ["vorhaben", "entscheidungsfrage", "situationstyp", "gesicherte_fakten", "offene_annahmen", "fehlende_informationen", "geltende_regeln", "zustaendiger", "frist"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["vorhaben", "entscheidungsfrage", "situationstyp", "gesicherte_fakten", "offene_annahmen", "fehlende_informationen", "geltende_regeln", "zustaendiger", "frist"]),
    messages: only(options.messages as Record<string, string> | undefined, ["vorhaben", "entscheidungsfrage", "situationstyp", "gesicherte_fakten", "offene_annahmen", "fehlende_informationen", "geltende_regeln", "zustaendiger", "frist"]),
  });
  const alternativen = useStepForm('alternativen', {
    fields: ["bezeichnung", "beschreibung", "konsequenzen", "risiken", "aufwand", "empfehlungsgrad", "herkunft", "vorgeschlagen_von"],
    steps: only(steps, ["bezeichnung", "beschreibung", "konsequenzen", "risiken", "aufwand", "empfehlungsgrad", "herkunft", "vorgeschlagen_von"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["bezeichnung", "beschreibung", "konsequenzen", "risiken", "aufwand", "empfehlungsgrad", "herkunft", "vorgeschlagen_von"]),
    messages: only(options.messages as Record<string, string> | undefined, ["bezeichnung", "beschreibung", "konsequenzen", "risiken", "aufwand", "empfehlungsgrad", "herkunft", "vorgeschlagen_von"]),
  });
  const vorhaben = useStepForm('vorhaben', {
    fields: [],
    steps: only(steps, []) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, []),
    messages: only(options.messages as Record<string, string> | undefined, []),
  });
  const forms: EntscheidungVorbereitenForms = { entscheidungen, alternativen, vorhaben };
  const formList: StepForm[] = [entscheidungen, alternativen, vorhaben];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    vorhaben: useRecordSearch(servicePort, 'vorhaben', withPickPolicy('vorhaben', {
      searchFields: ["titel"] as never,
      filter: "r.v_arbeitszustand != 'abgeschlossen'",
      where: (r: JourneyRecord) => (fieldLookup(r, "arbeitszustand")?.key ?? null) !== "abgeschlossen",
      toItem: options.items?.vorhaben as never,
    })),
    geltende_regeln: useRecordSearch(servicePort, 'regeln_und_berechtigungen', withPickPolicy('geltende_regeln', {
      searchFields: ["bezeichnung", "geltungsbereich"] as never,
      filter: "r.v_status == 'gueltig'",
      where: (r: JourneyRecord) => (fieldLookup(r, "status")?.key ?? null) === "gueltig",
      toItem: options.items?.geltende_regeln as never,
    })),
    zustaendiger: useRecordSearch(servicePort, 'nutzer', withPickPolicy('zustaendiger', {
      searchFields: ["nutzer_firstname", "nutzer_lastname"] as never,
      filter: "r.v_aktiv == True",
      where: (r: JourneyRecord) => r.fields["aktiv"] === true,
      toItem: options.items?.zustaendiger as never,
    })),
    vorgeschlagen_von: useRecordSearch(servicePort, 'nutzer', withPickPolicy('vorgeschlagen_von', {
      searchFields: ["nutzer_firstname", "nutzer_lastname"] as never,
      filter: "r.v_aktiv == True",
      where: (r: JourneyRecord) => r.fields["aktiv"] === true,
      toItem: options.items?.vorgeschlagen_von as never,
    })),
  };
  // Whether a pick offers „Neu anlegen“ is the plan's call: off for the record
  // this flow changes, for multi picks, for a catalogue entity and for an
  // entity with its own flow. The page spreads `.select` and writes no `create=`.
  // what the person sees under the search field: the rule that narrows the
  // pick (the owner's, else the plan's) — and the link that changes it
  const hintFor = (key: string, entity: EntityKey, planned: PickWhere | null) => pickHint(key, planned,
    w => whereSentence(w, f => labelOf(entity, f), (f, v) => optionsOf(entity, f).find(o => o.key === String(v))?.label ?? String(v)),
    `#/verwaltung/anwendung?line=intent:entscheidung-vorbereiten:read:${entity}`);
  // a fixed value the flow sets itself, as a review row with the link that changes it
  const setting = (entity: EntityKey, field: string, value: unknown): SummaryItem => ({
    key: `setting:${entity}.${field}`, label: labelOf(entity, field),
    value: optionsOf(entity, field).find(o => o.key === String(value))?.label ?? String(value ?? ''),
    href: `#/verwaltung/anwendung?line=intent:entscheidung-vorbereiten:write:${entity}.${field}`,
  });
  const picks = {
    vorhaben: { ...searches.vorhaben, select: { ...searches.vorhaben.select, create: true as boolean, hint: hintFor('vorhaben', 'vorhaben', {"conditions": [{"field": "arbeitszustand", "op": "ne", "value": "abgeschlossen"}], "mode": "all"} as PickWhere | null) } },
    geltende_regeln: { ...searches.geltende_regeln, select: { ...searches.geltende_regeln.select, create: false as boolean, hint: hintFor('geltende_regeln', 'regeln_und_berechtigungen', {"conditions": [{"field": "status", "op": "eq", "value": "gueltig"}], "mode": "all"} as PickWhere | null) } },
    zustaendiger: { ...searches.zustaendiger, select: { ...searches.zustaendiger.select, create: false as boolean, hint: hintFor('zustaendiger', 'nutzer', {"conditions": [{"field": "aktiv", "op": "eq", "value": "true"}], "mode": "all"} as PickWhere | null) } },
    vorgeschlagen_von: { ...searches.vorgeschlagen_von, select: { ...searches.vorgeschlagen_von.select, create: false as boolean, hint: hintFor('vorgeschlagen_von', 'nutzer', {"conditions": [{"field": "aktiv", "op": "eq", "value": "true"}], "mode": "all"} as PickWhere | null) } },
  };

  const plan: PlanStep[] = [
    {
      key: 'entscheidungen', entity: 'entscheidungen', form: entscheidungen,
      values: (): FormValues => ({
        status: policyFixedValue('entscheidungen', 'status') ?? "vorbereitet",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('entscheidungen', 'status', policyFixedValue('entscheidungen', 'status') ?? "vorbereitet")],
    },
    {
      key: 'alternativen', entity: 'alternativen', form: alternativen, primary: true,      needs: ['entscheidungen'],
      link: { entscheidung: 'entscheidungen' },
    },
    {
      key: 'vorhaben', entity: 'vorhaben', form: vorhaben,
      updates: () => vorhabenTargetId ?? undefined,
      // the review names the record this step changes; "Ändern" leads back to its pick
      target: () => vorhabenTargetId
        ? { key: 'target:vorhaben', label: entityLabel('vorhaben'), value: picks.vorhaben.labelOf(vorhabenTargetId) ?? vorhabenTargetId, step: steps.vorhaben }
        : undefined,
      values: (): FormValues => ({
        arbeitszustand: policyFixedValue('vorhaben', 'arbeitszustand') ?? "wartet_auf_entscheidung",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('vorhaben', 'arbeitszustand', policyFixedValue('vorhaben', 'arbeitszustand') ?? "wartet_auf_entscheidung")],
    },
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'entscheidung-vorbereiten' });

  /** The record(s) this flow CHANGES: picked through {...flow.picks.<entity>.select} {...flow.pick('<entity>')};
   *  picking prefills the form with the record's current values, and the plan step updates that record. */
  const targets = {
    vorhaben: {
      selectedId: vorhabenTargetId,
      onSelect: (id: string) => {
        setVorhabenTargetId(id);
        const rec = picks.vorhaben.recordOf(id);
        if (rec) vorhaben.reset({ });
      },
      get record(): JourneyRecord | undefined { return vorhabenTargetId ? picks.vorhaben.recordOf(vorhabenTargetId) : undefined; },
    },
  };
  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: EntscheidungVorbereitenFieldKey) => {
    if (field in targets) {
      const t = targets[field as keyof typeof targets];
      return { selectedId: t.selectedId, onSelect: t.onSelect };
    }
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return {
      selectedId: (typeof owner.get(field) === 'string' ? (owner.get(field) as string) : null) || null,
      // `field as never` collapsed the conditional SetArgs<E, never> to never and
      // no argument was assignable any more (tsc, live 23.09.2026); widen `set`
      // itself instead — the label stays a required third argument.
      onSelect: (id: string) => (owner.set as (k: string, v: unknown, l?: string) => void)(field, id, search?.labelOf(id)),
    };
  };
  /** Props for a multi-record pick step: {...flow.picks.x.select} {...flow.pickMany('x')} */
  const pickMany = (field: EntscheidungVorbereitenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)))    && Object.entries(targets).every(([k, t]) => steps[k] !== n || !!t.selectedId);
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); setVorhabenTargetId(null); };

  return {
    slug: 'entscheidung-vorbereiten' as const,
    draftKey: 'entscheidung-vorbereiten' as const,
    entity: 'alternativen' as const,
    form: alternativen,
    forms, formList, picks, submit, steps, targets,    reviewStep: ENTSCHEIDUNGVORBEREITEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type EntscheidungVorbereitenFlow = ReturnType<typeof useEntscheidungVorbereitenFlow>;
