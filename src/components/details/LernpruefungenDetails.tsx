import type { Lernpruefungen, Nutzer, Erfahrungen, Massnahmen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { usePermissions } from '@/lib/permissions';

export interface LernpruefungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Lernpruefungen;
  /** N:1-Ziel „Nutzer": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  nutzerList: Nutzer[];
  /** Klick auf die Nutzer-Relation → overlay.push auf dessen Detail. */
  onOpenNutzer?: (record: Nutzer) => void;
  /** N:1-Ziel „Erfahrungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  erfahrungenList: Erfahrungen[];
  /** Klick auf die Erfahrungen-Relation → overlay.push auf dessen Detail. */
  onOpenErfahrungen?: (record: Erfahrungen) => void;
  /** N:1-Ziel „Massnahmen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  massnahmenList: Massnahmen[];
  /** Reserviert — Massnahmen ist hier nur über ein Mehrfach-Feld verknüpft (Text-Join, keine Einzel-Relation); Übergabe erlaubt, aber ohne Wirkung. */
  onOpenMassnahmen?: (record: Massnahmen) => void;
}

export function LernpruefungenDetails({
  record,
  nutzerList,
  onOpenNutzer,
  erfahrungenList,
  onOpenErfahrungen,
  massnahmenList,
}: LernpruefungenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const prueferTarget = nutzerList.find(r => r.record_id === extractRecordId(record.fields.pruefer));
  const erfahrungTarget = erfahrungenList.find(r => r.record_id === extractRecordId(record.fields.erfahrung));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('lernpruefungen', 'pruefdatum')} value={record.fields.pruefdatum} format="date" />
        <RecordField label={fieldLabel('lernpruefungen', 'ergebnis')} value={record.fields.ergebnis} format="pill" />
        <RecordField label={fieldLabel('lernpruefungen', 'begruendung')} value={record.fields.begruendung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('lernpruefungen', 'gueltigkeitsbereich_neu')} value={record.fields.gueltigkeitsbereich_neu} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('lernpruefungen', 'wiederverwendbar_fuer')} value={record.fields.wiederverwendbar_fuer} format="text" />
        <RecordField label={fieldLabel('lernpruefungen', 'naechste_ueberpruefung')} value={record.fields.naechste_ueberpruefung} format="date" />
        <RecordField label={fieldLabel('lernpruefungen', 'belege_massnahmen')} value={Array.isArray(record.fields.belege_massnahmen) ? record.fields.belege_massnahmen.map((u: unknown) => massnahmenList.find(t => t.record_id === extractRecordId(u))?.fields.beschreibung ?? '—').join(', ') : null} format="text" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('lernpruefungen', 'pruefer')}
          name={prueferTarget?.fields.nutzer_firstname ?? '—'}
          meta={[prueferTarget?.fields.email].filter(Boolean).join(' · ') || undefined}
          onClick={prueferTarget && onOpenNutzer ? () => onOpenNutzer!(prueferTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('lernpruefungen', 'erfahrung')}
          name={erfahrungTarget?.fields.titel ?? '—'}
          meta={undefined}
          onClick={erfahrungTarget && onOpenErfahrungen ? () => onOpenErfahrungen!(erfahrungTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.LERNPRUEFUNGEN} recordId={record.record_id} readOnly={!perms.canWrite('lernpruefungen')} />
    </>
  );
}
