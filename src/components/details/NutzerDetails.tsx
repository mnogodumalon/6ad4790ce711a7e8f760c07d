import type { Nutzer, Vorhaben, Lernpruefungen, Erfahrungen, Entscheidungen, RegelnUndBerechtigungen, Alternativen, Massnahmen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface NutzerDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Nutzer;
  /** 1:N „Vorhaben" (verantwortlicher): VOLLE Liste — der Block filtert auf diesen Record. */
  vorhabenVerantwortlicherList: Vorhaben[];
  /** Zeilen-Klick → overlay.push auf das Vorhaben-Detail (nie der Edit-Dialog). */
  onOpenVorhabenVerantwortlicher: (record: Vorhaben) => void;
  /** Kontextuelles „+": öffnet den Vorhaben-Dialog mit diesem Record vorgesetzt. */
  onAddVorhabenVerantwortlicher?: () => void;
  /** 1:N „Vorhaben" (beteiligte): VOLLE Liste — der Block filtert auf diesen Record. */
  vorhabenBeteiligteList: Vorhaben[];
  /** Zeilen-Klick → overlay.push auf das Vorhaben-Detail (nie der Edit-Dialog). */
  onOpenVorhabenBeteiligte: (record: Vorhaben) => void;
  /** Kontextuelles „+": öffnet den Vorhaben-Dialog mit diesem Record vorgesetzt. */
  onAddVorhabenBeteiligte?: () => void;
  /** „Vorhandene wählen": Listenfeld-Rückbezug — hängt diesen Record an einen bestehenden Vorhaben-Datensatz. */
  onPickVorhabenBeteiligte?: () => void;
  /** 1:N „Lernprüfungen" (pruefer): VOLLE Liste — der Block filtert auf diesen Record. */
  lernpruefungenList: Lernpruefungen[];
  /** Zeilen-Klick → overlay.push auf das Lernpruefungen-Detail (nie der Edit-Dialog). */
  onOpenLernpruefungen: (record: Lernpruefungen) => void;
  /** Kontextuelles „+": öffnet den Lernpruefungen-Dialog mit diesem Record vorgesetzt. */
  onAddLernpruefungen?: () => void;
  /** 1:N „Erfahrungen" (wissenstraeger): VOLLE Liste — der Block filtert auf diesen Record. */
  erfahrungenWissenstraegerList: Erfahrungen[];
  /** Zeilen-Klick → overlay.push auf das Erfahrungen-Detail (nie der Edit-Dialog). */
  onOpenErfahrungenWissenstraeger: (record: Erfahrungen) => void;
  /** Kontextuelles „+": öffnet den Erfahrungen-Dialog mit diesem Record vorgesetzt. */
  onAddErfahrungenWissenstraeger?: () => void;
  /** 1:N „Erfahrungen" (erfasst_von): VOLLE Liste — der Block filtert auf diesen Record. */
  erfahrungenErfasstVonList: Erfahrungen[];
  /** Zeilen-Klick → overlay.push auf das Erfahrungen-Detail (nie der Edit-Dialog). */
  onOpenErfahrungenErfasstVon: (record: Erfahrungen) => void;
  /** Kontextuelles „+": öffnet den Erfahrungen-Dialog mit diesem Record vorgesetzt. */
  onAddErfahrungenErfasstVon?: () => void;
  /** 1:N „Entscheidungen" (zustaendiger): VOLLE Liste — der Block filtert auf diesen Record. */
  entscheidungenList: Entscheidungen[];
  /** Zeilen-Klick → overlay.push auf das Entscheidungen-Detail (nie der Edit-Dialog). */
  onOpenEntscheidungen: (record: Entscheidungen) => void;
  /** Kontextuelles „+": öffnet den Entscheidungen-Dialog mit diesem Record vorgesetzt. */
  onAddEntscheidungen?: () => void;
  /** 1:N „Regeln und Berechtigungen" (verantwortlicher): VOLLE Liste — der Block filtert auf diesen Record. */
  regelnUndBerechtigungenList: RegelnUndBerechtigungen[];
  /** Zeilen-Klick → overlay.push auf das RegelnUndBerechtigungen-Detail (nie der Edit-Dialog). */
  onOpenRegelnUndBerechtigungen: (record: RegelnUndBerechtigungen) => void;
  /** Kontextuelles „+": öffnet den RegelnUndBerechtigungen-Dialog mit diesem Record vorgesetzt. */
  onAddRegelnUndBerechtigungen?: () => void;
  /** 1:N „Alternativen" (vorgeschlagen_von): VOLLE Liste — der Block filtert auf diesen Record. */
  alternativenList: Alternativen[];
  /** Zeilen-Klick → overlay.push auf das Alternativen-Detail (nie der Edit-Dialog). */
  onOpenAlternativen: (record: Alternativen) => void;
  /** Kontextuelles „+": öffnet den Alternativen-Dialog mit diesem Record vorgesetzt. */
  onAddAlternativen?: () => void;
  /** 1:N „Maßnahmen" (vorgeschlagen_von): VOLLE Liste — der Block filtert auf diesen Record. */
  massnahmenVorgeschlagenVonList: Massnahmen[];
  /** Zeilen-Klick → overlay.push auf das Massnahmen-Detail (nie der Edit-Dialog). */
  onOpenMassnahmenVorgeschlagenVon: (record: Massnahmen) => void;
  /** Kontextuelles „+": öffnet den Massnahmen-Dialog mit diesem Record vorgesetzt. */
  onAddMassnahmenVorgeschlagenVon?: () => void;
  /** 1:N „Maßnahmen" (freigegeben_von): VOLLE Liste — der Block filtert auf diesen Record. */
  massnahmenFreigegebenVonList: Massnahmen[];
  /** Zeilen-Klick → overlay.push auf das Massnahmen-Detail (nie der Edit-Dialog). */
  onOpenMassnahmenFreigegebenVon: (record: Massnahmen) => void;
  /** Kontextuelles „+": öffnet den Massnahmen-Dialog mit diesem Record vorgesetzt. */
  onAddMassnahmenFreigegebenVon?: () => void;
}

