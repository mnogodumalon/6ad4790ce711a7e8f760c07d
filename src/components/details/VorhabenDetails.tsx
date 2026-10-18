import type { Vorhaben, Nutzer, RegelnUndBerechtigungen, Erfahrungen, Entscheidungen, Massnahmen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { MediaThumbnail } from '@/components/widgets/MediaViewer';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface VorhabenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Vorhaben;
  /** N:1-Ziel „Nutzer": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  nutzerList: Nutzer[];
  /** Klick auf die Nutzer-Relation → overlay.push auf dessen Detail. */
  onOpenNutzer?: (record: Nutzer) => void;
  /** N:1-Ziel „RegelnUndBerechtigungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  regelnUndBerechtigungenList: RegelnUndBerechtigungen[];
  /** Reserviert — RegelnUndBerechtigungen ist hier nur über ein Mehrfach-Feld verknüpft (Text-Join, keine Einzel-Relation); Übergabe erlaubt, aber ohne Wirkung. */
  onOpenRegelnUndBerechtigungen?: (record: RegelnUndBerechtigungen) => void;
  /** 1:N „Erfahrungen" (vorhaben): VOLLE Liste — der Block filtert auf diesen Record. */
  erfahrungenList: Erfahrungen[];
  /** Zeilen-Klick → overlay.push auf das Erfahrungen-Detail (nie der Edit-Dialog). */
  onOpenErfahrungen: (record: Erfahrungen) => void;
  /** Kontextuelles „+": öffnet den Erfahrungen-Dialog mit diesem Record vorgesetzt. */
  onAddErfahrungen?: () => void;
  /** 1:N „Entscheidungen" (vorhaben): VOLLE Liste — der Block filtert auf diesen Record. */
  entscheidungenList: Entscheidungen[];
  /** Zeilen-Klick → overlay.push auf das Entscheidungen-Detail (nie der Edit-Dialog). */
  onOpenEntscheidungen: (record: Entscheidungen) => void;
  /** Kontextuelles „+": öffnet den Entscheidungen-Dialog mit diesem Record vorgesetzt. */
  onAddEntscheidungen?: () => void;
  /** 1:N „Maßnahmen" (vorhaben): VOLLE Liste — der Block filtert auf diesen Record. */
  massnahmenList: Massnahmen[];
  /** Zeilen-Klick → overlay.push auf das Massnahmen-Detail (nie der Edit-Dialog). */
  onOpenMassnahmen: (record: Massnahmen) => void;
  /** Kontextuelles „+": öffnet den Massnahmen-Dialog mit diesem Record vorgesetzt. */
  onAddMassnahmen?: () => void;
}

export function VorhabenDetails({
  record,
  nutzerList,
  onOpenNutzer,
  regelnUndBerechtigungenList,
  erfahrungenList,
  onOpenErfahrungen,
  onAddErfahrungen,
  entscheidungenList,
  onOpenEntscheidungen,
  onAddEntscheidungen,
  massnahmenList,
  onOpenMassnahmen,
  onAddMassnahmen,
}: VorhabenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const verantwortlicherTarget = nutzerList.find(r => r.record_id === extractRecordId(record.fields.verantwortlicher));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('vorhaben', 'titel')} value={record.fields.titel} format="text" />
        <RecordField label={fieldLabel('vorhaben', 'ziel')} value={record.fields.ziel} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('vorhaben', 'fachlicher_kontext')} value={record.fields.fachlicher_kontext} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('vorhaben', 'hintergrund_historie')} value={record.fields.hintergrund_historie} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('vorhaben', 'arbeitszustand')} value={record.fields.arbeitszustand} format="pill" />
        <RecordField label={fieldLabel('vorhaben', 'naechster_schritt')} value={record.fields.naechster_schritt} format="text" />
        <RecordField label={fieldLabel('vorhaben', 'beteiligte')} value={Array.isArray(record.fields.beteiligte) ? record.fields.beteiligte.map((u: unknown) => nutzerList.find(t => t.record_id === extractRecordId(u))?.fields.nutzer_firstname ?? '—').join(', ') : null} format="text" />
        <RecordField label={fieldLabel('vorhaben', 'geltende_regeln')} value={Array.isArray(record.fields.geltende_regeln) ? record.fields.geltende_regeln.map((u: unknown) => regelnUndBerechtigungenList.find(t => t.record_id === extractRecordId(u))?.fields.bezeichnung ?? '—').join(', ') : null} format="text" />
        <RecordField label={fieldLabel('vorhaben', 'ansprechpartner')} value={record.fields.ansprechpartner} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('vorhaben', 'start')} value={record.fields.start} format="date" />
        <RecordField label={fieldLabel('vorhaben', 'zieltermin')} value={record.fields.zieltermin} format="date" />
        <RecordField label={fieldLabel('vorhaben', 'dokumentation')} className="md:col-span-2">
          {record.fields.dokumentation ? (
            <MediaThumbnail src={record.fields.dokumentation as string} fit="contain" className="max-h-64 w-full rounded-lg" />
          ) : '—'}
        </RecordField>
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('vorhaben', 'verantwortlicher')}
          name={verantwortlicherTarget?.fields.nutzer_firstname ?? '—'}
          meta={[verantwortlicherTarget?.fields.email].filter(Boolean).join(' · ') || undefined}
          onClick={verantwortlicherTarget && onOpenNutzer ? () => onOpenNutzer!(verantwortlicherTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('erfahrungen')}
        items={erfahrungenList.filter(r => extractRecordId(r.fields.vorhaben) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('erfahrungen'), meta: undefined })}
        onOpen={onOpenErfahrungen}
        onAdd={onAddErfahrungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('entscheidungen')}
        items={entscheidungenList.filter(r => extractRecordId(r.fields.vorhaben) === record.record_id)}
        map={r => ({ name: appLabel('entscheidungen'), meta: r.fields.frist })}
        onOpen={onOpenEntscheidungen}
        onAdd={onAddEntscheidungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('massnahmen')}
        items={massnahmenList.filter(r => extractRecordId(r.fields.vorhaben) === record.record_id)}
        map={r => ({ name: appLabel('massnahmen'), meta: r.fields.freigabedatum })}
        onOpen={onOpenMassnahmen}
        onAdd={onAddMassnahmen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.VORHABEN} recordId={record.record_id} readOnly={!perms.canWrite('vorhaben')} />
    </>
  );
}
