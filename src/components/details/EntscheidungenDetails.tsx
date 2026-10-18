import type { Entscheidungen, Alternativen, Vorhaben, RegelnUndBerechtigungen, Nutzer, Erfahrungen, Massnahmen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface EntscheidungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Entscheidungen;
  /** N:1-Ziel „Alternativen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  alternativenList: Alternativen[];
  /** Klick auf die Alternativen-Relation → overlay.push auf dessen Detail. */
  onOpenAlternativen?: (record: Alternativen) => void;
  /** N:1-Ziel „Vorhaben": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  vorhabenList: Vorhaben[];
  /** Klick auf die Vorhaben-Relation → overlay.push auf dessen Detail. */
  onOpenVorhaben?: (record: Vorhaben) => void;
  /** N:1-Ziel „RegelnUndBerechtigungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  regelnUndBerechtigungenList: RegelnUndBerechtigungen[];
  /** Reserviert — RegelnUndBerechtigungen ist hier nur über ein Mehrfach-Feld verknüpft (Text-Join, keine Einzel-Relation); Übergabe erlaubt, aber ohne Wirkung. */
  onOpenRegelnUndBerechtigungen?: (record: RegelnUndBerechtigungen) => void;
  /** N:1-Ziel „Nutzer": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  nutzerList: Nutzer[];
  /** Klick auf die Nutzer-Relation → overlay.push auf dessen Detail. */
  onOpenNutzer?: (record: Nutzer) => void;
  /** 1:N „Erfahrungen" (entscheidung): VOLLE Liste — der Block filtert auf diesen Record. */
  erfahrungenList: Erfahrungen[];
  /** Zeilen-Klick → overlay.push auf das Erfahrungen-Detail (nie der Edit-Dialog). */
  onOpenErfahrungen: (record: Erfahrungen) => void;
  /** Kontextuelles „+": öffnet den Erfahrungen-Dialog mit diesem Record vorgesetzt. */
  onAddErfahrungen?: () => void;
  /** 1:N „Alternativen" (entscheidung): VOLLE Liste — der Block filtert auf diesen Record. */
  alternativenEntscheidungList: Alternativen[];
  /** Zeilen-Klick → overlay.push auf das Alternativen-Detail (nie der Edit-Dialog). */
  onOpenAlternativenEntscheidung: (record: Alternativen) => void;
  /** Kontextuelles „+": öffnet den Alternativen-Dialog mit diesem Record vorgesetzt. */
  onAddAlternativenEntscheidung?: () => void;
  /** 1:N „Maßnahmen" (entscheidung): VOLLE Liste — der Block filtert auf diesen Record. */
  massnahmenList: Massnahmen[];
  /** Zeilen-Klick → overlay.push auf das Massnahmen-Detail (nie der Edit-Dialog). */
  onOpenMassnahmen: (record: Massnahmen) => void;
  /** Kontextuelles „+": öffnet den Massnahmen-Dialog mit diesem Record vorgesetzt. */
  onAddMassnahmen?: () => void;
}

