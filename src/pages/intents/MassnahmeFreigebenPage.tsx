/**
 * Maßnahme freigeben — 5-Schritt-Wizard.
 * Steps: 1) Vorgeschlagene Maßnahme wählen → 2) Herkunft, Entscheidung und Regeln prüfen
 *        → 3) Freigeben oder ablehnen → 4) Freigebenden Menschen bestätigen → 5) Prüfen & speichern.
 * Reads: massnahmen (status vorgeschlagen), nutzer (art mensch), vorhaben, regeln_und_berechtigungen.
 * Writes: massnahmen (update: status, freigegeben_von, freigabedatum) via useMassnahmeFreigebenFlow.
 * Composes: IntentWizardShell, EntitySelectStep, Field, ChoiceGroup, StepNav, SummaryStep, SuccessStep.
 */
import { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { IconRobot, IconUser } from '@tabler/icons-react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Field } from '@/components/blocks/Field';
import { ChoiceGroup } from '@/components/blocks/ChoiceGroup';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup, fieldRef, recordIdOf } from '@/lib/journey';
import { useMassnahmeFreigebenFlow } from '@/lib/journey/flows/MassnahmeFreigeben';
import { tx } from '@/i18n';

interface RuleInfo { id: string; name: string; freigabepflicht: boolean }

