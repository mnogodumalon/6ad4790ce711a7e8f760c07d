import type { Erfahrungen, Vorhaben, Nutzer, Entscheidungen, Lernpruefungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface ErfahrungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Erfahrungen;
  /** N:1-Ziel „Vorhaben": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  vorhabenList: Vorhaben[];
  /** Klick auf die Vorhaben-Relation → overlay.push auf dessen Detail. */
  onOpenVorhaben?: (record: Vorhaben) => void;
  /** N:1-Ziel „Nutzer": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  nutzerList: Nutzer[];
  /** Klick auf die Nutzer-Relation → overlay.push auf dessen Detail. */
  onOpenNutzer?: (record: Nutzer) => void;
  /** N:1-Ziel „Entscheidungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  entscheidungenList: Entscheidungen[];
  /** Klick auf die Entscheidungen-Relation → overlay.push auf dessen Detail. */
  onOpenEntscheidungen?: (record: Entscheidungen) => void;
  /** 1:N „Lernprüfungen" (erfahrung): VOLLE Liste — der Block filtert auf diesen Record. */
  lernpruefungenList: Lernpruefungen[];
  /** Zeilen-Klick → overlay.push auf das Lernpruefungen-Detail (nie der Edit-Dialog). */
  onOpenLernpruefungen: (record: Lernpruefungen) => void;
  /** Kontextuelles „+": öffnet den Lernpruefungen-Dialog mit diesem Record vorgesetzt. */
  onAddLernpruefungen?: () => void;
}

export function ErfahrungenDetails({
  record,
  vorhabenList,
  onOpenVorhaben,
  nutzerList,
  onOpenNutzer,
  entscheidungenList,
  onOpenEntscheidungen,
  lernpruefungenList,
  onOpenLernpruefungen,
  onAddLernpruefungen,
}: ErfahrungenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const vorhabenTarget = vorhabenList.find(r => r.record_id === extractRecordId(record.fields.vorhaben));
  const wissenstraegerTarget = nutzerList.find(r => r.record_id === extractRecordId(record.fields.wissenstraeger));
  const erfasst_vonTarget = nutzerList.find(r => r.record_id === extractRecordId(record.fields.erfasst_von));
  const entscheidungTarget = entscheidungenList.find(r => r.record_id === extractRecordId(record.fields.entscheidung));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('erfahrungen', 'titel')} value={record.fields.titel} format="text" />
        <RecordField label={fieldLabel('erfahrungen', 'kategorie')} value={record.fields.kategorie} format="pill" />
        <RecordField label={fieldLabel('erfahrungen', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('erfahrungen', 'situation')} value={record.fields.situation} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('erfahrungen', 'erkenntnis')} value={record.fields.erkenntnis} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('erfahrungen', 'gueltigkeitsbereich')} value={record.fields.gueltigkeitsbereich} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('erfahrungen', 'grenzen')} value={record.fields.grenzen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('erfahrungen', 'status')} value={record.fields.status} format="pill" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('erfahrungen', 'vorhaben')}
          name={vorhabenTarget?.fields.titel ?? '—'}
          meta={[vorhabenTarget?.fields.naechster_schritt].filter(Boolean).join(' · ') || undefined}
          onClick={vorhabenTarget && onOpenVorhaben ? () => onOpenVorhaben!(vorhabenTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('erfahrungen', 'wissenstraeger')}
          name={wissenstraegerTarget?.fields.nutzer_firstname ?? '—'}
          meta={[wissenstraegerTarget?.fields.email].filter(Boolean).join(' · ') || undefined}
          onClick={wissenstraegerTarget && onOpenNutzer ? () => onOpenNutzer!(wissenstraegerTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('erfahrungen', 'erfasst_von')}
          name={erfasst_vonTarget?.fields.nutzer_firstname ?? '—'}
          meta={[erfasst_vonTarget?.fields.email].filter(Boolean).join(' · ') || undefined}
          onClick={erfasst_vonTarget && onOpenNutzer ? () => onOpenNutzer!(erfasst_vonTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('erfahrungen', 'entscheidung')}
          name={entscheidungTarget?.fields.entscheidungsfrage ?? '—'}
          meta={undefined}
          onClick={entscheidungTarget && onOpenEntscheidungen ? () => onOpenEntscheidungen!(entscheidungTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('lernpruefungen')}
        items={lernpruefungenList.filter(r => extractRecordId(r.fields.erfahrung) === record.record_id)}
        map={r => ({ name: r.fields.wiederverwendbar_fuer ?? appLabel('lernpruefungen'), meta: r.fields.pruefdatum })}
        onOpen={onOpenLernpruefungen}
        onAdd={onAddLernpruefungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.ERFAHRUNGEN} recordId={record.record_id} readOnly={!perms.canWrite('erfahrungen')} />
    </>
  );
}