export function EntscheidungenDetails({
  record,
  alternativenList,
  onOpenAlternativen,
  vorhabenList,
  onOpenVorhaben,
  regelnUndBerechtigungenList,
  nutzerList,
  onOpenNutzer,
  erfahrungenList,
  onOpenErfahrungen,
  onAddErfahrungen,
  alternativenEntscheidungList,
  onOpenAlternativenEntscheidung,
  onAddAlternativenEntscheidung,
  massnahmenList,
  onOpenMassnahmen,
  onAddMassnahmen,
}: EntscheidungenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const gewaehlte_optionTarget = alternativenList.find(r => r.record_id === extractRecordId(record.fields.gewaehlte_option));
  const vorhabenTarget = vorhabenList.find(r => r.record_id === extractRecordId(record.fields.vorhaben));
  const zustaendigerTarget = nutzerList.find(r => r.record_id === extractRecordId(record.fields.zustaendiger));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('entscheidungen', 'entscheidungsfrage')} value={record.fields.entscheidungsfrage} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('entscheidungen', 'situationstyp')} value={record.fields.situationstyp} format="pill" />
        <RecordField label={fieldLabel('entscheidungen', 'gesicherte_fakten')} value={record.fields.gesicherte_fakten} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('entscheidungen', 'offene_annahmen')} value={record.fields.offene_annahmen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('entscheidungen', 'fehlende_informationen')} value={record.fields.fehlende_informationen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('entscheidungen', 'geltende_regeln')} value={Array.isArray(record.fields.geltende_regeln) ? record.fields.geltende_regeln.map((u: unknown) => regelnUndBerechtigungenList.find(t => t.record_id === extractRecordId(u))?.fields.bezeichnung ?? '—').join(', ') : null} format="text" />
        <RecordField label={fieldLabel('entscheidungen', 'frist')} value={record.fields.frist} format="date" />
        <RecordField label={fieldLabel('entscheidungen', 'status')} value={record.fields.status} format="pill" />
        <RecordField label={fieldLabel('entscheidungen', 'begruendung')} value={record.fields.begruendung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('entscheidungen', 'entscheidungsdatum')} value={record.fields.entscheidungsdatum} format="date" />
        <RecordField label={fieldLabel('entscheidungen', 'umsetzungsplan')} value={record.fields.umsetzungsplan} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('entscheidungen', 'erwartetes_ergebnis')} value={record.fields.erwartetes_ergebnis} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('entscheidungen', 'tatsaechliches_ergebnis')} value={record.fields.tatsaechliches_ergebnis} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('entscheidungen', 'gewaehlte_option')}
          name={gewaehlte_optionTarget?.fields.bezeichnung ?? '—'}
          meta={[gewaehlte_optionTarget?.fields.aufwand].filter(Boolean).join(' · ') || undefined}
          onClick={gewaehlte_optionTarget && onOpenAlternativen ? () => onOpenAlternativen!(gewaehlte_optionTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('entscheidungen', 'vorhaben')}
          name={vorhabenTarget?.fields.titel ?? '—'}
          meta={[vorhabenTarget?.fields.naechster_schritt].filter(Boolean).join(' · ') || undefined}
          onClick={vorhabenTarget && onOpenVorhaben ? () => onOpenVorhaben!(vorhabenTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('entscheidungen', 'zustaendiger')}
          name={zustaendigerTarget?.fields.nutzer_firstname ?? '—'}
          meta={[zustaendigerTarget?.fields.email].filter(Boolean).join(' · ') || undefined}
          onClick={zustaendigerTarget && onOpenNutzer ? () => onOpenNutzer!(zustaendigerTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('erfahrungen')}
        items={erfahrungenList.filter(r => extractRecordId(r.fields.entscheidung) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('erfahrungen'), meta: undefined })}
        onOpen={onOpenErfahrungen}
        onAdd={onAddErfahrungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('alternativen')} · ${fieldLabel('alternativen', 'entscheidung')}`}
        items={alternativenEntscheidungList.filter(r => extractRecordId(r.fields.entscheidung) === record.record_id)}
        map={r => ({ name: r.fields.bezeichnung ?? appLabel('alternativen'), meta: undefined })}
        onOpen={onOpenAlternativenEntscheidung}
        onAdd={onAddAlternativenEntscheidung}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('massnahmen')}
        items={massnahmenList.filter(r => extractRecordId(r.fields.entscheidung) === record.record_id)}
        map={r => ({ name: appLabel('massnahmen'), meta: r.fields.freigabedatum })}
        onOpen={onOpenMassnahmen}
        onAdd={onAddMassnahmen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.ENTSCHEIDUNGEN} recordId={record.record_id} readOnly={!perms.canWrite('entscheidungen')} />
    </>
  );
}
