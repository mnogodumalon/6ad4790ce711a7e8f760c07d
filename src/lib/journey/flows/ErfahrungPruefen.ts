/**
 * useErfahrungPruefenFlow — the plumbing of the flow « Erfahrung prüfen », generated from the plan.
 *
 * Writes `lernpruefungen`: asks `erfahrung`, `pruefer`, `ergebnis`, `begruendung`, `gueltigkeitsbereich_neu`, `wiederverwendbar_fuer`, `naechste_ueberpruefung`, `belege_massnahmen`; sets `pruefdatum` itself.
Changes `erfahrungen`: the record to change is picked (`flow.pick('erfahrungen')`), the form is prefilled with its values; .
 * The hook OWNS: the form(s) with exactly these fields and the plan's required
 * ingredients, one record search per picked field (columns and filter from
 * the plan), and the submit plan with its fixed and derived values. A page
 * that only calls `flow.submit.run()` cannot write a field the plan does not
 * know — there is no way to spell it.
 *
 * YOU decide what a person notices, through the options:
 *   steps     which wizard step asks which field (default: one step per pick,
 *             then one for the typed fields, then "Prüfen" = step 6)
 *   items     how a search hit is displayed per pick (title, subtitle, status …)
 *   initial   prefills for typed fields
 *   messages  the sentence for an empty required field, per field
 *   compute   REQUIRED — the plan says these values are computed in the flow
 *             but leaves the rule to you: `status` (derived:computed:Bei Ergebnis „Bestätigt“ oder „Eingeschränkt“ auf „Geprüft“, bei „Widerlegt“ auf „Veraltet“ setzen) *
 *   const flow = useErfahrungPruefenFlow({
 *     steps: { erfahrungen: 1, erfahrung: 2, pruefer: 3, belege_massnahmen: 4, ergebnis: 5, begruendung: 5, gueltigkeitsbereich_neu: 5, wiederverwendbar_fuer: 5, naechste_ueberpruefung: 5 },
 *     items: { erfahrung: r => ({ id: r.id, title: fieldText(r, 'titel') }) },
 *     compute: { status: forms => null },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.erfahrung.select} {...flow.pick('erfahrung')} />
 *     <EntitySelectStep {...flow.picks.pruefer.select} {...flow.pick('pruefer')} />
 *     <EntitySelectStep {...flow.picks.belege_massnahmen.select} {...flow.pickMany('belege_massnahmen')} />
 *     // the record this flow changes: <EntitySelectStep {...flow.picks.erfahrungen.select} {...flow.pick('erfahrungen')} />
 *     <Bound form={flow.forms.lernpruefungen} name="ergebnis" />
 *     <Bound form={flow.forms.lernpruefungen} name="begruendung" />
 *     <Bound form={flow.forms.lernpruefungen} name="gueltigkeitsbereich_neu" />
 *     <Bound form={flow.forms.lernpruefungen} name="wiederverwendbar_fuer" />
 *     <Bound form={flow.forms.lernpruefungen} name="naechste_ueberpruefung" />
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
export type ErfahrungPruefenFieldKey = 'begruendung' | 'belege_massnahmen' | 'erfahrung' | 'erfahrungen' | 'ergebnis' | 'gueltigkeitsbereich_neu' | 'naechste_ueberpruefung' | 'pruefer' | 'wiederverwendbar_fuer';

export interface ErfahrungPruefenForms {
  lernpruefungen: StepForm<'lernpruefungen'>;
  erfahrungen: StepForm<'erfahrungen'>;
}

// Alias so the option generics stay readable.
type Key = ErfahrungPruefenFieldKey;

export interface ErfahrungPruefenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    erfahrung?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    pruefer?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    belege_massnahmen?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    erfahrungen?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
  /** The plan computes these in the flow but leaves the rule to the page. */
  compute: {
    status: (forms: ErfahrungPruefenForms) => unknown;   // derived:computed:Bei Ergebnis „Bestätigt“ oder „Eingeschränkt“ auf „Geprüft“, bei „Widerlegt“ auf „Veraltet“ setzen
  };
}

