/**
 * useMassnahmeAbschliessenFlow — the plumbing of the flow « Maßnahme umsetzen und Ergebnis erfassen », generated from the plan.
 *
 * Changes `massnahmen`: the record to change is picked (`flow.pick('massnahmen')`), the form is prefilled with its values; asks `zustandsaenderung`, `umsetzungsdatum`, `tatsaechliches_ergebnis`, `abweichung`; sets `status` itself.
Changes `vorhaben` (only when the person fills it): the record to change is picked (`flow.pick('vorhaben')`), the form is prefilled with its values; ; sets `arbeitszustand` itself.
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
 *   const flow = useMassnahmeAbschliessenFlow({
 *     steps: { massnahmen: 1, vorhaben: 2, zustandsaenderung: 3, umsetzungsdatum: 3, tatsaechliches_ergebnis: 3, abweichung: 3 },
 *     items: { massnahmen: r => ({ id: r.id, title: fieldText(r, 'beschreibung') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     // the record this flow changes: <EntitySelectStep {...flow.picks.massnahmen.select} {...flow.pick('massnahmen')} />
 *     // the record this flow changes: <EntitySelectStep {...flow.picks.vorhaben.select} {...flow.pick('vorhaben')} />
 *     <Bound form={flow.forms.massnahmen} name="zustandsaenderung" />
 *     <Bound form={flow.forms.massnahmen} name="umsetzungsdatum" />
 *     <Bound form={flow.forms.massnahmen} name="tatsaechliches_ergebnis" />
 *     <Bound form={flow.forms.massnahmen} name="abweichung" />
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
export type MassnahmeAbschliessenFieldKey = 'abweichung' | 'massnahmen' | 'tatsaechliches_ergebnis' | 'umsetzungsdatum' | 'vorhaben' | 'zustandsaenderung';

export interface MassnahmeAbschliessenForms {
  massnahmen: StepForm<'massnahmen'>;
  vorhaben: StepForm<'vorhaben'>;
}

// Alias so the option generics stay readable.
type Key = MassnahmeAbschliessenFieldKey;

export interface MassnahmeAbschliessenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    massnahmen?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    vorhaben?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"abweichung": 3, "massnahmen": 1, "tatsaechliches_ergebnis": 3, "umsetzungsdatum": 3, "vorhaben": 2, "zustandsaenderung": 3};
export const MASSNAHMEABSCHLIESSEN_REVIEW_STEP = 4;

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

export function useMassnahmeAbschliessenFlow(options: MassnahmeAbschliessenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const [massnahmenTargetId, setMassnahmenTargetId] = useState<string | null>(null);
  const [vorhabenTargetId, setVorhabenTargetId] = useState<string | null>(null);
  const massnahmen = useStepForm('massnahmen', {
    fields: ["zustandsaenderung", "umsetzungsdatum", "tatsaechliches_ergebnis", "abweichung"],
    steps: only(steps, ["zustandsaenderung", "umsetzungsdatum", "tatsaechliches_ergebnis", "abweichung"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["zustandsaenderung", "umsetzungsdatum", "tatsaechliches_ergebnis", "abweichung"]),
    messages: only(options.messages as Record<string, string> | undefined, ["zustandsaenderung", "umsetzungsdatum", "tatsaechliches_ergebnis", "abweichung"]),
  });
  const vorhaben = useStepForm('vorhaben', {
    fields: [],
    steps: only(steps, []) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, []),
    messages: only(options.messages as Record<string, string> | undefined, []),
  });
  const forms: MassnahmeAbschliessenForms = { massnahmen, vorhaben };
  const formList: StepForm[] = [massnahmen, vorhaben];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    massnahmen: useRecordSearch(servicePort, 'massnahmen', withPickPolicy('massnahmen', {
      searchFields: ["beschreibung"] as never,
      filter: "r.v_status in ['freigegeben', 'in_umsetzung']",
      where: (r: JourneyRecord) => ["freigegeben", "in_umsetzung"].includes(fieldLookup(r, "status")?.key ?? ''),
      toItem: options.items?.massnahmen as never,
    })),
    vorhaben: useRecordSearch(servicePort, 'vorhaben', withPickPolicy('vorhaben', {
      searchFields: ["titel"] as never,
      toItem: options.items?.vorhaben as never,
    })),
  };
  // Whether a pick offers „Neu anlegen“ is the plan's call: off for the record
  // this flow changes, for multi picks, for a catalogue entity and for an
  // entity with its own flow. The page spreads `.select` and writes no `create=`.
  // what the person sees under the search field: the rule that narrows the
  // pick (the owner's, else the plan's) — and the link that changes it
  const hintFor = (key: string, entity: EntityKey, planned: PickWhere | null) => pickHint(key, planned,
    w => whereSentence(w, f => labelOf(entity, f), (f, v) => optionsOf(entity, f).find(o => o.key === String(v))?.label ?? String(v)),
    `#/verwaltung/anwendung?line=intent:massnahme-abschliessen:read:${entity}`);
  // a fixed value the flow sets itself, as a review row with the link that changes it
  const setting = (entity: EntityKey, field: string, value: unknown): SummaryItem => ({
    key: `setting:${entity}.${field}`, label: labelOf(entity, field),
    value: optionsOf(entity, field).find(o => o.key === String(value))?.label ?? String(value ?? ''),
    href: `#/verwaltung/anwendung?line=intent:massnahme-abschliessen:write:${entity}.${field}`,
  });
  const picks = {
    massnahmen: { ...searches.massnahmen, select: { ...searches.massnahmen.select, create: false as boolean, hint: hintFor('massnahmen', 'massnahmen', {"conditions": [{"field": "status", "op": "in", "value": ["freigegeben", "in_umsetzung"]}], "mode": "all"} as PickWhere | null) } },
    vorhaben: { ...searches.vorhaben, select: { ...searches.vorhaben.select, create: false as boolean, hint: hintFor('vorhaben', 'vorhaben', null as PickWhere | null) } },
  };

  const vorhabenFilled = hasValues(vorhaben);
  const plan: PlanStep[] = [
    {
      key: 'massnahmen', entity: 'massnahmen', form: massnahmen,
      updates: () => massnahmenTargetId ?? undefined,
      // the review names the record this step changes; "Ändern" leads back to its pick
      target: () => massnahmenTargetId
        ? { key: 'target:massnahmen', label: entityLabel('massnahmen'), value: picks.massnahmen.labelOf(massnahmenTargetId) ?? massnahmenTargetId, step: steps.massnahmen }
        : undefined,
      values: (): FormValues => ({
        status: policyFixedValue('massnahmen', 'status') ?? "erledigt",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('massnahmen', 'status', policyFixedValue('massnahmen', 'status') ?? "erledigt")],
    },
    ...(vorhabenFilled ? [{
      key: 'vorhaben', entity: 'vorhaben', form: vorhaben, primary: true,
      updates: () => vorhabenTargetId ?? undefined,
      // the review names the record this step changes; "Ändern" leads back to its pick
      target: () => vorhabenTargetId
        ? { key: 'target:vorhaben', label: entityLabel('vorhaben'), value: picks.vorhaben.labelOf(vorhabenTargetId) ?? vorhabenTargetId, step: steps.vorhaben }
        : undefined,
      values: (): FormValues => ({
        arbeitszustand: policyFixedValue('vorhaben', 'arbeitszustand') ?? "wirkung_pruefen",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('vorhaben', 'arbeitszustand', policyFixedValue('vorhaben', 'arbeitszustand') ?? "wirkung_pruefen")],
    } as PlanStep] : []),
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'massnahme-abschliessen' });

  /** The record(s) this flow CHANGES: picked through {...flow.picks.<entity>.select} {...flow.pick('<entity>')};
   *  picking prefills the form with the record's current values, and the plan step updates that record. */
  const targets = {
    massnahmen: {
      selectedId: massnahmenTargetId,
      onSelect: (id: string) => {
        setMassnahmenTargetId(id);
        const rec = picks.massnahmen.recordOf(id);
        if (rec) massnahmen.reset({ zustandsaenderung: fieldText(rec, "zustandsaenderung"), umsetzungsdatum: fieldDate(rec, "umsetzungsdatum"), tatsaechliches_ergebnis: fieldText(rec, "tatsaechliches_ergebnis"), abweichung: fieldText(rec, "abweichung"), });
      },
      get record(): JourneyRecord | undefined { return massnahmenTargetId ? picks.massnahmen.recordOf(massnahmenTargetId) : undefined; },
    },
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
  const pick = (field: MassnahmeAbschliessenFieldKey) => {
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
  const pickMany = (field: MassnahmeAbschliessenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)))    && Object.entries(targets).every(([k, t]) => steps[k] !== n || !!t.selectedId);
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); setMassnahmenTargetId(null); setVorhabenTargetId(null); };

  return {
    slug: 'massnahme-abschliessen' as const,
    draftKey: 'massnahme-abschliessen' as const,
    entity: 'vorhaben' as const,
    form: vorhaben,
    forms, formList, picks, submit, steps, targets,    reviewStep: MASSNAHMEABSCHLIESSEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type MassnahmeAbschliessenFlow = ReturnType<typeof useMassnahmeAbschliessenFlow>;
