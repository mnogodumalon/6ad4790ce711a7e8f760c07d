/**
 * Maßnahme abschließen — 5-Schritt-Wizard.
 * Steps: 1) Freigegebene Maßnahme wählen → 2) Zustandsänderung und Umsetzungsdatum → 3) Ergebnis und Abweichung
 *        → 4) Vorhaben auf Wirkungsprüfung setzen → 5) Prüfen & speichern.
 * Reads: massnahmen, vorhaben (über den Flow-Hook). Writes: massnahmen (status erledigt), vorhaben (arbeitszustand wirkung_pruefen).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup } from '@/lib/journey';
import { useMassnahmeAbschliessenFlow } from '@/lib/journey/flows/MassnahmeAbschliessen';
import { tx } from '@/i18n';

export default function MassnahmeAbschliessenPage() {
  const [step, setStep] = useState(1);
  const flow = useMassnahmeAbschliessenFlow({
    steps: { massnahmen: 1, zustandsaenderung: 2, umsetzungsdatum: 2, tatsaechliches_ergebnis: 3, abweichung: 3, vorhaben: 4 },
    items: {
      massnahmen: r => ({
        id: r.id,
        title: fieldText(r, 'beschreibung'),
        subtitle: fieldLookup(r, 'status')?.label,
      }),
      vorhaben: r => ({ id: r.id, title: fieldText(r, 'titel'), subtitle: fieldLookup(r, 'arbeitszustand')?.label }),
    },
  });

  return (
    <IntentWizardShell
      title={tx('Maßnahme abschließen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Eine freigegebene Maßnahme umsetzen und das Ergebnis festhalten.'),
        needs: [tx('Freigegebene Maßnahme'), tx('Tatsächliches Ergebnis'), tx('Vorhaben zur Wirkungsprüfung')],
      }}
    >
      <WizardStep label={tx('Maßnahme')} description={tx('Welche freigegebene Maßnahme wurde umgesetzt?')}>
        <EntitySelectStep
          {...flow.picks.massnahmen.select}
          {...flow.pick('massnahmen')}
          emptyText={tx('Keine Maßnahme ist freigegeben oder in Umsetzung. Gib zuerst eine Maßnahme frei.')}
          searchPlaceholder={tx('Beschreibung suchen …')}
        />
      </WizardStep>
      <WizardStep label={tx('Umsetzung')} description={tx('Was hat sich verändert und wann wurde umgesetzt?')} needs={['massnahmen']}>
        <div className="space-y-4">
          <Bound form={flow.forms.massnahmen} name="zustandsaenderung" rows={4} />
          <Bound form={flow.forms.massnahmen} name="umsetzungsdatum" />
          <StepNav onBack={() => setStep(1)} onNext={() => flow.validateStep(2)} nextStepLabel={tx('Ergebnis')} />
        </div>
      </WizardStep>
      <WizardStep label={tx('Ergebnis')} description={tx('Was ist tatsächlich herausgekommen — und wo wich es ab?')} needs={['massnahmen']}>
        <div className="space-y-4">
          <Bound form={flow.forms.massnahmen} name="tatsaechliches_ergebnis" rows={4} />
          <Bound form={flow.forms.massnahmen} name="abweichung" rows={3} />
          <StepNav onBack={() => setStep(2)} onNext={() => flow.validateStep(3)} nextStepLabel={tx('Vorhaben')} />
        </div>
      </WizardStep>
      <WizardStep label={tx('Vorhaben')} description={tx('Wähle das Vorhaben, das jetzt auf Wirkung geprüft werden soll.')} needs={['massnahmen']}>
        <div className="space-y-4">
          <EntitySelectStep
            {...flow.picks.vorhaben.select}
            {...flow.pick('vorhaben')}
            searchPlaceholder={tx('Vorhaben suchen …')}
          />
          <StepNav onBack={() => setStep(3)} onNext={() => flow.validateStep(4)} nextStepLabel={tx('Prüfen')} />
        </div>
      </WizardStep>
      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[
              { key: 'massnahme_status', label: tx('Status der Maßnahme'), value: tx('Erledigt') },
              { key: 'vorhaben_zustand', label: tx('Arbeitszustand des Vorhabens'), value: tx('Wirkung prüfen') },
            ]}
            whatHappensNext={tx('Die Maßnahme gilt als erledigt, das Vorhaben wartet auf die Wirkungsprüfung.')}
          />
        )}
      </WizardStep>
      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          next={[
            { label: tx('Erfahrung erfassen'), href: '#/intents/erfahrung-erfassen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Halte jetzt fest, was du aus der Umsetzung gelernt hast.')}
        />
      )}
    </IntentWizardShell>
  );
}