const DEFAULT_STEPS: Record<string, number> = {"begruendung": 5, "belege_massnahmen": 4, "erfahrung": 2, "erfahrungen": 1, "ergebnis": 5, "gueltigkeitsbereich_neu": 5, "naechste_ueberpruefung": 5, "pruefer": 3, "wiederverwendbar_fuer": 5};
export const ERFAHRUNGPRUEFEN_REVIEW_STEP = 6;

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

export function useErfahrungPruefenFlow(options: ErfahrungPruefenFlowOptions) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const [erfahrungenTargetId, setErfahrungenTargetId] = useState<string | null>(null);
  const lernpruefungen = useStepForm('lernpruefungen', {
    fields: ["erfahrung", "pruefer", "ergebnis", "begruendung", "gueltigkeitsbereich_neu", "wiederverwendbar_fuer", "naechste_ueberpruefung", "belege_massnahmen"],
    steps: only(steps, ["erfahrung", "pruefer", "ergebnis", "begruendung", "gueltigkeitsbereich_neu", "wiederverwendbar_fuer", "naechste_ueberpruefung", "belege_massnahmen"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["erfahrung", "pruefer", "ergebnis", "begruendung", "gueltigkeitsbereich_neu", "wiederverwendbar_fuer", "naechste_ueberpruefung", "belege_massnahmen"]),
    messages: only(options.messages as Record<string, string> | undefined, ["erfahrung", "pruefer", "ergebnis", "begruendung", "gueltigkeitsbereich_neu", "wiederverwendbar_fuer", "naechste_ueberpruefung", "belege_massnahmen"]),
  });
  const erfahrungen = useStepForm('erfahrungen', {
    fields: [],
    steps: only(steps, []) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, []),
    messages: only(options.messages as Record<string, string> | undefined, []),
  });
  const forms: ErfahrungPruefenForms = { lernpruefungen, erfahrungen };
  const formList: StepForm[] = [lernpruefungen, erfahrungen];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    erfahrung: useRecordSearch(servicePort, 'erfahrungen', withPickPolicy('erfahrung', {
      searchFields: ["titel", "situation", "erkenntnis", "gueltigkeitsbereich", "grenzen"] as never,
      filter: "r.v_status == 'entwurf'",
      where: (r: JourneyRecord) => (fieldLookup(r, "status")?.key ?? null) === "entwurf",
      toItem: options.items?.erfahrung as never,
    })),
    pruefer: useRecordSearch(servicePort, 'nutzer', withPickPolicy('pruefer', {
      searchFields: ["nutzer_firstname"] as never,
      toItem: options.items?.pruefer as never,
    })),
    belege_massnahmen: useRecordSearch(servicePort, 'massnahmen', withPickPolicy('belege_massnahmen', {
      searchFields: ["beschreibung", "tatsaechliches_ergebnis", "abweichung"] as never,
      filter: "r.v_status == 'erledigt'",
      where: (r: JourneyRecord) => (fieldLookup(r, "status")?.key ?? null) === "erledigt",
      toItem: options.items?.belege_massnahmen as never,
    })),
    erfahrungen: useRecordSearch(servicePort, 'erfahrungen', withPickPolicy('erfahrungen', {
      searchFields: ["titel", "situation", "erkenntnis", "gueltigkeitsbereich", "grenzen"] as never,
      filter: "r.v_status == 'entwurf'",
      where: (r: JourneyRecord) => (fieldLookup(r, "status")?.key ?? null) === "entwurf",
      toItem: options.items?.erfahrungen as never,
    })),
  };
  // Whether a pick offers „Neu anlegen“ is the plan's call: off for the record
  // this flow changes, for multi picks, for a catalogue entity and for an
  // entity with its own flow. The page spreads `.select` and writes no `create=`.
  // what the person sees under the search field: the rule that narrows the
  // pick (the owner's, else the plan's) — and the link that changes it
  const hintFor = (key: string, entity: EntityKey, planned: PickWhere | null) => pickHint(key, planned,
    w => whereSentence(w, f => labelOf(entity, f), (f, v) => optionsOf(entity, f).find(o => o.key === String(v))?.label ?? String(v)),
    `#/verwaltung/anwendung?line=intent:erfahrung-pruefen:read:${entity}`);
  const picks = {
    erfahrung: { ...searches.erfahrung, select: { ...searches.erfahrung.select, create: false as boolean, hint: hintFor('erfahrung', 'erfahrungen', {"conditions": [{"field": "status", "op": "eq", "value": "entwurf"}], "mode": "all"} as PickWhere | null) } },
    pruefer: { ...searches.pruefer, select: { ...searches.pruefer.select, create: false as boolean, hint: hintFor('pruefer', 'nutzer', null as PickWhere | null) } },
    belege_massnahmen: { ...searches.belege_massnahmen, select: { ...searches.belege_massnahmen.select, create: false as boolean, hint: hintFor('belege_massnahmen', 'massnahmen', {"conditions": [{"field": "status", "op": "eq", "value": "erledigt"}], "mode": "all"} as PickWhere | null) } },
    erfahrungen: { ...searches.erfahrungen, select: { ...searches.erfahrungen.select, create: false as boolean, hint: hintFor('erfahrungen', 'erfahrungen', {"conditions": [{"field": "status", "op": "eq", "value": "entwurf"}], "mode": "all"} as PickWhere | null) } },
  };

  const plan: PlanStep[] = [
    {
      key: 'lernpruefungen', entity: 'lernpruefungen', form: lernpruefungen, primary: true,
      values: (): FormValues => ({
        pruefdatum: policyFixedValue('lernpruefungen', 'pruefdatum') ?? todayIso(),
      }),
    },
    {
      key: 'erfahrungen', entity: 'erfahrungen', form: erfahrungen,
      updates: () => erfahrungenTargetId ?? undefined,
      // the review names the record this step changes; "Ändern" leads back to its pick
      target: () => erfahrungenTargetId
        ? { key: 'target:erfahrungen', label: entityLabel('erfahrungen'), value: picks.erfahrungen.labelOf(erfahrungenTargetId) ?? erfahrungenTargetId, step: steps.erfahrungen }
        : undefined,
      values: (): FormValues => ({
        status: options.compute.status(forms),
      }),
    },
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'erfahrung-pruefen' });

  /** The record(s) this flow CHANGES: picked through {...flow.picks.<entity>.select} {...flow.pick('<entity>')};
   *  picking prefills the form with the record's current values, and the plan step updates that record. */
  const targets = {
    erfahrungen: {
      selectedId: erfahrungenTargetId,
      onSelect: (id: string) => {
        setErfahrungenTargetId(id);
        const rec = picks.erfahrungen.recordOf(id);
        if (rec) erfahrungen.reset({ });
      },
      get record(): JourneyRecord | undefined { return erfahrungenTargetId ? picks.erfahrungen.recordOf(erfahrungenTargetId) : undefined; },
    },
  };
  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: ErfahrungPruefenFieldKey) => {
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
  const pickMany = (field: ErfahrungPruefenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)))    && Object.entries(targets).every(([k, t]) => steps[k] !== n || !!t.selectedId);
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); setErfahrungenTargetId(null); };

  return {
    slug: 'erfahrung-pruefen' as const,
    draftKey: 'erfahrung-pruefen' as const,
    entity: 'lernpruefungen' as const,
    form: lernpruefungen,
    forms, formList, picks, submit, steps, targets,    reviewStep: ERFAHRUNGPRUEFEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type ErfahrungPruefenFlow = ReturnType<typeof useErfahrungPruefenFlow>;
