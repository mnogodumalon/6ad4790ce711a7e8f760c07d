/**
 * Entscheidung treffen — 5-Schritt-Wizard + Prüfen.
 * Steps: 1) Offene Entscheidung wählen → 2) Alternativen und Regeln ansehen → 3) Option, Begründung, Erwartung
 *        → 4) Umsetzungsplan → 5) Optional Maßnahme vorschlagen → Prüfen & abschließen.
 * Reads: entscheidungen, alternativen, regeln_und_berechtigungen, vorhaben, nutzer.
 * Writes: entscheidungen (update), massnahmen (optional create) — via useEntscheidungTreffenFlow.
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep, StatusBadge.
 */
import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { IconCircleCheck, IconScale, IconListDetails } from '@tabler/icons-react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { StatusBadge } from '@/components/blocks/StatusBadge';
import {
  fieldText, fieldLookup, fieldDate, fieldRef, recordIdOf, todayIso,
  type JourneyRecord,
} from '@/lib/journey';
import { useEntscheidungTreffenFlow } from '@/lib/journey/flows/EntscheidungTreffen';
import { tx } from '@/i18n';

function dateText(iso: string | null): string {
  if (!iso) return '—';
  try { return format(parseISO(iso), 'dd.MM.yyyy'); } catch { return iso; }
}

