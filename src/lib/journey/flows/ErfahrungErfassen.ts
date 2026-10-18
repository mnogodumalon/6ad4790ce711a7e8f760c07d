/**
 * useErfahrungErfassenFlow — the plumbing of the flow « Erfahrung erfassen », generated from the plan.
 *
 * Writes `erfahrungen`: asks `titel`, `kategorie`, `beschreibung`, `situation`, `erkenntnis`, `gueltigkeitsbereich`, `grenzen`, `vorhaben`, `entscheidung`, `wissenstraeger`, `erfasst_von`; sets `status` itself.
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
 *
 *   const flow = useErfahrungErfassenFlow({
 *     steps: { vorhaben: 1, entscheidung: 2, wissenstraeger: 3, erfasst_von: 4, titel: 5, kategorie: 5, beschreibung: 5, situation: 5, erkenntnis: 5, gueltigkeitsbereich: 5, grenzen: 5 },
 *     items: { vorhaben: r => ({ id: r.id, title: fieldText(r, 'titel') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.vorhaben.select} {...flow.pick('vorhaben')} />
 *     <EntitySelectStep {...flow.picks.entscheidung.select} {...flow.pick('entscheidung')} />
 *     <EntitySelectStep {...flow.picks.wissenstraeger.select} {...flow.pick('wissenstraeger')} />
 *     <EntitySelectStep {...flow.picks.erfasst_von.select} {...flow.pick('erfasst_von')} />
 *     <Bound form={flow.forms.erfahrungen} name="titel" />
 *     <Bound form={flow.forms.erfahrungen} name="kategorie" />
 *     <Bound form={flow.forms.erfahrungen} name="beschreibung" />
 *     <Bound form={flow.forms.erfahrungen} name="situation" />
 *     <Bound form={flow.forms.erfahrungen} name="erkenntnis" />
 *     <Bound form={flow.forms.erfahrungen} name="gueltigkeitsbereich" />
 *     <Bound form={flow.forms.erfahrungen} name="grenzen" />
 *     <StepNav onNext={() => flow.validateStep(n)} />
 *     {!flow.submit.done && <SummaryStep forms={flow.formList} submit={flow.submit} />}
 *     {flow.submit.result && <SuccessStep result={flow.submit.result} forms={flow.formList} submit={flow.submit} />}
 *   </IntentWizardShell>
 */
import {
  useStepForm, useJourneySubmit, useRecordSearch,
  fieldText, fieldLookup, fieldLookups, fieldNumber, fieldDate, fieldRef,
  todayIso, nowIso, isEmptyValue, policyFixedValue, withPickPolicy, usePolicyVersion,
  type StepForm, type JourneyRecord, type RefContext, type SelectItemLike, type FormValues, type PlanStep, type SummaryItem,} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { pickHint, whereSentence, type PickWhere } from '@/lib/journey/policy';
import { labelOf, optionsOf, type EntityKey } from '@/lib/journey/rules';
export type ErfahrungErfassenFieldKey = 'beschreibung' | 'entscheidung' | 'erfasst_von' | 'erkenntnis' | 'grenzen' | 'gueltigkeitsbereich' | 'kategorie' | 'situation' | 'titel' | 'vorhaben' | 'wissenstraeger';

export interface ErfahrungErfassenForms {
  erfahrungen: StepForm<'erfahrungen'>;
}

// Alias so the option generics stay readable.
type Key = ErfahrungErfassenFieldKey;

export interface ErfahrungErfassenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    vorhaben?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    entscheidung?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    wissenstraeger?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    erfasst_von?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"beschreibung": 5, "entscheidung": 2, "erfasst_von": 4, "erkenntnis": 5, "grenzen": 5, "gueltigkeitsbereich": 5, "kategorie": 5, "situation": 5, "titel": 5, "vorhaben": 1, "wissenstraeger": 3};
export const ERFAHRUNGERFASSEN_REVIEW_STEP = 6;

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