export function NutzerDetails({
  record,
  vorhabenVerantwortlicherList,
  onOpenVorhabenVerantwortlicher,
  onAddVorhabenVerantwortlicher,
  vorhabenBeteiligteList,
  onOpenVorhabenBeteiligte,
  onAddVorhabenBeteiligte,
  onPickVorhabenBeteiligte,
  lernpruefungenList,
  onOpenLernpruefungen,
  onAddLernpruefungen,
  erfahrungenWissenstraegerList,
  onOpenErfahrungenWissenstraeger,
  onAddErfahrungenWissenstraeger,
  erfahrungenErfasstVonList,
  onOpenErfahrungenErfasstVon,
  onAddErfahrungenErfasstVon,
  entscheidungenList,
  onOpenEntscheidungen,
  onAddEntscheidungen,
  regelnUndBerechtigungenList,
  onOpenRegelnUndBerechtigungen,
  onAddRegelnUndBerechtigungen,
  alternativenList,
  onOpenAlternativen,
  onAddAlternativen,
  massnahmenVorgeschlagenVonList,
  onOpenMassnahmenVorgeschlagenVon,
  onAddMassnahmenVorgeschlagenVon,
  massnahmenFreigegebenVonList,
  onOpenMassnahmenFreigegebenVon,
  onAddMassnahmenFreigegebenVon,
}: NutzerDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('nutzer', 'nutzer_firstname')} value={record.fields.nutzer_firstname} format="text" />
        <RecordField label={fieldLabel('nutzer', 'nutzer_lastname')} value={record.fields.nutzer_lastname} format="text" />
        <RecordField label={fieldLabel('nutzer', 'email')} value={record.fields.email} format="email" />
        <RecordField label={fieldLabel('nutzer', 'art')} value={record.fields.art} format="pill" />
        <RecordField label={fieldLabel('nutzer', 'rolle')} value={record.fields.rolle} format="pill" />
        <RecordField label={fieldLabel('nutzer', 'fachgebiet')} value={record.fields.fachgebiet} format="text" />
        <RecordField label={fieldLabel('nutzer', 'verantwortungsbereich')} value={record.fields.verantwortungsbereich} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('nutzer', 'aktiv')} value={record.fields.aktiv} format="bool" />
      </RecordSection>

      <SatelliteSection
        title={`${appLabel('vorhaben')} · ${fieldLabel('vorhaben', 'verantwortlicher')}`}
        items={vorhabenVerantwortlicherList.filter(r => extractRecordId(r.fields.verantwortlicher) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('vorhaben'), meta: r.fields.start })}
        onOpen={onOpenVorhabenVerantwortlicher}
        onAdd={onAddVorhabenVerantwortlicher}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('vorhaben')} · ${fieldLabel('vorhaben', 'beteiligte')}`}
        items={vorhabenBeteiligteList.filter(r => Array.isArray(r.fields.beteiligte) && r.fields.beteiligte.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: r.fields.titel ?? appLabel('vorhaben'), meta: r.fields.start })}
        onOpen={onOpenVorhabenBeteiligte}
        onAdd={onAddVorhabenBeteiligte}
        onPick={onPickVorhabenBeteiligte}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('lernpruefungen')}
        items={lernpruefungenList.filter(r => extractRecordId(r.fields.pruefer) === record.record_id)}
        map={r => ({ name: r.fields.wiederverwendbar_fuer ?? appLabel('lernpruefungen'), meta: r.fields.pruefdatum })}
        onOpen={onOpenLernpruefungen}
        onAdd={onAddLernpruefungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('erfahrungen')} · ${fieldLabel('erfahrungen', 'wissenstraeger')}`}
        items={erfahrungenWissenstraegerList.filter(r => extractRecordId(r.fields.wissenstraeger) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('erfahrungen'), meta: undefined })}
        onOpen={onOpenErfahrungenWissenstraeger}
        onAdd={onAddErfahrungenWissenstraeger}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('erfahrungen')} · ${fieldLabel('erfahrungen', 'erfasst_von')}`}
        items={erfahrungenErfasstVonList.filter(r => extractRecordId(r.fields.erfasst_von) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('erfahrungen'), meta: undefined })}
        onOpen={onOpenErfahrungenErfasstVon}
        onAdd={onAddErfahrungenErfasstVon}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('entscheidungen')}
        items={entscheidungenList.filter(r => extractRecordId(r.fields.zustaendiger) === record.record_id)}
        map={r => ({ name: appLabel('entscheidungen'), meta: r.fields.frist })}
        onOpen={onOpenEntscheidungen}
        onAdd={onAddEntscheidungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('regeln_und_berechtigungen')}
        items={regelnUndBerechtigungenList.filter(r => extractRecordId(r.fields.verantwortlicher) === record.record_id)}
        map={r => ({ name: r.fields.bezeichnung ?? appLabel('regeln_und_berechtigungen'), meta: r.fields.gueltig_ab })}
        onOpen={onOpenRegelnUndBerechtigungen}
        onAdd={onAddRegelnUndBerechtigungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('alternativen')}
        items={alternativenList.filter(r => extractRecordId(r.fields.vorgeschlagen_von) === record.record_id)}
        map={r => ({ name: r.fields.bezeichnung ?? appLabel('alternativen'), meta: undefined })}
        onOpen={onOpenAlternativen}
        onAdd={onAddAlternativen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('massnahmen')} · ${fieldLabel('massnahmen', 'vorgeschlagen_von')}`}
        items={massnahmenVorgeschlagenVonList.filter(r => extractRecordId(r.fields.vorgeschlagen_von) === record.record_id)}
        map={r => ({ name: appLabel('massnahmen'), meta: r.fields.freigabedatum })}
        onOpen={onOpenMassnahmenVorgeschlagenVon}
        onAdd={onAddMassnahmenVorgeschlagenVon}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('massnahmen')} · ${fieldLabel('massnahmen', 'freigegeben_von')}`}
        items={massnahmenFreigegebenVonList.filter(r => extractRecordId(r.fields.freigegeben_von) === record.record_id)}
        map={r => ({ name: appLabel('massnahmen'), meta: r.fields.freigabedatum })}
        onOpen={onOpenMassnahmenFreigegebenVon}
        onAdd={onAddMassnahmenFreigegebenVon}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.NUTZER} recordId={record.record_id} readOnly={!perms.canWrite('nutzer')} />
    </>
  );
}
