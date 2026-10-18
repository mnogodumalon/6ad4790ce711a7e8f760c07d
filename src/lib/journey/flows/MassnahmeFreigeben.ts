/**
 * useMassnahmeFreigebenFlow — the plumbing of the flow « Maßnahme freigeben », generated from the plan.
 *
 * Changes `massnahmen`: the record to change is picked (`flow.pick('massnahmen')`), the form is prefilled with its values; asks `status`, `freigegeben_von`; sets `freigabedatum` itself.
 * The hook OWNS: the form(s) with exactly these fields and the plan's required
 * ingredients, one record search per picked field (columns and filter from
 * the plan), and the submit plan with its fixed and derived values. A page
 * that only calls `flow.submit.run()` cannot write a field the plan does not
 * know — there is no way to spell it.
 *
 * YOU decide what a person notices, through the options:
 *   steps     which wizard step asks which field (default: one step per pick,
 *             then one for the typed fields, then "Prüfen" = step 4)
 *   items     how a search hit is displayed per pick (title, subtitle, status …)
 *   initial   prefills for typed fields
 *   messages  the sentence for an empty required field, per field
 *
 *   const flow = useMassnahmeFreigebenFlow({
 *     steps: { massnahmen: 1, freigegeben_von: 2, status: 3 },
 *     items: { freigegeben_von: r => ({ id: r.id, title: fieldText(r, 'nutzer_firstname') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.freigegeben_von.select} {...flow.pick('freigegeben_von')} />
 *     // the record this flow changes: <EntitySelectStep {...flow.picks.massnahmen.select} {...flow.pick('massnahmen')} />
 *     <Bound form={flow.forms.massnahmen} name="status" />
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
  type StepForm, type JourneyRecord, type RefContext, type SelectItemLike, type FormValues, type PlanStep,} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { pickHint, whereSentence, type PickWhere } from '@/lib/journey/policy';
import { labelOf, optionsOf, type EntityKey } from '@/lib/journey/rules';
import { entityLabel } from '@/lib/journey/rules';
export type MassnahmeFreigebenFieldKey = 'freigegeben_von' | 'massnahmen' | 'status';

export interface MassnahmeFreigebenForms {
  massnahmen: StepForm<'massnahmen'>;
}

// Alias so the option generics stay readable.
type Key = MassnahmeFreigebenFieldKey;

export interface MassnahmeFreigebenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    freigegeben_von?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    massnahmen?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"freigegeben_von": 2, "massnahmen": 1, "status": 3};
export const MASSNAHMEFREIGEBEN_REVIEW_STEP = 4;

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

export function useMassnahmeFreigebenFlow(options: MassnahmeFreigebenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const [massnahmenTargetId, setMassnahmenTargetId] = useState<string | null>(null);
  const massnahmen = useStepForm('massnahmen', {
    fields: ["status", "freigegeben_von"],
    steps: only(steps, ["status", "freigegeben_von"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["status", "freigegeben_von"]),
    messages: only(options.messages as Record<string, string> | undefined, ["status", "freigegeben_von"]),
  });
  const forms: MassnahmeFreigebenForms = { massnahmen };
  const formList: StepForm[] = [massnahmen];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    freigegeben_von: useRecordSearch(servicePort, 'nutzer', withPickPolicy('freigegeben_von', {
      searchFields: ["nutzer_firstname", "nutzer_lastname"] as never,
      filter: "r.v_art == 'mensch'",
      where: (r: JourneyRecord) => (fieldLookup(r, "art")?.key ?? null) === "mensch",
      toItem: options.items?.freigegeben_von as never,
    })),
    massnahmen: useRecordSearch(servicePort, 'massnahmen', withPickPolicy('massnahmen', {
      searchFields: ["beschreibung"] as never,
      filter: "r.v_status == 'vorgeschlagen'",
      where: (r: JourneyRecord) => (fieldLookup(r, "status")?.key ?? null) === "vorgeschlagen",
      toItem: options.items?.massnahmen as never,
    })),
  };
  // Whether a pick offers „Neu anlegen“ is the plan's call: off for the record
  // this flow changes, for multi picks, for a catalogue entity and for an
  // entity with its own flow. The page spreads `.select` and writes no `create=`.
  // what the person sees under the search field: the rule that narrows the
  // pick (the owner's, else the plan's) — and the link that changes it
  const hintFor = (key: string, entity: EntityKey, planned: PickWhere | null) => pickHint(key, planned,
    w => whereSentence(w, f => labelOf(entity, f), (f, v) => optionsOf(entity, f).find(o => o.key === String(v))?.label ?? String(v)),
    `#/verwaltung/anwendung?line=intent:massnahme-freigeben:read:${entity}`);
  const picks = {
    freigegeben_von: { ...searches.freigegeben_von, select: { ...searches.freigegeben_von.select, create: false as boolean, hint: hintFor('freigegeben_von', 'nutzer', {"conditions": [{"field": "art", "op": "eq", "value": "mensch"}], "mode": "all"} as PickWhere | null) } },
    massnahmen: { ...searches.massnahmen, select: { ...searches.massnahmen.select, create: false as boolean, hint: hintFor('massnahmen', 'massnahmen', {"conditions": [{"field": "status", "op": "eq", "value": "vorgeschlagen"}], "mode": "all"} as PickWhere | null) } },
  };

  const plan: PlanStep[] = [
    {
      key: 'massnahmen', entity: 'massnahmen', form: massnahmen, primary: true,
      updates: () => massnahmenTargetId ?? undefined,
      // the review names the record this step changes; "Ändern" leads back to its pick
      target: () => massnahmenTargetId
        ? { key: 'target:massnahmen', label: entityLabel('massnahmen'), value: picks.massnahmen.labelOf(massnahmenTargetId) ?? massnahmenTargetId, step: steps.massnahmen }
        : undefined,
      values: (): FormValues => ({
        freigabedatum: policyFixedValue('massnahmen', 'freigabedatum') ?? nowIso(),
      }),
    },
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'massnahme-freigeben' });

  /** The record(s) this flow CHANGES: picked through {...flow.picks.<entity>.select} {...flow.pick('<entity>')};
   *  picking prefills the form with the record's current values, and the plan step updates that record. */
  const targets = {
    massnahmen: {
      selectedId: massnahmenTargetId,
      onSelect: (id: string) => {
        setMassnahmenTargetId(id);
        const rec = picks.massnahmen.recordOf(id);
        if (rec) massnahmen.reset({ status: fieldLookup(rec, "status")?.key, freigegeben_von: fieldRef(rec, "freigegeben_von"), });
      },
      get record(): JourneyRecord | undefined { return massnahmenTargetId ? picks.massnahmen.recordOf(massnahmenTargetId) : undefined; },
    },
  };
  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: MassnahmeFreigebenFieldKey) => {
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
  const pickMany = (field: MassnahmeFreigebenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)))    && Object.entries(targets).every(([k, t]) => steps[k] !== n || !!t.selectedId);
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); setMassnahmenTargetId(null); };

  return {
    slug: 'massnahme-freigeben' as const,
    draftKey: 'massnahme-freigeben' as const,
    entity: 'massnahmen' as const,
    form: massnahmen,
    forms, formList, picks, submit, steps, targets,    reviewStep: MASSNAHMEFREIGEBEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type MassnahmeFreigebenFlow = ReturnType<typeof useMassnahmeFreigebenFlow>;
