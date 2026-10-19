import { useEffect, useMemo, useState } from 'react';
import { PublicShell } from '@/components/PublicShell';
import { loadPublicPagesConfig, type PublicPagesConfig, type PublicPageConfig } from '@/lib/publicClient';
import { useStepForm, useJourneySubmit } from '@/lib/journey';
import { createPublicPort } from '@/lib/journey/publicPort';
import { IntentWizardShell, type WizardStep } from '@/components/blocks/IntentWizardShell';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { Bound } from '@/components/blocks/Bound';
import { tx } from '@/i18n';

const SLUG = 'vorhaben-anlegen';

export default function VorhabenAnlegen() {
  const [cfg, setCfg] = useState<PublicPagesConfig | null>(null);
  const [page, setPage] = useState<PublicPageConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublicPagesConfig(SLUG).then(c => {
      setCfg(c);
      setPage(c?.pages[SLUG] ?? null);
      setLoading(false);
    });
  }, []);

  if (loading || !cfg || !page) {
    return <PublicShell loading={loading} unavailable={!loading} />;
  }
  return (
    <PublicShell title={page.title} description={page.description}>
      <Wizard cfg={cfg} page={page} />
    </PublicShell>
  );
}

function Wizard({ cfg, page }: { cfg: PublicPagesConfig; page: PublicPageConfig }) {
  const [step, setStep] = useState(1);
  const port = useMemo(() => createPublicPort(cfg, page), [cfg, page]);

  const form = useStepForm('vorhaben', {
    fields: ['titel', 'ziel', 'fachlicher_kontext', 'hintergrund_historie', 'start', 'zieltermin', 'naechster_schritt', 'ansprechpartner'],
    required: { titel: true, ziel: true },
    steps: {
      titel: 1, ziel: 1,
      fachlicher_kontext: 2, hintergrund_historie: 2,
      start: 3, zieltermin: 3, naechster_schritt: 3, ansprechpartner: 3,
    },
    autoComplete: true,
  });
  const submit = useJourneySubmit(
    port,
    [{ key: 'vorhaben', entity: 'vorhaben', form, primary: true }],
    { draftKey: SLUG },
  );

  const steps: WizardStep[] = [
    { label: tx('Titel und Ziel'), description: tx('Worum geht es bei deinem Vorhaben?') },
    { label: tx('Kontext und Hintergrund'), description: tx('Alles hier ist optional – schreib, was dir wichtig erscheint.') },
    { label: tx('Zeitplan und nächster Schritt'), description: tx('Wann soll es losgehen und was kommt als Nächstes?') },
    { label: tx('Prüfen') },
  ];

  const checkDates = (): boolean | string => {
    if (!form.validate(['start', 'zieltermin'])) return false;
    const s = form.get('start') as string | null;
    const z = form.get('zieltermin') as string | null;
    if (s && z && z < s) return tx('Der Zieltermin darf nicht vor dem Start liegen.');
    return true;
  };

  const restart = () => {
    submit.reset();
    form.reset();
    setStep(1);
  };

  return (
    <IntentWizardShell
      steps={steps}
      currentStep={step}
      onStepChange={setStep}
      back={false}
      forms={[form]}
      draftKey={SLUG}
    >
      {step === 1 && (
        <div className="space-y-4">
          <Bound form={form} name="titel" />
          <Bound form={form} name="ziel" rows={4} />
          <StepNav hideBack onNext={() => form.validate(['titel', 'ziel'])} nextStepLabel={tx('Kontext und Hintergrund')} />
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <Bound form={form} name="fachlicher_kontext" rows={4} />
          <Bound form={form} name="hintergrund_historie" rows={4} />
          <StepNav onBack={() => setStep(1)} nextStepLabel={tx('Zeitplan')} />
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Bound form={form} name="start" />
            <Bound form={form} name="zieltermin" />
          </div>
          <Bound form={form} name="naechster_schritt" />
          <Bound form={form} name="ansprechpartner" rows={3} />
          <StepNav onBack={() => setStep(2)} onNext={checkDates} nextStepLabel={tx('Prüfen')} />
        </div>
      )}
      {step === 4 && !submit.done && (
        <SummaryStep
          forms={[form]}
          submit={submit}
          whatHappensNext={tx('Wir haben dein Vorhaben danach vorliegen und das Team plant es als Nächstes ein.')}
        />
      )}
      {submit.result && (
        <SuccessStep
          result={submit.result}
          forms={[form]}
          title={tx('Dein Vorhaben ist bei uns angekommen')}
          whatHappensNext={tx('Vielen Dank! Das Team schaut sich dein Vorhaben an und plant es als Nächstes ein.')}
          next={[{ label: tx('Weiteres Vorhaben anlegen'), onClick: restart }]}
        />
      )}
    </IntentWizardShell>
  );
}
