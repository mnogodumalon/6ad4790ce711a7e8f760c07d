/**
 * useEntscheidungTreffenFlow — the plumbing of the flow « Entscheidung treffen », generated from the plan.
 *
 * Changes `entscheidungen`: the record to change is picked (`flow.pick('entscheidungen')`), the form is prefilled with its values; asks `gewaehlte_option`, `begruendung`, `erwartetes_ergebnis`, `umsetzungsplan`; sets `entscheidungsdatum` itself.
Writes `massnahmen` (only when the person fills it): asks `entscheidung`, `vorhaben`, `beschreibung`, `herkunft`, `vorgeschlagen_von`; sets `status` itself.
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
 *   const flow = useEntscheidungTreffenFlow({
 *     steps: { entscheidungen: 1, gewaehlte_option: 2, entscheidung: 3, vorhaben: 4, vorgeschlagen_von: 5, begruendung: 6, erwartetes_ergebnis: 6, umsetzungsplan: 6, beschreibung: 6, herkunft: 6 },
 *     items: { gewaehlte_option: r => ({ id: r.id, title: fieldText(r, 'bezeichnung') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.gewaehlte_option.select} {...flow.pick('gewaehlte_option')} />
 *     // the record this flow changes: <EntitySelectStep {...flow.picks.entscheidungen.select} {...flow.pick('entscheidungen')} />
 *     <EntitySelectStep {...flow.picks.entscheidung.select} {...flow.pick('entscheidung')} />
 *     <EntitySelectStep {...flow.picks.vorhaben.select} {...flow.pick('vorhaben')} />
 *     <EntitySelectStep {...flow.picks.vorgeschlagen_von.select} {...flow.pick('vorgeschlagen_von')} />
 *     <Bound form={flow.forms.entscheidungen} name="begruendung" />
 *     <Bound form={flow.forms.entscheidungen} name="erwartetes_ergebnis" />
 *     <Bound form={flow.forms.entscheidungen} name="umsetzungsplan" />
 *     <Bound form={flow.forms.massnahmen} name="beschreibung" />
 *     <Bound form={flow.forms.massnahmen} name="herkunft" />
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
export type EntscheidungTreffenFieldKey = 'begruendung' | 'beschreibung' | 'entscheidung' | 'entscheidungen' | 'erwartetes_ergebnis' | 'gewaehlte_option' | 'herkunft' | 'umsetzungsplan' | 'vorgeschlagen_von' | 'vorhaben';

export interface EntscheidungTreffenForms {
  entscheidungen: StepForm<'entscheidungen'>;
  massnahmen: StepForm<'massnahmen'>;
}

// Alias so the option generics stay readable.
type Key = EntscheidungTreffenFieldKey;

export interface EntscheidungTreffenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    gewaehlte_option?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    entscheidungen?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    entscheidung?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    vorhaben?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    vorgeschlagen_von?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"begruendung": 6, "beschreibung": 6, "entscheidung": 3, "entscheidungen": 1, "erwartetes_ergebnis": 6, "gewaehlte_option": 2, "herkunft": 6, "umsetzungsplan": 6, "vorgeschlagen_von": 5, "vorhaben": 4};
export const ENTSCHEIDUNGTREFFEN_REVIEW_STEP = 7;

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

export function useEntscheidungTreffenFlow(options: EntscheidungTreffenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const [entscheidungenTargetId, setEntscheidungenTargetId] = useState<string | null>(null);
  const entscheidungen = useStepForm('entscheidungen', {
    fields: ["gewaehlte_option", "begruendung", "erwartetes_ergebnis", "umsetzungsplan"],
    steps: only(steps, ["gewaehlte_option", "begruendung", "erwartetes_ergebnis", "umsetzungsplan"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["gewaehlte_option", "begruendung", "erwartetes_ergebnis", "umsetzungsplan"]),
    messages: only(options.messages as Record<string, string> | undefined, ["gewaehlte_option", "begruendung", "erwartetes_ergebnis", "umsetzungsplan"]),
  });
  const massnahmen = useStepForm('massnahmen', {
    fields: ["entscheidung", "vorhaben", "beschreibung", "herkunft", "vorgeschlagen_von"],
    steps: only(steps, ["entscheidung", "vorhaben", "beschreibung", "herkunft", "vorgeschlagen_von"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["entscheidung", "vorhaben", "beschreibung", "herkunft", "vorgeschlagen_von"]),
    messages: only(options.messages as Record<string, string> | undefined, ["entscheidung", "vorhaben", "beschreibung", "herkunft", "vorgeschlagen_von"]),
  });
  const forms: EntscheidungTreffenForms = { entscheidungen, massnahmen };
  const formList: StepForm[] = [entscheidungen, massnahmen];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    gewaehlte_option: useRecordSearch(servicePort, 'alternativen', withPickPolicy('gewaehlte_option', {
      searchFields: ["bezeichnung", "konsequenzen", "risiken", "aufwand"] as never,
      toItem: options.items?.gewaehlte_option as never,
    })),
    entscheidungen: useRecordSearch(servicePort, 'entscheidungen', withPickPolicy('entscheidungen', {
      searchFields: ["entscheidungsfrage", "gesicherte_fakten", "offene_annahmen"] as never,
      filter: "r.v_status in ['vorbereitet', 'in_pruefung']",
      where: (r: JourneyRecord) => ["vorbereitet", "in_pruefung"].includes(fieldLookup(r, "status")?.key ?? ''),
      toItem: options.items?.entscheidungen as never,
    })),
    entscheidung: useRecordSearch(servicePort, 'entscheidungen', withPickPolicy('entscheidung', {
      searchFields: ["entscheidungsfrage", "gesicherte_fakten", "offene_annahmen"] as never,
      filter: "r.v_status in ['vorbereitet', 'in_pruefung']",
      where: (r: JourneyRecord) => ["vorbereitet", "in_pruefung"].includes(fieldLookup(r, "status")?.key ?? ''),
      toItem: options.items?.entscheidung as never,
    })),
    vorhaben: useRecordSearch(servicePort, 'vorhaben', withPickPolicy('vorhaben', {
      searchFields: ["titel"] as never,
      toItem: options.items?.vorhaben as never,
    })),
    vorgeschlagen_von: useRecordSearch(servicePort, 'nutzer', withPickPolicy('vorgeschlagen_von', {
      searchFields: ["nutzer_firstname"] as never,
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
    `#/verwaltung/anwendung?line=intent:entscheidung-treffen:read:${entity}`);
  // a fixed value the flow sets itself, as a review row with the link that changes it
  const setting = (entity: EntityKey, field: string, value: unknown): SummaryItem => ({
    key: `setting:${entity}.${field}`, label: labelOf(entity, field),
    value: optionsOf(entity, field).find(o => o.key === String(value))?.label ?? String(value ?? ''),
    href: `#/verwaltung/anwendung?line=intent:entscheidung-treffen:write:${entity}.${field}`,
  });
  const picks = {
    gewaehlte_option: { ...searches.gewaehlte_option, select: { ...searches.gewaehlte_option.select, create: false as boolean, hint: hintFor('gewaehlte_option', 'alternativen', null as PickWhere | null) } },
    entscheidungen: { ...searches.entscheidungen, select: { ...searches.entscheidungen.select, create: false as boolean, hint: hintFor('entscheidungen', 'entscheidungen', {"conditions": [{"field": "status", "op": "in", "value": ["vorbereitet", "in_pruefung"]}], "mode": "all"} as PickWhere | null) } },
    entscheidung: { ...searches.entscheidung, select: { ...searches.entscheidung.select, create: false as boolean, hint: hintFor('entscheidung', 'entscheidungen', {"conditions": [{"field": "status", "op": "in", "value": ["vorbereitet", "in_pruefung"]}], "mode": "all"} as PickWhere | null) } },
    vorhaben: { ...searches.vorhaben, select: { ...searches.vorhaben.select, create: true as boolean, hint: hintFor('vorhaben', 'vorhaben', null as PickWhere | null) } },
    vorgeschlagen_von: { ...searches.vorgeschlagen_von, select: { ...searches.vorgeschlagen_von.select, create: false as boolean, hint: hintFor('vorgeschlagen_von', 'nutzer', null as PickWhere | null) } },
  };

  const massnahmenFilled = hasValues(massnahmen);
  const plan: PlanStep[] = [
    {
      key: 'entscheidungen', entity: 'entscheidungen', form: entscheidungen,
      updates: () => entscheidungenTargetId ?? undefined,
      // the review names the record this step changes; "Ändern" leads back to its pick
      target: () => entscheidungenTargetId
        ? { key: 'target:entscheidungen', label: entityLabel('entscheidungen'), value: picks.entscheidungen.labelOf(entscheidungenTargetId) ?? entscheidungenTargetId, step: steps.entscheidungen }
        : undefined,
      values: (): FormValues => ({
        entscheidungsdatum: policyFixedValue('entscheidungen', 'entscheidungsdatum') ?? todayIso(),
      }),
    },
    ...(massnahmenFilled ? [{
      key: 'massnahmen', entity: 'massnahmen', form: massnahmen, primary: true,
      values: (): FormValues => ({
        status: policyFixedValue('massnahmen', 'status') ?? "vorgeschlagen",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('massnahmen', 'status', policyFixedValue('massnahmen', 'status') ?? "vorgeschlagen")],

      // the planner's assumptions that first act here — shown once with „Passt“ / „ändern“
      notices: () => [{"assumed": "Wartet auf Entscheidung", "id": "vorhaben-status-nach-entscheidung", "question": "Soll das Vorhaben nach der Entscheidung weiterlaufen?"}],
    } as PlanStep] : []),
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'entscheidung-treffen' });

  /** The record(s) this flow CHANGES: picked through {...flow.picks.<entity>.select} {...flow.pick('<entity>')};
   *  picking prefills the form with the record's current values, and the plan step updates that record. */
  const targets = {
    entscheidungen: {
      selectedId: entscheidungenTargetId,
      onSelect: (id: string) => {
        setEntscheidungenTargetId(id);
        const rec = picks.entscheidungen.recordOf(id);
        if (rec) entscheidungen.reset({ gewaehlte_option: fieldRef(rec, "gewaehlte_option"), begruendung: fieldText(rec, "begruendung"), erwartetes_ergebnis: fieldText(rec, "erwartetes_ergebnis"), umsetzungsplan: fieldText(rec, "umsetzungsplan"), });
      },
      get record(): JourneyRecord | undefined { return entscheidungenTargetId ? picks.entscheidungen.recordOf(entscheidungenTargetId) : undefined; },
    },
  };
  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: EntscheidungTreffenFieldKey) => {
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
  const pickMany = (field: EntscheidungTreffenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)))    && Object.entries(targets).every(([k, t]) => steps[k] !== n || !!t.selectedId);
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); setEntscheidungenTargetId(null); };

  return {
    slug: 'entscheidung-treffen' as const,
    draftKey: 'entscheidung-treffen' as const,
    entity: 'massnahmen' as const,
    form: massnahmen,
    forms, formList, picks, submit, steps, targets,    reviewStep: ENTSCHEIDUNGTREFFEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type EntscheidungTreffenFlow = ReturnType<typeof useEntscheidungTreffenFlow>;
