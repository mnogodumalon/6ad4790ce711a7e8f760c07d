/**
 * Erfahrung erfassen — 4-Schritt-Wizard + Prüfen.
 * Steps: 1) Kategorie und Titel → 2) Quelle wählen (Vorhaben, Entscheidung, Wissensträger) →
 * 3) Situation, Erkenntnis, Gültigkeitsbereich, Grenzen → 4) Erfassenden bestätigen → Prüfen & anlegen.
 * Reads: vorhaben, entscheidungen, nutzer. Writes: erfahrungen (status fest: entwurf).
 * Composes: IntentWizardShell, Bound, EntitySelectStep, StepNav, SummaryStep, SuccessStep.
 */
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup } from '@/lib/journey';
import { useErfahrungErfassenFlow } from '@/lib/journey/flows/ErfahrungErfassen';
import { useState } from 'react';
import { tx } from '@/i18n';

export default function ErfahrungErfassenPage() {
  const [step, setStep] = useState(1);
  const flow = useErfahrungErfassenFlow({
    steps: {
      titel: 1, kategorie: 1,
      vorhaben: 2, entscheidung: 2, wissenstraeger: 2,
      beschreibung: 3, situation: 3, erkenntnis: 3, gueltigkeitsbereich: 3, grenzen: 3,
      erfasst_von: 4,
    },
    items: {
      vorhaben: r => ({ id: r.id, title: fieldText(r, 'titel'), subtitle: fieldLookup(r, 'arbeitszustand')?.label }),
      entscheidung: r => ({ id: r.id, title: fieldText(r, 'entscheidungsfrage'), subtitle: fieldLookup(r, 'status')?.label }),
      wissenstraeger: r => ({ id: r.id, title: `${fieldText(r, 'nutzer_firstname')} ${fieldText(r, 'nutzer_lastname')}`.trim(), subtitle: fieldText(r, 'fachgebiet') }),
      erfasst_von: r => ({ id: r.id, title: `${fieldText(r, 'nutzer_firstname')} ${fieldText(r, 'nutzer_lastname')}`.trim(), subtitle: fieldText(r, 'fachgebiet') }),
    },
  });
  const f = flow.forms.erfahrungen;

  return (
    <IntentWizardShell
      title={tx('Erfahrung erfassen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Halte Wissen als wiederverwendbare Erfahrung mit Gültigkeitsbereich und Grenzen fest.'),
        needs: [tx('Kategorie und Titel'), tx('Optional: Quelle (Vorhaben, Entscheidung, Wissensträger)'), tx('Erkenntnis und Grenzen')],
      }}
    >
      <WizardStep label={tx('Kategorie und Titel')} description={tx('Worum geht es bei dieser Erfahrung?')}>
        <div className="space-y-4">
          <Bound form={f} name="kategorie" />
          <Bound form={f} name="titel" />
          <StepNav hideBack onNext={() => flow.validateStep(1)} nextStepLabel={tx('Quelle')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Quelle')} description={tx('Woher stammt die Erfahrung? Alle Angaben sind optional.')}>
        <div className="space-y-6">
          <section className="space-y-2">
            <p className="text-sm font-medium">{tx('Aus welchem Vorhaben?')}</p>
            <EntitySelectStep {...flow.picks.vorhaben.select} {...flow.pick('vorhaben')} searchPlaceholder={tx('Vorhaben suchen …')} />
          </section>
          <section className="space-y-2">
            <p className="text-sm font-medium">{tx('Aus welcher Entscheidung?')}</p>
            <EntitySelectStep {...flow.picks.entscheidung.select} {...flow.pick('entscheidung')} searchPlaceholder={tx('Entscheidung suchen …')} />
          </section>
          <section className="space-y-2">
            <p className="text-sm font-medium">{tx('Wer ist der Wissensträger?')}</p>
            <EntitySelectStep {...flow.picks.wissenstraeger.select} {...flow.pick('wissenstraeger')} avatar="initials" searchPlaceholder={tx('Person suchen …')} />
          </section>
          <StepNav onBack={() => setStep(1)} onNext={() => flow.validateStep(2)} nextStepLabel={tx('Inhalt')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Inhalt')} description={tx('Beschreibe Situation und Erkenntnis — und wo sie gilt und wo nicht.')}>
        <div className="space-y-4">
          <Bound form={f} name="beschreibung" rows={3} />
          <Bound form={f} name="situation" rows={3} />
          <Bound form={f} name="erkenntnis" rows={3} />
          <Bound form={f} name="gueltigkeitsbereich" rows={3} />
          <Bound form={f} name="grenzen" rows={3} />
          <StepNav onBack={() => setStep(2)} onNext={() => flow.validateStep(3)} nextStepLabel={tx('Erfassender')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Erfassender')} description={tx('Wer erfasst diese Erfahrung?')}>
        <div className="space-y-4">
          <EntitySelectStep {...flow.picks.erfasst_von.select} {...flow.pick('erfasst_von')} avatar="initials" searchPlaceholder={tx('Person suchen …')} />
          <StepNav onBack={() => setStep(3)} onNext={() => flow.validateStep(4)} nextStepLabel={tx('Prüfen')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[{ key: 'status', label: tx('Status'), value: tx('Entwurf') }]}
            whatHappensNext={tx('Die Erfahrung wird als Entwurf angelegt und kann anschließend geprüft werden.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          whatHappensNext={tx('Prüfe die Erfahrung als Nächstes, damit sie als geprüft gilt.')}
          next={[
            { label: tx('Erfahrung prüfen'), href: '#/intents/erfahrung-pruefen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