export default function EntscheidungTreffenPage() {
  const [step, setStep] = useState(1);
  const [regeln, setRegeln] = useState<JourneyRecord[]>([]);
  const [ctxLoading, setCtxLoading] = useState(false);

  const flow = useEntscheidungTreffenFlow({
    steps: {
      entscheidungen: 1, gewaehlte_option: 2, begruendung: 3, erwartetes_ergebnis: 3, umsetzungsplan: 4,
      entscheidung: 5, vorhaben: 5, vorgeschlagen_von: 5, beschreibung: 5, herkunft: 5,
    },
    items: {
      entscheidungen: (r, c) => ({
        id: r.id,
        title: fieldText(r, 'entscheidungsfrage'),
        subtitle: [c.ref('vorhaben'), fieldDate(r, 'frist') ? tx`Frist ${dateText(fieldDate(r, 'frist'))}` : '']
          .filter(Boolean).join(' · '),
      }),
      gewaehlte_option: r => ({
        id: r.id,
        title: fieldText(r, 'bezeichnung'),
        subtitle: [fieldLookup(r, 'empfehlungsgrad')?.label, fieldText(r, 'aufwand')].filter(Boolean).join(' · '),
      }),
      vorhaben: r => ({ id: r.id, title: fieldText(r, 'titel') }),
      vorgeschlagen_von: r => ({
        id: r.id,
        title: `${fieldText(r, 'nutzer_firstname')} ${fieldText(r, 'nutzer_lastname')}`.trim(),
        subtitle: fieldLookup(r, 'rolle')?.label,
      }),
    },
  });

  const entscheidung = flow.targets.entscheidungen?.record ?? null;
  const entscheidungId = entscheidung?.id ?? null;
  const massnahme = flow.forms.massnahmen;

  // Alternativen und Regeln der gewählten Entscheidung — read-only context for step 2
  useEffect(() => {
    if (!entscheidung || !entscheidungId) { setRegeln([]); return; }
    let cancelled = false;
    setCtxLoading(true);
    const raw = entscheidung.fields.geltende_regeln;
    const ruleIds = (Array.isArray(raw) ? raw : raw ? [raw] : [])
      .map(v => recordIdOf(v)).filter((v): v is string => Boolean(v));
    Promise.all(ruleIds.map(id => flow.port.get('regeln_und_berechtigungen', id)))
      .then(r => { if (!cancelled) setRegeln(r.filter((x): x is JourneyRecord => Boolean(x))); })
      .catch(() => { if (!cancelled) setRegeln([]); }).finally(() => { if (!cancelled) setCtxLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entscheidungId]);

  // Optional step: only when a description was typed is a Maßnahme linked to this decision and written
  const checkMassnahme = () => {
    if (!massnahme.get('beschreibung')) { massnahme.reset(); return true; }
    if (entscheidung && entscheidungId) {
      massnahme.set('entscheidung', entscheidungId, fieldText(entscheidung, 'entscheidungsfrage'));
      const vorhabenId = fieldRef(entscheidung, 'vorhaben');
      if (vorhabenId) {
        massnahme.set('vorhaben', vorhabenId,
          flow.picks.entscheidungen.refLabel(entscheidung, 'vorhaben') ?? flow.picks.vorhaben.labelOf(vorhabenId) ?? '');
      }
    }
    return flow.validateStep(5);
  };

  const missingDecision = (
    <StepNav onBack={() => setStep(1)} nextDisabled>
      {tx('Dieser Schritt braucht die Entscheidung aus Schritt 1.')}
    </StepNav>
  );

  return (
    <IntentWizardShell
      title={tx('Entscheidung treffen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Eine vorbereitete Entscheidung mit Option und Begründung abschließen.'),
        needs: [tx('Die offene Entscheidung'), tx('Deine Begründung'), tx('Den Umsetzungsplan')],
      }}
    >
      <WizardStep label={tx('Entscheidung')} description={tx('Welche vorbereitete Entscheidung willst du jetzt treffen?')}>
        <EntitySelectStep
          {...flow.picks.entscheidungen.select}
          {...flow.pick('entscheidungen')}
          searchPlaceholder={tx('Entscheidungsfrage suchen …')}
          emptyText={tx('Es gibt keine offene Entscheidung. Bereite zuerst eine Entscheidung vor.')}
        />
      </WizardStep>

      <WizardStep label={tx('Alternativen')} description={tx('Sieh dir Fakten, Alternativen und geltende Regeln an.')}>
        {!entscheidung ? missingDecision : (
          <div className="space-y-4">
            <div className="rounded-2xl border bg-card p-4 space-y-2 overflow-hidden">
              <p className="font-medium break-words">{fieldText(entscheidung, 'entscheidungsfrage')}</p>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {fieldLookup(entscheidung, 'situationstyp') && (
                  <StatusBadge statusKey={fieldLookup(entscheidung, 'situationstyp')?.key} label={fieldLookup(entscheidung, 'situationstyp')?.label} tone="info" />
                )}
                <span>{tx`Frist: ${dateText(fieldDate(entscheidung, 'frist'))}`}</span>
                <span>{tx`Zuständig: ${flow.picks.entscheidungen.refLabel(entscheidung, 'zustaendiger') ?? '—'}`}</span>
              </div>
              {fieldText(entscheidung, 'gesicherte_fakten') && (
                <div className="text-sm">
                  <span className="font-medium">{tx('Gesicherte Fakten')}: </span>
                  <span className="whitespace-pre-wrap break-words">{fieldText(entscheidung, 'gesicherte_fakten')}</span>
                </div>
              )}
              {fieldText(entscheidung, 'offene_annahmen') && (
                <div className="text-sm">
                  <span className="font-medium">{tx('Offene Annahmen')}: </span>
                  <span className="whitespace-pre-wrap break-words">{fieldText(entscheidung, 'offene_annahmen')}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <IconScale size={16} className="shrink-0" />{tx('Geltende Regeln und Grenzen')}
              </h3>
              {regeln.length === 0 ? (
                <p className="text-sm text-muted-foreground">{tx('Keine besonderen Regeln hinterlegt.')}</p>
              ) : regeln.map(r => (
                <div key={r.id} className="rounded-xl border bg-card p-3 overflow-hidden">
                  <span className="font-medium break-words">{fieldText(r, 'bezeichnung')}</span>
                  {fieldText(r, 'beschreibung') && (
                    <p className="text-sm text-muted-foreground break-words">{fieldText(r, 'beschreibung')}</p>
                  )}
                </div>
              ))}
            </div>

            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <IconListDetails size={16} className="shrink-0" />{tx('Welche Option wählst du?')}
            </h3>
            <EntitySelectStep
              {...flow.picks.gewaehlte_option.select}
              {...flow.pick('gewaehlte_option')}
              searchPlaceholder={tx('Option suchen …')}
              emptyText={tx('Zu dieser Entscheidung gibt es keine Alternative, die du wählen könntest.')}
            />
            <StepNav onBack={() => setStep(1)} onNext={() => flow.validateStep(2)} nextStepLabel={tx('Begründung')} />
          </div>
        )}
      </WizardStep>

      <WizardStep label={tx('Begründung')} description={tx('Halte fest, warum du so entscheidest und was du erwartest.')}>
        {!entscheidung ? missingDecision : (
          <div className="space-y-4">
            <Bound form={flow.forms.entscheidungen} name="begruendung" rows={4} />
            <Bound form={flow.forms.entscheidungen} name="erwartetes_ergebnis" rows={3} />
            <StepNav
              onBack={() => setStep(2)}
              onNext={() => flow.validateStep(3)}
              nextStepLabel={tx('Umsetzungsplan')}
            />
          </div>
        )}
      </WizardStep>

      <WizardStep label={tx('Umsetzungsplan')} description={tx('Wie wird die Entscheidung umgesetzt?')}>
        <div className="space-y-4">
          <Bound form={flow.forms.entscheidungen} name="umsetzungsplan" rows={5} />
          <p className="text-xs text-muted-foreground">
            {tx`Das Entscheidungsdatum wird automatisch auf heute (${dateText(todayIso())}) gesetzt.`}
          </p>
          <StepNav
            onBack={() => setStep(3)}
            onNext={() => flow.validateStep(4)}
            nextStepLabel={tx('Maßnahme')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Maßnahme')} description={tx('Leite optional gleich eine erste Maßnahme aus der Entscheidung ab.')}>
        <div className="space-y-4">
          <Bound form={massnahme} name="beschreibung" rows={3} hint={tx('Leer lassen, wenn du keine Maßnahme vorschlagen willst.')} />
          <Bound form={massnahme} name="herkunft" />
          <EntitySelectStep
            {...flow.picks.vorgeschlagen_von.select}
            {...flow.pick('vorgeschlagen_von')}
            avatar="initials"
            searchPlaceholder={tx('Person suchen …')}
          />
          <p className="text-xs text-muted-foreground">
            {tx('Die Maßnahme wird mit dem Status „Vorgeschlagen“ angelegt und wartet auf Freigabe.')}
          </p>
          <StepNav
            onBack={() => setStep(4)}
            onNext={checkMassnahme}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[{ key: 'entscheidungsdatum', label: tx('Entscheidungsdatum'), value: dateText(todayIso()) }]}
            whatHappensNext={tx('Die Entscheidung wird abgeschlossen. Eine vorgeschlagene Maßnahme kannst du danach freigeben.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          title={tx('Entscheidung getroffen')}
          actions={{ copy: false, print: false }}
          next={[
            { label: tx('Maßnahme freigeben'), href: '#/intents/massnahme-freigeben', icon: <IconCircleCheck size={16} /> },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Die gewählte Option ist festgehalten. Vorgeschlagene Maßnahmen wartest du im Ablauf „Maßnahme freigeben“ ab.')}
        />
      )}
    </IntentWizardShell>
  );
}
