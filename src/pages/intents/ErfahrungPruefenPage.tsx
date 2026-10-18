/**
 * Erfahrung prüfen — 5-Schritt-Wizard.
 * Steps: 1) Erfahrung im Entwurf wählen → 2) Belege aus Maßnahmen wählen (optional) →
 *        3) Prüfer, Ergebnis, Begründung und Gültigkeitsbereich erfassen → 4) Nächste Überprüfung festlegen → 5) Prüfen & speichern.
 * Reads: erfahrungen, massnahmen, nutzer. Writes: lernpruefungen (create), erfahrungen (status update).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, Field, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { Field } from '@/components/blocks/Field';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup } from '@/lib/journey';
import { useErfahrungPruefenFlow } from '@/lib/journey/flows/ErfahrungPruefen';
import { tx } from '@/i18n';

export default function ErfahrungPruefenPage() {
  const [step, setStep] = useState(1);
  const flow = useErfahrungPruefenFlow({
    steps: { erfahrungen: 1, erfahrung: 1, belege_massnahmen: 2, pruefer: 3, ergebnis: 3, begruendung: 3, gueltigkeitsbereich_neu: 3, wiederverwendbar_fuer: 4, naechste_ueberpruefung: 4 },
    items: {
      erfahrungen: r => ({ id: r.id, title: fieldText(r, 'titel'), subtitle: fieldLookup(r, 'kategorie')?.label }),
      erfahrung: r => ({ id: r.id, title: fieldText(r, 'titel'), subtitle: fieldLookup(r, 'kategorie')?.label }),
      pruefer: r => ({ id: r.id, title: `${fieldText(r, 'nutzer_firstname')} ${fieldText(r, 'nutzer_lastname')}`.trim(), subtitle: fieldText(r, 'fachgebiet') }),
      belege_massnahmen: r => ({ id: r.id, title: fieldText(r, 'beschreibung'), subtitle: fieldText(r, 'tatsaechliches_ergebnis') || fieldText(r, 'abweichung') }),
    },
    compute: {
      status: forms => {
        const ergebnis = forms.lernpruefungen.get('ergebnis');
        if (ergebnis === 'widerlegt') return 'veraltet';
        if (ergebnis === 'bestaetigt' || ergebnis === 'eingeschraenkt') return 'geprueft';
        return null;
      },
    },
  });

  const erfahrungPick = flow.pick('erfahrungen');
  const erfahrungLink = flow.pick('erfahrung');
  const target = flow.targets.erfahrungen.record;
  const ergebnis = flow.forms.lernpruefungen.get('ergebnis');
  const neuerStatus = ergebnis === 'widerlegt' ? tx('Veraltet') : ergebnis ? tx('Geprüft') : '—';

  return (
    <IntentWizardShell
      title={tx('Erfahrung prüfen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{ description: tx('Eine Erfahrung im Entwurf prüfen und ihren Status festlegen.'), needs: [tx('Eine Erfahrung im Entwurf'), tx('Name des Prüfers')] }}
    >
      <WizardStep label={tx('Erfahrung')} description={tx('Welche Erfahrung im Entwurf möchtest du prüfen?')}>
        <EntitySelectStep
          {...flow.picks.erfahrungen.select}
          selectedId={erfahrungPick.selectedId}
          onSelect={id => { erfahrungPick.onSelect(id); erfahrungLink.onSelect(id); }}
        />
      </WizardStep>

      <WizardStep label={tx('Belege')} description={tx('Welche Maßnahmen belegen oder widerlegen die Erfahrung? Du kannst diesen Schritt überspringen.')} needs={['erfahrungen']}>
        <Field form={flow.forms.lernpruefungen} name="belege_massnahmen">
          <EntitySelectStep {...flow.picks.belege_massnahmen.select} {...flow.pickMany('belege_massnahmen')} />
        </Field>
        <StepNav onBack={() => setStep(1)} onNext={() => flow.validateStep(2)} nextStepLabel={tx('Ergebnis')} />
      </WizardStep>

      <WizardStep label={tx('Ergebnis')} description={tx('Prüfer, Ergebnis und Begründung festhalten.')} needs={['erfahrungen']}>
        <div className="space-y-4">
          {target && (
            <div className="rounded-2xl border bg-secondary/40 p-4 space-y-1 overflow-hidden">
              <p className="text-sm font-semibold break-words">{fieldText(target, 'titel')}</p>
              {fieldText(target, 'erkenntnis') && <p className="text-sm text-muted-foreground break-words line-clamp-3">{fieldText(target, 'erkenntnis')}</p>}
              {fieldText(target, 'gueltigkeitsbereich') && (
                <p className="text-xs text-muted-foreground break-words line-clamp-2">{tx('Bisheriger Gültigkeitsbereich')}: {fieldText(target, 'gueltigkeitsbereich')}</p>
              )}
              {fieldText(target, 'grenzen') && (
                <p className="text-xs text-muted-foreground break-words line-clamp-2">{tx('Grenzen')}: {fieldText(target, 'grenzen')}</p>
              )}
            </div>
          )}
          <Field form={flow.forms.lernpruefungen} name="pruefer">
            <EntitySelectStep {...flow.picks.pruefer.select} {...flow.pick('pruefer')} />
          </Field>
          <Bound form={flow.forms.lernpruefungen} name="ergebnis" />
          <Bound form={flow.forms.lernpruefungen} name="begruendung" rows={3} />
          <Bound form={flow.forms.lernpruefungen} name="gueltigkeitsbereich_neu" rows={3} />
          <StepNav onBack={() => setStep(2)} onNext={() => flow.validateStep(3)} nextStepLabel={tx('Nächste Überprüfung')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Nächste Prüfung')} description={tx('Wofür ist die Erfahrung weiter nutzbar und wann prüfst du sie erneut?')} needs={['ergebnis']}>
        <div className="space-y-4">
          <Bound form={flow.forms.lernpruefungen} name="wiederverwendbar_fuer" />
          <Bound form={flow.forms.lernpruefungen} name="naechste_ueberpruefung" />
          <StepNav onBack={() => setStep(3)} onNext={() => flow.validateStep(4)} nextStepLabel={tx('Prüfen')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[
              { key: 'neuer-status', label: tx('Neuer Status der Erfahrung'), value: neuerStatus },
              { key: 'pruefdatum', label: tx('Prüfdatum'), value: tx('Heute') },
            ]}
            whatHappensNext={tx('Die Prüfung wird gespeichert und der Status der Erfahrung entsprechend gesetzt.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          next={[
            { label: tx('Weitere Erfahrung prüfen'), onClick: () => { flow.reset(); setStep(1); } },
            { label: tx('Erfahrung erfassen'), href: '#/intents/erfahrung-erfassen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Geprüfte Erfahrungen stehen bei künftigen Entscheidungen zur Verfügung, widerlegte sind als veraltet markiert.')}
        />
      )}
    </IntentWizardShell>
  );
}