export function useErfahrungErfassenFlow(options: ErfahrungErfassenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const erfahrungen = useStepForm('erfahrungen', {
    fields: ["titel", "kategorie", "beschreibung", "situation", "erkenntnis", "gueltigkeitsbereich", "grenzen", "vorhaben", "entscheidung", "wissenstraeger", "erfasst_von"],
    steps: only(steps, ["titel", "kategorie", "beschreibung", "situation", "erkenntnis", "gueltigkeitsbereich", "grenzen", "vorhaben", "entscheidung", "wissenstraeger", "erfasst_von"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["titel", "kategorie", "beschreibung", "situation", "erkenntnis", "gueltigkeitsbereich", "grenzen", "vorhaben", "entscheidung", "wissenstraeger", "erfasst_von"]),
    messages: only(options.messages as Record<string, string> | undefined, ["titel", "kategorie", "beschreibung", "situation", "erkenntnis", "gueltigkeitsbereich", "grenzen", "vorhaben", "entscheidung", "wissenstraeger", "erfasst_von"]),
  });
  const forms: ErfahrungErfassenForms = { erfahrungen };
  const formList: StepForm[] = [erfahrungen];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    vorhaben: useRecordSearch(servicePort, 'vorhaben', withPickPolicy('vorhaben', {
      searchFields: ["titel"] as never,
      toItem: options.items?.vorhaben as never,
    })),
    entscheidung: useRecordSearch(servicePort, 'entscheidungen', withPickPolicy('entscheidung', {
      searchFields: ["entscheidungsfrage", "tatsaechliches_ergebnis"] as never,
      toItem: options.items?.entscheidung as never,
    })),
    wissenstraeger: useRecordSearch(servicePort, 'nutzer', withPickPolicy('wissenstraeger', {
      searchFields: ["nutzer_firstname"] as never,
      toItem: options.items?.wissenstraeger as never,
    })),
    erfasst_von: useRecordSearch(servicePort, 'nutzer', withPickPolicy('erfasst_von', {
      searchFields: ["nutzer_firstname"] as never,
      toItem: options.items?.erfasst_von as never,
    })),
  };
  // Whether a pick offers „Neu anlegen“ is the plan's call: off for the record
  // this flow changes, for multi picks, for a catalogue entity and for an
  // entity with its own flow. The page spreads `.select` and writes no `create=`.
  // what the person sees under the search field: the rule that narrows the
  // pick (the owner's, else the plan's) — and the link that changes it
  const hintFor = (key: string, entity: EntityKey, planned: PickWhere | null) => pickHint(key, planned,
    w => whereSentence(w, f => labelOf(entity, f), (f, v) => optionsOf(entity, f).find(o => o.key === String(v))?.label ?? String(v)),
    `#/verwaltung/anwendung?line=intent:erfahrung-erfassen:read:${entity}`);
  // a fixed value the flow sets itself, as a review row with the link that changes it
  const setting = (entity: EntityKey, field: string, value: unknown): SummaryItem => ({
    key: `setting:${entity}.${field}`, label: labelOf(entity, field),
    value: optionsOf(entity, field).find(o => o.key === String(value))?.label ?? String(value ?? ''),
    href: `#/verwaltung/anwendung?line=intent:erfahrung-erfassen:write:${entity}.${field}`,
  });
  const picks = {
    vorhaben: { ...searches.vorhaben, select: { ...searches.vorhaben.select, create: true as boolean, hint: hintFor('vorhaben', 'vorhaben', null as PickWhere | null) } },
    entscheidung: { ...searches.entscheidung, select: { ...searches.entscheidung.select, create: false as boolean, hint: hintFor('entscheidung', 'entscheidungen', null as PickWhere | null) } },
    wissenstraeger: { ...searches.wissenstraeger, select: { ...searches.wissenstraeger.select, create: false as boolean, hint: hintFor('wissenstraeger', 'nutzer', null as PickWhere | null) } },
    erfasst_von: { ...searches.erfasst_von, select: { ...searches.erfasst_von.select, create: false as boolean, hint: hintFor('erfasst_von', 'nutzer', null as PickWhere | null) } },
  };

  const plan: PlanStep[] = [
    {
      key: 'erfahrungen', entity: 'erfahrungen', form: erfahrungen, primary: true,
      values: (): FormValues => ({
        status: policyFixedValue('erfahrungen', 'status') ?? "entwurf",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('erfahrungen', 'status', policyFixedValue('erfahrungen', 'status') ?? "entwurf")],
    },
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'erfahrung-erfassen' });

  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: ErfahrungErfassenFieldKey) => {
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
  const pickMany = (field: ErfahrungErfassenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)));
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); };

  return {
    slug: 'erfahrung-erfassen' as const,
    draftKey: 'erfahrung-erfassen' as const,
    entity: 'erfahrungen' as const,
    form: erfahrungen,
    forms, formList, picks, submit, steps,    reviewStep: ERFAHRUNGERFASSEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type ErfahrungErfassenFlow = ReturnType<typeof useErfahrungErfassenFlow>;
