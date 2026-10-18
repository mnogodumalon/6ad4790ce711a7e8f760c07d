import type { Alternativen, Nutzer, Entscheidungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface AlternativenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Alternativen;
  /** N:1-Ziel „Nutzer": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  nutzerList: Nutzer[];
  /** Klick auf die Nutzer-Relation → overlay.push auf dessen Detail. */
  onOpenNutzer?: (record: Nutzer) => void;
  /** N:1-Ziel „Entscheidungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  entscheidungenList: Entscheidungen[];
  /** Klick auf die Entscheidungen-Relation → overlay.push auf dessen Detail. */
  onOpenEntscheidungen?: (record: Entscheidungen) => void;
  /** 1:N „Entscheidungen" (gewaehlte_option): VOLLE Liste — der Block filtert auf diesen Record. */
  entscheidungenGewaehlteOptionList: Entscheidungen[];
  /** Zeilen-Klick → overlay.push auf das Entscheidungen-Detail (nie der Edit-Dialog). */
  onOpenEntscheidungenGewaehlteOption: (record: Entscheidungen) => void;
  /** Kontextuelles „+": öffnet den Entscheidungen-Dialog mit diesem Record vorgesetzt. */
  onAddEntscheidungenGewaehlteOption?: () => void;
}

export function AlternativenDetails({
  record,
  nutzerList,
  onOpenNutzer,
  entscheidungenList,
  onOpenEntscheidungen,
  entscheidungenGewaehlteOptionList,
  onOpenEntscheidungenGewaehlteOption,
  onAddEntscheidungenGewaehlteOption,
}: AlternativenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const vorgeschlagen_vonTarget = nutzerList.find(r => r.record_id === extractRecordId(record.fields.vorgeschlagen_von));
  const entscheidungTarget = entscheidungenList.find(r => r.record_id === extractRecordId(record.fields.entscheidung));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('alternativen', 'bezeichnung')} value={record.fields.bezeichnung} format="text" />
        <RecordField label={fieldLabel('alternativen', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('alternativen', 'konsequenzen')} value={record.fields.konsequenzen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('alternativen', 'risiken')} value={record.fields.risiken} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('alternativen', 'aufwand')} value={record.fields.aufwand} format="text" />
        <RecordField label={fieldLabel('alternativen', 'empfehlungsgrad')} value={record.fields.empfehlungsgrad} format="pill" />
        <RecordField label={fieldLabel('alternativen', 'herkunft')} value={record.fields.herkunft} format="pill" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('alternativen', 'vorgeschlagen_von')}
          name={vorgeschlagen_vonTarget?.fields.nutzer_firstname ?? '—'}
          meta={[vorgeschlagen_vonTarget?.fields.email].filter(Boolean).join(' · ') || undefined}
          onClick={vorgeschlagen_vonTarget && onOpenNutzer ? () => onOpenNutzer!(vorgeschlagen_vonTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('alternativen', 'entscheidung')}
          name={entscheidungTarget?.fields.entscheidungsfrage ?? '—'}
          meta={undefined}
          onClick={entscheidungTarget && onOpenEntscheidungen ? () => onOpenEntscheidungen!(entscheidungTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={`${appLabel('entscheidungen')} · ${fieldLabel('entscheidungen', 'gewaehlte_option')}`}
        items={entscheidungenGewaehlteOptionList.filter(r => extractRecordId(r.fields.gewaehlte_option) === record.record_id)}
        map={r => ({ name: appLabel('entscheidungen'), meta: r.fields.frist })}
        onOpen={onOpenEntscheidungenGewaehlteOption}
        onAdd={onAddEntscheidungenGewaehlteOption}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.ALTERNATIVEN} recordId={record.record_id} readOnly={!perms.canWrite('alternativen')} />
    </>
  );
}