export default function MassnahmeFreigebenPage() {
  const [step, setStep] = useState(1);
  const [gelesen, setGelesen] = useState(false);
  const [rules, setRules] = useState<RuleInfo[]>([]);

  const flow = useMassnahmeFreigebenFlow({
    steps: { massnahmen: 1, status: 3, freigegeben_von: 4 },
    items: {
      massnahmen: (m, ctx) => ({
        id: m.id,
        title: fieldText(m, 'beschreibung'),
        subtitle: [fieldLookup(m, 'herkunft')?.label, ctx.ref('vorhaben')].filter(Boolean).join(' · '),
      }),
      freigegeben_von: r => ({
        id: r.id,
        title: `${fieldText(r, 'nutzer_firstname')} ${fieldText(r, 'nutzer_lastname')}`.trim(),
        subtitle: fieldLookup(r, 'rolle')?.label,
      }),
    },
  });

  const f = flow.forms.massnahmen;
  const target = flow.targets.massnahmen.record;
  const search = flow.picks.massnahmen;
  const herkunft = target ? fieldLookup(target, 'herkunft') : null;
  const vorhabenId = target ? fieldRef(target, 'vorhaben') : null;

  // Geltende Regeln des Vorhabens — read through the flow's port.
  useEffect(() => {
    let cancelled = false;
    setRules([]);
    if (!vorhabenId) return;
    (async () => {
      const vorhaben = await flow.port.get('vorhaben', vorhabenId);
      const raw = vorhaben?.fields.geltende_regeln;
      const ids = (Array.isArray(raw) ? raw : []).map(recordIdOf).filter((x): x is string => !!x);
      const found = await Promise.all(ids.map(id => flow.port.get('regeln_und_berechtigungen', id)));
      if (cancelled) return;
      setRules(found.flatMap(r => r ? [{
        id: r.id,
        name: fieldText(r, 'bezeichnung'),
        freigabepflicht: r.fields.freigabepflicht === true,
      }] : []));
    })().catch(() => { if (!cancelled) setRules([]); });
    return () => { cancelled = true; };
  }, [vorhabenId, flow.port]);

  const statusChoice = f.choice('status');
  const decisionOptions = statusChoice.options.filter(o => o.key === 'freigegeben' || o.key === 'abgelehnt');

  const checkDecision = () => {
    if (!f.validate(['status'])) return false;
    const s = f.get('status');
    if (s !== 'freigegeben' && s !== 'abgelehnt') return tx('Bitte „Freigegeben“ oder „Abgelehnt“ wählen.');
    return true;
  };

  return (
    <IntentWizardShell
      title={tx('Maßnahme freigeben')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Eine vorgeschlagene Maßnahme durch einen Menschen freigeben oder ablehnen.'),
        needs: [tx('Eine vorgeschlagene Maßnahme'), tx('Name des freigebenden Menschen')],
      }}
    >
      <WizardStep label={tx('Maßnahme')} description={tx('Welche vorgeschlagene Maßnahme soll entschieden werden?')}>
        <EntitySelectStep
          {...flow.picks.massnahmen.select}
          {...flow.pick('massnahmen')}
          searchPlaceholder={tx('Beschreibung suchen …')}
          emptyText={tx('Zurzeit ist keine Maßnahme vorgeschlagen.')}
        />
      </WizardStep>

      <WizardStep label={tx('Prüfen')} heading={tx('Herkunft, Entscheidung und Regeln')} description={tx('Sieh dir an, woher die Maßnahme kommt und welche Regeln gelten.')} needs={['massnahmen']}>
        {target && (
          <div className="space-y-4">
            <div className="rounded-2xl border bg-card p-4 space-y-3 overflow-hidden">
              <p className="text-sm whitespace-pre-wrap break-words">{fieldText(target, 'beschreibung')}</p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {herkunft?.key === 'ki_vorschlag'
                  ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2.5 py-1"><IconRobot size={16} className="shrink-0" />{tx('KI-Vorschlag – braucht menschliche Freigabe')}</span>
                  : <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1"><IconUser size={16} className="shrink-0" />{herkunft?.label ?? tx('Mensch')}</span>}
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="min-w-0">
                  <dt className="text-muted-foreground">{tx('Vorgeschlagen von')}</dt>
                  <dd className="truncate">{search.refLabel(target, 'vorgeschlagen_von') ?? '—'}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-muted-foreground">{tx('Vorhaben')}</dt>
                  <dd className="truncate">{search.refLabel(target, 'vorhaben') ?? '—'}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-muted-foreground">{tx('Entscheidung')}</dt>
                  <dd className="truncate">{search.refLabel(target, 'entscheidung') ?? '—'}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-2xl border bg-card p-4 space-y-2 overflow-hidden">
              <h3 className="text-sm font-medium">{tx('Geltende Regeln des Vorhabens')}</h3>
              {rules.length === 0
                ? <p className="text-sm text-muted-foreground">{tx('Für dieses Vorhaben sind keine Regeln hinterlegt.')}</p>
                : <ul className="space-y-1 text-sm">
                    {rules.map(r => (
                      <li key={r.id} className="flex flex-wrap items-center gap-2">
                        <span className="min-w-0 truncate">{r.name}</span>
                        {r.freigabepflicht && <span className="text-xs text-amber-700">{tx('Freigabe durch einen Menschen erforderlich')}</span>}
                      </li>
                    ))}
                  </ul>}
            </div>
          </div>
        )}
        <div role="group" aria-label={tx('Bestätigung')} className="mt-4 flex items-start gap-2">
          <Checkbox id="massnahme-geprueft" checked={gelesen} onCheckedChange={c => setGelesen(c === true)} />
          <label htmlFor="massnahme-geprueft" className="text-sm">{tx('Ich habe Herkunft, Entscheidung und Regeln geprüft.')}</label>
        </div>
        <StepNav onBack={() => setStep(1)} onNext={() => gelesen || tx('Bitte bestätige, dass du die Angaben geprüft hast.')} nextStepLabel={tx('Entscheiden')} />
      </WizardStep>

      <WizardStep label={tx('Entscheidung')} description={tx('Soll die Maßnahme umgesetzt werden dürfen?')} needs={['massnahmen']}>
        <div className="space-y-4">
          <Field form={f} name="status">
            <ChoiceGroup {...statusChoice} options={decisionOptions} />
          </Field>
          <StepNav onBack={() => setStep(2)} onNext={checkDecision} nextStepLabel={tx('Freigebenden bestätigen')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Freigebender')} description={tx('Wer gibt diese Entscheidung frei? Nur Menschen sind wählbar.')} needs={['status']}>
        <Field form={f} name="freigegeben_von">
          <EntitySelectStep
            {...flow.picks.freigegeben_von.select}
            {...flow.pick('freigegeben_von')}
            searchPlaceholder={tx('Name suchen …')}
            avatar="initials"
          />
        </Field>
        <StepNav onBack={() => setStep(3)} onNext={() => flow.validateStep(4)} nextStepLabel={tx('Prüfen')} />
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            whatHappensNext={tx('Das Freigabedatum wird automatisch auf jetzt gesetzt.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          actions={{ copy: false, print: false }}
          next={[
            { label: tx('Maßnahme umsetzen und Ergebnis erfassen'), href: '#/intents/massnahme-abschliessen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Freigegebene Maßnahmen können jetzt umgesetzt werden.')}
        />
      )}
    </IntentWizardShell>
  );
}
