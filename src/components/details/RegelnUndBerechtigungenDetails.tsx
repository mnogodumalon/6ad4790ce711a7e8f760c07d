import type { RegelnUndBerechtigungen, Nutzer, Vorhaben, Entscheidungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface RegelnUndBerechtigungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: RegelnUndBerechtigungen;
  /** N:1-Ziel „Nutzer": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  nutzerList: Nutzer[];
  /** Klick auf die Nutzer-Relation → overlay.push auf dessen Detail. */
  onOpenNutzer?: (record: Nutzer) => void;
  /** 1:N „Vorhaben" (geltende_regeln): VOLLE Liste — der Block filtert auf diesen Record. */
  vorhabenList: Vorhaben[];
  /** Zeilen-Klick → overlay.push auf das Vorhaben-Detail (nie der Edit-Dialog). */
  onOpenVorhaben: (record: Vorhaben) => void;
  /** Kontextuelles „+": öffnet den Vorhaben-Dialog mit diesem Record vorgesetzt. */
  onAddVorhaben?: () => void;
  /** „Vorhandene wählen": Listenfeld-Rückbezug — hängt diesen Record an einen bestehenden Vorhaben-Datensatz. */
  onPickVorhaben?: () => void;
  /** 1:N „Entscheidungen" (geltende_regeln): VOLLE Liste — der Block filtert auf diesen Record. */
  entscheidungenList: Entscheidungen[];
  /** Zeilen-Klick → overlay.push auf das Entscheidungen-Detail (nie der Edit-Dialog). */
  onOpenEntscheidungen: (record: Entscheidungen) => void;
  /** Kontextuelles „+": öffnet den Entscheidungen-Dialog mit diesem Record vorgesetzt. */
  onAddEntscheidungen?: () => void;
  /** „Vorhandene wählen": Listenfeld-Rückbezug — hängt diesen Record an einen bestehenden Entscheidungen-Datensatz. */
  onPickEntscheidungen?: () => void;
}

export function RegelnUndBerechtigungenDetails({
  record,
  nutzerList,
  onOpenNutzer,
  vorhabenList,
  onOpenVorhaben,
  onAddVorhaben,
  onPickVorhaben,
  entscheidungenList,
  onOpenEntscheidungen,
  onAddEntscheidungen,
  onPickEntscheidungen,
}: RegelnUndBerechtigungenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const verantwortlicherTarget = nutzerList.find(r => r.record_id === extractRecordId(record.fields.verantwortlicher));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('regeln_und_berechtigungen', 'bezeichnung')} value={record.fields.bezeichnung} format="text" />
        <RecordField label={fieldLabel('regeln_und_berechtigungen', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('regeln_und_berechtigungen', 'regeltyp')} value={record.fields.regeltyp} format="pill" />
        <RecordField label={fieldLabel('regeln_und_berechtigungen', 'geltungsbereich')} value={record.fields.geltungsbereich} format="text" />
        <RecordField label={fieldLabel('regeln_und_berechtigungen', 'betroffene_rolle')} value={record.fields.betroffene_rolle} format="pill" />
        <RecordField label={fieldLabel('regeln_und_berechtigungen', 'freigabepflicht')} value={record.fields.freigabepflicht} format="bool" />
        <RecordField label={fieldLabel('regeln_und_berechtigungen', 'gueltig_ab')} value={record.fields.gueltig_ab} format="date" />
        <RecordField label={fieldLabel('regeln_und_berechtigungen', 'status')} value={record.fields.status} format="pill" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('regeln_und_berechtigungen', 'verantwortlicher')}
          name={verantwortlicherTarget?.fields.nutzer_firstname ?? '—'}
          meta={[verantwortlicherTarget?.fields.email].filter(Boolean).join(' · ') || undefined}
          onClick={verantwortlicherTarget && onOpenNutzer ? () => onOpenNutzer!(verantwortlicherTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('vorhaben')}
        items={vorhabenList.filter(r => Array.isArray(r.fields.geltende_regeln) && r.fields.geltende_regeln.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: r.fields.titel ?? appLabel('vorhaben'), meta: r.fields.start })}
        onOpen={onOpenVorhaben}
        onAdd={onAddVorhaben}
        onPick={onPickVorhaben}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('entscheidungen')}
        items={entscheidungenList.filter(r => Array.isArray(r.fields.geltende_regeln) && r.fields.geltende_regeln.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: appLabel('entscheidungen'), meta: r.fields.frist })}
        onOpen={onOpenEntscheidungen}
        onAdd={onAddEntscheidungen}
        onPick={onPickEntscheidungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.REGELN_UND_BERECHTIGUNGEN} recordId={record.record_id} readOnly={!perms.canWrite('regeln_und_berechtigungen')} />
    </>
  );
}
