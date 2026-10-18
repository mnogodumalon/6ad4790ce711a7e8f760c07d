import type { Massnahmen, Entscheidungen, Vorhaben, Nutzer, Lernpruefungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface MassnahmenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Massnahmen;
  /** N:1-Ziel „Entscheidungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  entscheidungenList: Entscheidungen[];
  /** Klick auf die Entscheidungen-Relation → overlay.push auf dessen Detail. */
  onOpenEntscheidungen?: (record: Entscheidungen) => void;
  /** N:1-Ziel „Vorhaben": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  vorhabenList: Vorhaben[];
  /** Klick auf die Vorhaben-Relation → overlay.push auf dessen Detail. */
  onOpenVorhaben?: (record: Vorhaben) => void;
  /** N:1-Ziel „Nutzer": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  nutzerList: Nutzer[];
  /** Klick auf die Nutzer-Relation → overlay.push auf dessen Detail. */
  onOpenNutzer?: (record: Nutzer) => void;
  /** 1:N „Lernprüfungen" (belege_massnahmen): VOLLE Liste — der Block filtert auf diesen Record. */
  lernpruefungenList: Lernpruefungen[];
  /** Zeilen-Klick → overlay.push auf das Lernpruefungen-Detail (nie der Edit-Dialog). */
  onOpenLernpruefungen: (record: Lernpruefungen) => void;
  /** Kontextuelles „+": öffnet den Lernpruefungen-Dialog mit diesem Record vorgesetzt. */
  onAddLernpruefungen?: () => void;
  /** „Vorhandene wählen": Listenfeld-Rückbezug — hängt diesen Record an einen bestehenden Lernpruefungen-Datensatz. */
  onPickLernpruefungen?: () => void;
}

export function MassnahmenDetails({
  record,
  entscheidungenList,
  onOpenEntscheidungen,
  vorhabenList,
  onOpenVorhaben,
  nutzerList,
  onOpenNutzer,
  lernpruefungenList,
  onOpenLernpruefungen,
  onAddLernpruefungen,
  onPickLernpruefungen,
}: MassnahmenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const entscheidungTarget = entscheidungenList.find(r => r.record_id === extractRecordId(record.fields.entscheidung));
  const vorhabenTarget = vorhabenList.find(r => r.record_id === extractRecordId(record.fields.vorhaben));
  const vorgeschlagen_vonTarget = nutzerList.find(r => r.record_id === extractRecordId(record.fields.vorgeschlagen_von));
  const freigegeben_vonTarget = nutzerList.find(r => r.record_id === extractRecordId(record.fields.freigegeben_von));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('massnahmen', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('massnahmen', 'herkunft')} value={record.fields.herkunft} format="pill" />
        <RecordField label={fieldLabel('massnahmen', 'status')} value={record.fields.status} format="pill" />
        <RecordField label={fieldLabel('massnahmen', 'freigabedatum')} value={record.fields.freigabedatum} format="datetime" />
        <RecordField label={fieldLabel('massnahmen', 'zustandsaenderung')} value={record.fields.zustandsaenderung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('massnahmen', 'umsetzungsdatum')} value={record.fields.umsetzungsdatum} format="date" />
        <RecordField label={fieldLabel('massnahmen', 'tatsaechliches_ergebnis')} value={record.fields.tatsaechliches_ergebnis} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('massnahmen', 'abweichung')} value={record.fields.abweichung} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('massnahmen', 'entscheidung')}
          name={entscheidungTarget?.fields.entscheidungsfrage ?? '—'}
          meta={undefined}
          onClick={entscheidungTarget && onOpenEntscheidungen ? () => onOpenEntscheidungen!(entscheidungTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('massnahmen', 'vorhaben')}
          name={vorhabenTarget?.fields.titel ?? '—'}
          meta={[vorhabenTarget?.fields.naechster_schritt].filter(Boolean).join(' · ') || undefined}
          onClick={vorhabenTarget && onOpenVorhaben ? () => onOpenVorhaben!(vorhabenTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('massnahmen', 'vorgeschlagen_von')}
          name={vorgeschlagen_vonTarget?.fields.nutzer_firstname ?? '—'}
          meta={[vorgeschlagen_vonTarget?.fields.email].filter(Boolean).join(' · ') || undefined}
          onClick={vorgeschlagen_vonTarget && onOpenNutzer ? () => onOpenNutzer!(vorgeschlagen_vonTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('massnahmen', 'freigegeben_von')}
          name={freigegeben_vonTarget?.fields.nutzer_firstname ?? '—'}
          meta={[freigegeben_vonTarget?.fields.email].filter(Boolean).join(' · ') || undefined}
          onClick={freigegeben_vonTarget && onOpenNutzer ? () => onOpenNutzer!(freigegeben_vonTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('lernpruefungen')}
        items={lernpruefungenList.filter(r => Array.isArray(r.fields.belege_massnahmen) && r.fields.belege_massnahmen.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: r.fields.wiederverwendbar_fuer ?? appLabel('lernpruefungen'), meta: r.fields.pruefdatum })}
        onOpen={onOpenLernpruefungen}
        onAdd={onAddLernpruefungen}
        onPick={onPickLernpruefungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.MASSNAHMEN} recordId={record.record_id} readOnly={!perms.canWrite('massnahmen')} />
    </>
  );
}
