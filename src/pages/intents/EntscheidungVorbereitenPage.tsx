/**
 * Entscheidung vorbereiten — 5-Schritt-Wizard.
 * Steps: 1) Vorhaben wählen → 2) Frage, Situationstyp und Zuständigen → 3) Fakten, Annahmen, Lücken
 *        → 4) Geltende Regeln → 5) Alternativen erfassen → Prüfen & anlegen.
 * Reads: vorhaben, regeln_und_berechtigungen, nutzer.
 * Writes: entscheidungen (create), alternativen (create), vorhaben (update arbeitszustand) — all via useEntscheidungVorbereitenFlow.
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
import { useEntscheidungVorbereitenFlow } from '@/lib/journey/flows/EntscheidungVorbereiten';
import { tx } from '@/i18n';

export default function EntscheidungVorbereitenPage() {
  const [step, setStep] = useState(1);
  const flow = useEntscheidungVorbereitenFlow({
    steps: {
      vorhaben: 1,
      entscheidungsfrage: 2, situationstyp: 2, frist: 2, zustaendiger: 2,
      gesicherte_fakten: 3, offene_annahmen: 3, fehlende_informationen: 3,
      geltende_regeln: 4,
      bezeichnung: 5, beschreibung: 5, konsequenzen: 5, risiken: 5, aufwand: 5,
      empfehlungsgrad: 5, herkunft: 5, vorgeschlagen_von: 5,
    },
    items: {
      vorhaben: r => ({
        id: r.id,
        title: fieldText(r, 'titel'),
        subtitle: fieldLookup(r, 'arbeitszustand')?.label,
      }),
      geltende_regeln: r => ({
        id: r.id,
        title: fieldText(r, 'bezeichnung'),
        subtitle: [fieldLookup(r, 'regeltyp')?.label, fieldText(r, 'geltungsbereich')].filter(Boolean).join(' · '),
      }),
      zustaendiger: r => ({
        id: r.id,
        title: `${fieldText(r, 'nutzer_firstname')} ${fieldText(r, 'nutzer_lastname')}`.trim(),
        subtitle: fieldLookup(r, 'rolle')?.label,
      }),
      vorgeschlagen_von: r => ({
        id: r.id,
        title: `${fieldText(r, 'nutzer_firstname')} ${fieldText(r, 'nutzer_lastname')}`.trim(),
        subtitle: fieldLookup(r, 'rolle')?.label,
      }),
    },
  });

  const entscheidung = flow.forms.entscheidungen;
  const alternative = flow.forms.alternativen;

  return (
    <IntentWizardShell
      title={tx('Entscheidung vorbereiten')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Eine Entscheidung zu einem Vorhaben vorbereiten und erste Alternativen erfassen.'),
        needs: [tx('Das Vorhaben'), tx('Die Entscheidungsfrage'), tx('Eine zuständige Person')],
      }}
    >
      <WizardStep label={tx('Vorhaben')} heading={tx('Vorhaben wählen')} description={tx('Zu welchem Vorhaben gehört die Entscheidung?')}>
        <Field form={entscheidung} name="vorhaben" hideLabel>
          <EntitySelectStep
            {...flow.picks.vorhaben.select}
            selectedId={flow.pick('vorhaben').selectedId}
            onSelect={id => {
              flow.pick('vorhaben').onSelect(id);
              entscheidung.set('vorhaben', id, flow.picks.vorhaben.labelOf(id) ?? '');
            }}
            searchPlaceholder={tx('Vorhaben suchen …')}
          />
        </Field>
      </WizardStep>

      <WizardStep
        label={tx('Frage')}
        heading={tx('Entscheidungsfrage und Zuständigkeit')}
        description={tx('Was soll entschieden werden, und wer entscheidet?')}
      >
        <div className="space-y-4">
          <Bound form={entscheidung} name="entscheidungsfrage" rows={3} />
          <Bound form={entscheidung} name="situationstyp" />
          <Bound form={entscheidung} name="frist" />
          <Field form={entscheidung} name="zustaendiger">
            <EntitySelectStep
              {...flow.picks.zustaendiger.select}
              {...flow.pick('zustaendiger')}
              avatar="initials"
              searchPlaceholder={tx('Name suchen …')}
            />
          </Field>
          <StepNav
            onBack={() => setStep(1)}
            onNext={() => flow.validateStep(2)}
            nextStepLabel={tx('Fakten')}
          />
        </div>
      </WizardStep>

      <WizardStep
        label={tx('Fakten')}
        heading={tx('Fakten, Annahmen und Lücken')}
        description={tx('Was ist gesichert, was ist nur angenommen, was fehlt noch?')}
      >
        <div className="space-y-4">
          <Bound form={entscheidung} name="gesicherte_fakten" rows={4} />
          <Bound form={entscheidung} name="offene_annahmen" rows={4} />
          <Bound form={entscheidung} name="fehlende_informationen" rows={4} />
          <StepNav
            onBack={() => setStep(2)}
            onNext={() => flow.validateStep(3)}
            nextStepLabel={tx('Regeln')}
          />
        </div>
      </WizardStep>

      <WizardStep
        label={tx('Regeln')}
        heading={tx('Geltende Regeln wählen')}
        description={tx('Welche Regeln und Grenzen gelten für diese Entscheidung?')}
      >
        <div className="space-y-4">
          <Field form={entscheidung} name="geltende_regeln">
            <EntitySelectStep
              {...flow.picks.geltende_regeln.select}
              {...flow.pickMany('geltende_regeln')}
              avatar="none"
              searchPlaceholder={tx('Regel suchen …')}
            />
          </Field>
          <StepNav
            onBack={() => setStep(3)}
            onNext={() => flow.validateStep(4)}
            nextStepLabel={tx('Alternativen')}
          />
        </div>
      </WizardStep>

      <WizardStep
        label={tx('Alternativen')}
        heading={tx('Erste Alternative erfassen')}
        description={tx('Beschreibe eine Option mit ihren Konsequenzen und Risiken.')}
      >
        <div className="space-y-4">
          <Bound form={alternative} name="bezeichnung" />
          <Bound form={alternative} name="beschreibung" rows={3} />
          <Bound form={alternative} name="konsequenzen" rows={3} />
          <Bound form={alternative} name="risiken" rows={3} />
          <Bound form={alternative} name="aufwand" />
          <Bound form={alternative} name="empfehlungsgrad" allowClear />
          <Bound form={alternative} name="herkunft" />
          <Field form={alternative} name="vorgeschlagen_von">
            <EntitySelectStep
              {...flow.picks.vorgeschlagen_von.select}
              {...flow.pick('vorgeschlagen_von')}
              avatar="initials"
              searchPlaceholder={tx('Name suchen …')}
            />
          </Field>
          <StepNav
            onBack={() => setStep(4)}
            onNext={() => flow.validateStep(5)}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[
              { key: 'status', label: tx('Status der Entscheidung'), value: tx('Vorbereitet') },
              { key: 'arbeitszustand', label: tx('Arbeitszustand des Vorhabens'), value: tx('Wartet auf Entscheidung') },
            ]}
            whatHappensNext={tx('Die Entscheidung und die Alternative werden angelegt, das Vorhaben wechselt auf „Wartet auf Entscheidung“.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          facts={[
            { label: tx('Entscheidungsfrage'), value: String(entscheidung.get('entscheidungsfrage') ?? '') },
            { label: tx('Status'), value: tx('Vorbereitet') },
          ]}
          whatHappensNext={tx('Als Nächstes kann die Entscheidung getroffen werden.')}
          next={[
            { label: tx('Entscheidung treffen'), href: '#/intents/entscheidung-treffen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
