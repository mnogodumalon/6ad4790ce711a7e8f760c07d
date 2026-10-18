/**
 * EntscheidungenDialog — pre-generated create/edit dialog for Entscheidungen.
 *
 * Props: open, onClose, onSubmit(fields) => Promise<void>, defaultValues?,
 * recordId? (pass when EDITING — enables the attachments section),
 * alternativenList (full hook array — resolves the Alternativen applookup),
 * vorhabenList (full hook array — resolves the Vorhaben applookup),
 * regelnUndBerechtigungenList (full hook array — resolves the RegelnUndBerechtigungen applookup),
 * nutzerList (full hook array — resolves the Nutzer applookup),
 * enablePhotoScan?, enablePhotoLocation?.
 *
 * defaultValues is SHAPE-TOLERANT and its prop type is the EXPORTED
 * EntscheidungenDialogDefaults — NOT the entity field type: lookup fields accept
 * the bare KEY string (or LookupValue), applookup fields the bare record id
 * (or record URL); the dialog normalizes. Type prefill STATE with the export:
 *  ❌ useState<Partial<Entscheidungen['fields']>>({ … })   // LookupValue fields reject string prefills (TS2322)
 *  ✓ useState<EntscheidungenDialogDefaults | undefined>(undefined)
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Entscheidungen, Alternativen, Vorhaben, RegelnUndBerechtigungen, Nutzer, LookupValue } from '@/types/app';
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import { extractRecordId, createRecordUrl, cleanFieldsForApi, extractRecordIds, getUserProfile, LivingAppsService } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ComputedContext } from '@/config/form-enhancements/types';
import { applyFieldOrder, flattenFieldOrder, applyDefaults, evalComputed, numberInputProps, clampNumberValue, classifyComputed, extractApplookupRefs, mergeApplookupRefs, resolveApplookupRef } from '@/config/form-enhancements/types';
import { formEnhancements, computedDeps, computedApplookupRefs } from '@/config/form-enhancements/Entscheidungen';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { requiredMessage } from '@/lib/journey/messages';
import { t, appLabel, fieldLabel, lookupLabel, localeTag, CURRENCY } from '@/i18n';
import { Textarea } from '@/components/ui/textarea';
import { Combobox, MultiCombobox } from '@/components/Combobox';
import { AlternativenDialog } from '@/components/dialogs/AlternativenDialog';
import { VorhabenDialog } from '@/components/dialogs/VorhabenDialog';
import { RegelnUndBerechtigungenDialog } from '@/components/dialogs/RegelnUndBerechtigungenDialog';
import { NutzerDialog } from '@/components/dialogs/NutzerDialog';
import { DatePicker } from '@/components/DatePicker';
import { Checkbox } from '@/components/ui/checkbox';
import { IconAlertCircle, IconCamera, IconChevronDown, IconCircleCheck, IconClipboard, IconFileText, IconLoader2, IconPhotoPlus, IconSparkles, IconUpload, IconX } from '@tabler/icons-react';
import { fileToDataUri, extractFromInput, extractPhotoMeta, reverseGeocode } from '@/lib/ai';
import { lookupKey } from '@/lib/formatters';

/** Widened prefill type for EntscheidungenDialog.defaultValues — see file header. */
export type EntscheidungenDialogDefaults = Omit<Entscheidungen['fields'], 'situationstyp' | 'status'> & {
    situationstyp?: LookupValue | string;
    status?: LookupValue | string;
  };

interface EntscheidungenDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Entscheidungen['fields']) => Promise<void>;
  /** SHAPE-TOLERANT: lookup fields accept the bare key (string) or the
   *  LookupValue object; applookup fields the bare record id or the full
   *  record URL — the dialog normalizes both. */
  defaultValues?: EntscheidungenDialogDefaults;
  /** Record id when editing — enables the attachments section. Omit on create. */
  recordId?: string;
  alternativenList: Alternativen[];
  vorhabenList: Vorhaben[];
  regelnUndBerechtigungenList: RegelnUndBerechtigungen[];
  nutzerList: Nutzer[];
  enablePhotoScan?: boolean;
  enablePhotoLocation?: boolean;
}

// defaultValues are SHAPE-TOLERANT: the dialog resolves bare lookup keys via
// its own options and bare record ids via the field's target app — consumers
// never carry the LookupValue/record-URL shape in their head.
const NORMALIZE_LOOKUPS: Record<string, readonly { key: string; label: string }[]> = {
  situationstyp: LOOKUP_OPTIONS['entscheidungen']?.['situationstyp'] ?? [],
  status: LOOKUP_OPTIONS['entscheidungen']?.['status'] ?? [],
};
const NORMALIZE_APPLOOKUPS: Record<string, string> = {
  gewaehlte_option: APP_IDS.ALTERNATIVEN,
  vorhaben: APP_IDS.VORHABEN,
  geltende_regeln: APP_IDS.REGELN_UND_BERECHTIGUNGEN,
  zustaendiger: APP_IDS.NUTZER,
};
function normalizeDefaults(values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...values };
  for (const [k, opts] of Object.entries(NORMALIZE_LOOKUPS)) {
    const v = out[k];
    if (typeof v === 'string') out[k] = opts.find(o => o.key === v) ?? { key: v, label: v };
    else if (Array.isArray(v)) out[k] = v.map(x => (typeof x === 'string' ? opts.find(o => o.key === x) ?? { key: x, label: x } : x));
  }
  for (const [k, appId] of Object.entries(NORMALIZE_APPLOOKUPS)) {
    const v = out[k];
    if (typeof v === 'string' && v !== '' && !v.startsWith('http')) out[k] = createRecordUrl(appId, v);
    else if (Array.isArray(v)) out[k] = v.map(x => (typeof x === 'string' && x !== '' && !x.startsWith('http') ? createRecordUrl(appId, x) : x));
  }
  return out;
}

export function EntscheidungenDialog({ open, onClose, onSubmit, defaultValues, recordId, alternativenList, vorhabenList, regelnUndBerechtigungenList, nutzerList, enablePhotoScan = true, enablePhotoLocation = true }: EntscheidungenDialogProps) {
  const [fields, setFields] = useState<Partial<Entscheidungen['fields']>>({});
  const [saving, setSaving] = useState(false);
  const normalizedDefaults = useMemo<Record<string, unknown> | undefined>(
    () => (defaultValues ? normalizeDefaults(defaultValues as Record<string, unknown>) : undefined),
    [defaultValues],
  );
  // Dirty-tracking: in edit-mode the Speichern button is disabled until the
  // user actually changes something. JSON.stringify is good enough for our
  // fields (plain values + LookupValue objects + string arrays).
  const isDirty = useMemo(() => {
    if (!normalizedDefaults) return true;  // create-mode: always allow submit
    try {
      return JSON.stringify(fields) !== JSON.stringify(normalizedDefaults);
    } catch {
      return true;
    }
  }, [fields, normalizedDefaults]);
  // Inline-Create state for "Alternativen" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraAlternativen` list, and select it in
  // the originating Combobox via the captured `createAlternativenField`.
  const [createAlternativenOpen, setCreateAlternativenOpen] = useState(false);
  const [createAlternativenInitial, setCreateAlternativenInitial] = useState('');
  const [createAlternativenField, setCreateAlternativenField] = useState<string>('');
  const [extraAlternativen, setExtraAlternativen] = useState< Alternativen[]>([]);
  const alternativenListAll = useMemo(
    () => [...alternativenList, ...extraAlternativen],
    [alternativenList, extraAlternativen],
  );
  function openCreateAlternativen(fieldKey: string, q: string) {
    setCreateAlternativenField(fieldKey);
    setCreateAlternativenInitial(q);
    setCreateAlternativenOpen(true);
  }
  // Inline-Create state for "Vorhaben" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraVorhaben` list, and select it in
  // the originating Combobox via the captured `createVorhabenField`.
  const [createVorhabenOpen, setCreateVorhabenOpen] = useState(false);
  const [createVorhabenInitial, setCreateVorhabenInitial] = useState('');
  const [createVorhabenField, setCreateVorhabenField] = useState<string>('');
  const [extraVorhaben, setExtraVorhaben] = useState< Vorhaben[]>([]);
  const vorhabenListAll = useMemo(
    () => [...vorhabenList, ...extraVorhaben],
    [vorhabenList, extraVorhaben],
  );
  function openCreateVorhaben(fieldKey: string, q: string) {
    setCreateVorhabenField(fieldKey);
    setCreateVorhabenInitial(q);
    setCreateVorhabenOpen(true);
  }
  // Inline-Create state for "RegelnUndBerechtigungen" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraRegelnUndBerechtigungen` list, and select it in
  // the originating Combobox via the captured `createRegelnUndBerechtigungenField`.
  const [createRegelnUndBerechtigungenOpen, setCreateRegelnUndBerechtigungenOpen] = useState(false);
  const [createRegelnUndBerechtigungenInitial, setCreateRegelnUndBerechtigungenInitial] = useState('');
  const [createRegelnUndBerechtigungenField, setCreateRegelnUndBerechtigungenField] = useState<string>('');
  const [extraRegelnUndBerechtigungen, setExtraRegelnUndBerechtigungen] = useState< RegelnUndBerechtigungen[]>([]);
  const regelnUndBerechtigungenListAll = useMemo(
    () => [...regelnUndBerechtigungenList, ...extraRegelnUndBerechtigungen],
    [regelnUndBerechtigungenList, extraRegelnUndBerechtigungen],
  );
  function openCreateRegelnUndBerechtigungen(fieldKey: string, q: string) {
    setCreateRegelnUndBerechtigungenField(fieldKey);
    setCreateRegelnUndBerechtigungenInitial(q);
    setCreateRegelnUndBerechtigungenOpen(true);
  }
  // Inline-Create state for "Nutzer" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraNutzer` list, and select it in
  // the originating Combobox via the captured `createNutzerField`.
  const [createNutzerOpen, setCreateNutzerOpen] = useState(false);
  const [createNutzerInitial, setCreateNutzerInitial] = useState('');
  const [createNutzerField, setCreateNutzerField] = useState<string>('');
  const [extraNutzer, setExtraNutzer] = useState< Nutzer[]>([]);
  const nutzerListAll = useMemo(
    () => [...nutzerList, ...extraNutzer],
    [nutzerList, extraNutzer],
  );
  function openCreateNutzer(fieldKey: string, q: string) {
    setCreateNutzerField(fieldKey);
    setCreateNutzerInitial(q);
    setCreateNutzerOpen(true);
  }
  // Fields the plan assigns to a tool (empty without a plan).
  const SYSTEM_ASSIGNED: string[] = [];
  const [showErrors, setShowErrors] = useState(false);
  const REQUIRED_FIELDS = ['vorhaben', 'entscheidungsfrage', 'situationstyp', 'zustaendiger', 'status'] as const;
  const missingRequired = REQUIRED_FIELDS.filter(k => {
    const v = (fields as Record<string, unknown>)[k];
    return v == null || v === '' || (Array.isArray(v) && v.length === 0);
  });
  const [aiOpen, setAiOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [usePersonalInfo, setUsePersonalInfo] = useState(() => {
    try { return localStorage.getItem('ai-use-personal-info') === 'true'; } catch { return false; }
  });
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const [profileData, setProfileData] = useState<Record<string, unknown> | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [aiText, setAiText] = useState('');

  // Computed-field plumbing. Pure no-op when formEnhancements.computed is {}.
  // The number renderer uses computedValues only as a fallback when the user
  // hasn't typed anything — clearing the input always restores the computation.
  // computedContext exposes applookup list props so { kind: 'applookup', ... }
  // operands can resolve to numeric fields on the target record.
  const computedContext = useMemo<ComputedContext>(() => ({
    lookupLists: {
      'gewaehlte_option': alternativenList,
      'vorhaben': vorhabenList,
      'geltende_regeln': regelnUndBerechtigungenList,
      'zustaendiger': nutzerList,
    },
  }), [alternativenList, vorhabenList, regelnUndBerechtigungenList, nutzerList, ]);
  const computedValues = useMemo<Record<string, number | null>>(() => {
    let out: Record<string, number | null> = {};
    const entries = Object.entries(formEnhancements.computed);
    for (let i = 0; i < 5; i++) {
      const merged: Record<string, unknown> = { ...(fields as Record<string, unknown>) };
      for (const [k, v] of Object.entries(out)) {
        if (v === null) continue;
        const cur = merged[k];
        if (cur === undefined || cur === null || cur === '') merged[k] = v;
      }
      const next: Record<string, number | null> = {};
      let changed = false;
      for (const [key, spec] of entries) {
        const v = evalComputed(spec, merged, computedContext);
        next[key] = v;
        if (v !== out[key]) changed = true;
      }
      out = next;
      if (!changed) break;
    }
    return out;
  }, [fields, computedContext]);

  useEffect(() => {
    if (open) {
      setFields(applyDefaults(normalizedDefaults ?? {}, formEnhancements.defaults) as Partial<Entscheidungen['fields']>);
      setPreview(null);
      setScanSuccess(false);
      setAiText('');
      setSubmitError(null);
    }
  }, [open, normalizedDefaults]);
  useEffect(() => {
    try { localStorage.setItem('ai-use-personal-info', String(usePersonalInfo)); } catch {}
  }, [usePersonalInfo]);
  async function handleShowProfileInfo() {
    if (showProfileInfo) { setShowProfileInfo(false); return; }
    setProfileLoading(true);
    try {
      const p = await getUserProfile();
      setProfileData(p);
    } catch {
      setProfileData(null);
    } finally {
      setProfileLoading(false);
      setShowProfileInfo(true);
    }
  }

  // Submit errors surface IN the dialog (it is modal — a banner in the page
  // body would be hidden behind it). A consumer onSubmit that THROWS (the
  // documented "throw to prevent closing" validation pattern) lands here:
  // the dialog stays open, nothing is saved, the message is visible.
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (missingRequired.length > 0) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    setSubmitError(null);
    try {
      // Fill empty number slots from computed values; user-typed values always win.
      // CRITICAL: only backend-mapped keys may be backfilled. Virtual computeds
      // (sub-agent invents `_netto`, `_bestellung_gesamtbetrag` etc. for the
      // "Berechnungen" display) have no backend counterpart — writing them
      // triggers a 422 from the Living-Apps API ("field does not exist").
      const merged = { ...fields };
      for (const [key, val] of Object.entries(computedValues)) {
        if (val === null) continue;
        if (!backendFieldSet.has(key)) continue;
        const cur = (merged as Record<string, unknown>)[key];
        if (cur === undefined || cur === null || cur === '') {
          (merged as Record<string, unknown>)[key] = val;
        }
      }
      const clean = cleanFieldsForApi(merged, 'entscheidungen');
      await onSubmit(clean as Entscheidungen['fields']);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error && err.message ? err.message : t('submit_error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleAiExtract(file?: File) {
    if (!file && !aiText.trim()) return;
    setScanning(true);
    setScanSuccess(false);
    try {
      let uri: string | undefined;
      let gps: { latitude: number; longitude: number } | null = null;
      let geoAddr = '';
      const parts: string[] = [];
      if (file) {
        const [dataUri, meta] = await Promise.all([fileToDataUri(file), extractPhotoMeta(file)]);
        uri = dataUri;
        if (file.type.startsWith('image/')) setPreview(uri);
        gps = enablePhotoLocation ? meta?.gps ?? null : null;
        if (gps) {
          geoAddr = await reverseGeocode(gps.latitude, gps.longitude);
          parts.push(`Location coordinates: ${gps.latitude}, ${gps.longitude}`);
          if (geoAddr) parts.push(`Reverse-geocoded address: ${geoAddr}`);
        }
        if (meta?.dateTime) {
          parts.push(`Date taken: ${meta.dateTime.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')}`);
        }
      }
      const contextParts: string[] = [];
      if (parts.length) {
        contextParts.push(`<photo-metadata>\nThe following metadata was extracted from the photo\'s EXIF data:\n${parts.join('\n')}\n</photo-metadata>`);
      }
      contextParts.push(`<available-records field="gewaehlte_option" entity="Alternativen">\n${JSON.stringify(alternativenList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="vorhaben" entity="Vorhaben">\n${JSON.stringify(vorhabenList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="geltende_regeln" entity="Regeln und Berechtigungen">\n${JSON.stringify(regelnUndBerechtigungenList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="zustaendiger" entity="Nutzer">\n${JSON.stringify(nutzerList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      if (usePersonalInfo) {
        try {
          const profile = await getUserProfile();
          contextParts.push(`<user-profile>\nThe following is the logged-in user\'s personal information. Use this to pre-fill relevant fields like name, email, address, company etc. when appropriate:\n${JSON.stringify(profile, null, 2)}\n</user-profile>`);
        } catch (err) {
          console.warn('Failed to fetch user profile:', err);
        }
      }
      const photoContext = contextParts.length ? contextParts.join('\n') : undefined;
      const schema = `{\n  "gewaehlte_option": string | null, // Display name from Alternativen (see <available-records>)\n  "vorhaben": string | null, // Display name from Vorhaben (see <available-records>)\n  "entscheidungsfrage": string | null, // Entscheidungsfrage\n  "situationstyp": LookupValue | null, // Situationstyp (select one key: "strategisch" | "technisch" | "risiko" | "eilentscheidung" | "routine") mapping: strategisch=Strategisch, technisch=Technisch, risiko=Risiko, eilentscheidung=Eilentscheidung, routine=Routine\n  "gesicherte_fakten": string | null, // Gesicherte Fakten\n  "offene_annahmen": string | null, // Offene Annahmen\n  "fehlende_informationen": string | null, // Fehlende Informationen\n  "geltende_regeln": string[] | null, // Display names from Regeln und Berechtigungen, one per referenced record (see <available-records>)\n  "zustaendiger": string | null, // Display name from Nutzer (see <available-records>)\n  "frist": string | null, // YYYY-MM-DD\n  "status": LookupValue | null, // Status (select one key: "vorbereitet" | "in_pruefung" | "entschieden" | "umgesetzt" | "verworfen") mapping: vorbereitet=Vorbereitet, in_pruefung=In Prüfung, entschieden=Entschieden, umgesetzt=Umgesetzt, verworfen=Verworfen\n  "begruendung": string | null, // Begründung\n  "entscheidungsdatum": string | null, // YYYY-MM-DD\n  "umsetzungsplan": string | null, // Umsetzungsplan\n  "erwartetes_ergebnis": string | null, // Erwartetes Ergebnis\n  "tatsaechliches_ergebnis": string | null, // Tatsächliches Ergebnis\n}`;
      const raw = await extractFromInput<Record<string, unknown>>(schema, {
        dataUri: uri,
        userText: aiText.trim() || undefined,
        photoContext,
        intent: DIALOG_INTENT,
      });
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        const applookupKeys = new Set<string>(["gewaehlte_option", "vorhaben", "geltende_regeln", "zustaendiger"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null) merged[k] = v;
        }
        const gewaehlte_optionName = raw['gewaehlte_option'] as string | null;
        if (gewaehlte_optionName) {
          const gewaehlte_optionMatch = alternativenList.find(r => matchName(gewaehlte_optionName!, [String(r.fields.bezeichnung ?? '')]));
          if (gewaehlte_optionMatch) merged['gewaehlte_option'] = createRecordUrl(APP_IDS.ALTERNATIVEN, gewaehlte_optionMatch.record_id);
        }
        const vorhabenName = raw['vorhaben'] as string | null;
        if (vorhabenName) {
          const vorhabenMatch = vorhabenList.find(r => matchName(vorhabenName!, [String(r.fields.titel ?? '')]));
          if (vorhabenMatch) merged['vorhaben'] = createRecordUrl(APP_IDS.VORHABEN, vorhabenMatch.record_id);
        }
        const geltende_regelnNames = raw['geltende_regeln'];
        if (Array.isArray(geltende_regelnNames) && geltende_regelnNames.length > 0) {
          const geltende_regelnUrls = (geltende_regelnNames as unknown[])
            .map(n => regelnUndBerechtigungenList.find(r => matchName(String(n), [String(r.fields.bezeichnung ?? '')])))
            .filter((r): r is NonNullable<typeof r> => Boolean(r))
            .map(r => createRecordUrl(APP_IDS.REGELN_UND_BERECHTIGUNGEN, r.record_id));
          if (geltende_regelnUrls.length > 0) merged['geltende_regeln'] = geltende_regelnUrls;
        }
        const zustaendigerName = raw['zustaendiger'] as string | null;
        if (zustaendigerName) {
          const zustaendigerMatch = nutzerList.find(r => matchName(zustaendigerName!, [String(r.fields.nutzer_firstname ?? '')]));
          if (zustaendigerMatch) merged['zustaendiger'] = createRecordUrl(APP_IDS.NUTZER, zustaendigerMatch.record_id);
        }
        return merged as Partial<Entscheidungen['fields']>;
      });
      setAiText('');
      setScanSuccess(true);
      setTimeout(() => setScanSuccess(false), 3000);
    } catch (err) {
      console.error(`${t('scan_error')}:`, err);
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setScanning(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleAiExtract(f);
    e.target.value = '';
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      handleAiExtract(file);
    }
  }, []);

  const DIALOG_INTENT = defaultValues
    ? t('edit_entity', { entity: appLabel('entscheidungen') })
    : t('new_entity', { entity: appLabel('entscheidungen') });

  const fieldBlocks: Record<string, React.ReactNode> = {
    'gewaehlte_option': (
      <div key="gewaehlte_option" className="space-y-1.5">
        <Label htmlFor="gewaehlte_option">{fieldLabel('entscheidungen', 'gewaehlte_option')}</Label>
        <Combobox
          id="gewaehlte_option"
          placeholder="Welche Option wurde gewählt?"
          items={alternativenListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.bezeichnung ?? r.record_id),
          }))}
          value={extractRecordId(fields.gewaehlte_option)}
          onChange={id => setFields(f => ({ ...f, gewaehlte_option: id ? createRecordUrl(APP_IDS.ALTERNATIVEN, id) : undefined }))}
          onCreateNew={(q) => openCreateAlternativen("gewaehlte_option", q)}
          createLabel={t('create_in', { entity: appLabel('alternativen') })}
        />
      </div>
    ),
    'vorhaben': (
      <div key="vorhaben" className="space-y-1.5">
        <Label htmlFor="vorhaben">{fieldLabel('entscheidungen', 'vorhaben')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Combobox
          id="vorhaben"
          placeholder="Welches Vorhaben?"
          items={vorhabenListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.titel ?? r.record_id),
          }))}
          value={extractRecordId(fields.vorhaben)}
          onChange={id => setFields(f => ({ ...f, vorhaben: id ? createRecordUrl(APP_IDS.VORHABEN, id) : undefined }))}
          onCreateNew={(q) => openCreateVorhaben("vorhaben", q)}
          createLabel={t('create_in', { entity: appLabel('vorhaben') })}
        />
        {showErrors && !fields.vorhaben && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('entscheidungen', 'vorhaben')}</p>
        )}
      </div>
    ),
    'entscheidungsfrage': (
      <div key="entscheidungsfrage" className="space-y-1.5">
        <Label htmlFor="entscheidungsfrage">{fieldLabel('entscheidungen', 'entscheidungsfrage')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Textarea
          id="entscheidungsfrage"
          placeholder="Was soll entschieden werden?"
          value={fields.entscheidungsfrage ?? ''}
          onChange={e => setFields(f => ({ ...f, entscheidungsfrage: e.target.value }))}
          rows={3}
        />
        {showErrors && !fields.entscheidungsfrage && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('entscheidungen', 'entscheidungsfrage')}</p>
        )}
      </div>
    ),
    'situationstyp': (
      <div key="situationstyp" className="space-y-1.5">
        <Label htmlFor="situationstyp">{fieldLabel('entscheidungen', 'situationstyp')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.situationstyp) === 'strategisch'}
            onClick={() => setFields(f => ({ ...f, situationstyp: (lookupKey(f.situationstyp) === 'strategisch' ? undefined : 'strategisch') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.situationstyp) === 'strategisch'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('entscheidungen', 'situationstyp', 'strategisch') ?? 'Strategisch'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.situationstyp) === 'technisch'}
            onClick={() => setFields(f => ({ ...f, situationstyp: (lookupKey(f.situationstyp) === 'technisch' ? undefined : 'technisch') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.situationstyp) === 'technisch'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('entscheidungen', 'situationstyp', 'technisch') ?? 'Technisch'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.situationstyp) === 'risiko'}
            onClick={() => setFields(f => ({ ...f, situationstyp: (lookupKey(f.situationstyp) === 'risiko' ? undefined : 'risiko') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.situationstyp) === 'risiko'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('entscheidungen', 'situationstyp', 'risiko') ?? 'Risiko'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.situationstyp) === 'eilentscheidung'}
            onClick={() => setFields(f => ({ ...f, situationstyp: (lookupKey(f.situationstyp) === 'eilentscheidung' ? undefined : 'eilentscheidung') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.situationstyp) === 'eilentscheidung'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('entscheidungen', 'situationstyp', 'eilentscheidung') ?? 'Eilentscheidung'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.situationstyp) === 'routine'}
            onClick={() => setFields(f => ({ ...f, situationstyp: (lookupKey(f.situationstyp) === 'routine' ? undefined : 'routine') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.situationstyp) === 'routine'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('entscheidungen', 'situationstyp', 'routine') ?? 'Routine'}
          </button>
        </div>
        {showErrors && !fields.situationstyp && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('entscheidungen', 'situationstyp')}</p>
        )}
      </div>
    ),
    'gesicherte_fakten': (
      <div key="gesicherte_fakten" className="space-y-1.5">
        <Label htmlFor="gesicherte_fakten">{fieldLabel('entscheidungen', 'gesicherte_fakten')}</Label>
        <Textarea
          id="gesicherte_fakten"
          placeholder="Ein Fakt pro Zeile"
          value={fields.gesicherte_fakten ?? ''}
          onChange={e => setFields(f => ({ ...f, gesicherte_fakten: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'offene_annahmen': (
      <div key="offene_annahmen" className="space-y-1.5">
        <Label htmlFor="offene_annahmen">{fieldLabel('entscheidungen', 'offene_annahmen')}</Label>
        <Textarea
          id="offene_annahmen"
          placeholder="Eine Annahme pro Zeile"
          value={fields.offene_annahmen ?? ''}
          onChange={e => setFields(f => ({ ...f, offene_annahmen: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'fehlende_informationen': (
      <div key="fehlende_informationen" className="space-y-1.5">
        <Label htmlFor="fehlende_informationen">{fieldLabel('entscheidungen', 'fehlende_informationen')}</Label>
        <Textarea
          id="fehlende_informationen"
          placeholder="Eine Information pro Zeile"
          value={fields.fehlende_informationen ?? ''}
          onChange={e => setFields(f => ({ ...f, fehlende_informationen: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'geltende_regeln': (
      <div key="geltende_regeln" className="space-y-1.5">
        <Label htmlFor="geltende_regeln">{fieldLabel('entscheidungen', 'geltende_regeln')}</Label>
        <MultiCombobox
          id="geltende_regeln"
          placeholder="Welche Regeln gelten?"
          items={regelnUndBerechtigungenListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.bezeichnung ?? r.record_id),
          }))}
          values={extractRecordIds(fields.geltende_regeln)}
          onChange={ids => setFields(f => ({ ...f, geltende_regeln: ids.length ? ids.map(id => createRecordUrl(APP_IDS.REGELN_UND_BERECHTIGUNGEN, id)) as any : undefined }))}
          onCreateNew={(q) => openCreateRegelnUndBerechtigungen("geltende_regeln", q)}
          createLabel={t('create_in', { entity: appLabel('regeln_und_berechtigungen') })}
        />
      </div>
    ),
    'zustaendiger': (
      <div key="zustaendiger" className="space-y-1.5">
        <Label htmlFor="zustaendiger">{fieldLabel('entscheidungen', 'zustaendiger')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Combobox
          id="zustaendiger"
          placeholder="Wer ist zuständig?"
          items={nutzerListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.nutzer_firstname ?? r.record_id),
          }))}
          value={extractRecordId(fields.zustaendiger)}
          onChange={id => setFields(f => ({ ...f, zustaendiger: id ? createRecordUrl(APP_IDS.NUTZER, id) : undefined }))}
          onCreateNew={(q) => openCreateNutzer("zustaendiger", q)}
          createLabel={t('create_in', { entity: appLabel('nutzer') })}
        />
        {showErrors && !fields.zustaendiger && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('entscheidungen', 'zustaendiger')}</p>
        )}
      </div>
    ),
    'frist': (
      <div key="frist" className="space-y-1.5">
        <Label htmlFor="frist">{fieldLabel('entscheidungen', 'frist')}</Label>
        <DatePicker
          id="frist"
          placeholder="Bis wann entscheiden?"
          mode="date"
          value={fields.frist ?? null}
          onChange={v => setFields(f => ({ ...f, frist: v ?? undefined }))}
        />
      </div>
    ),
    'status': (
      <div key="status" className="space-y-1.5">
        <Label htmlFor="status">{fieldLabel('entscheidungen', 'status')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.status) === 'vorbereitet'}
            onClick={() => setFields(f => ({ ...f, status: (lookupKey(f.status) === 'vorbereitet' ? undefined : 'vorbereitet') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.status) === 'vorbereitet'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('entscheidungen', 'status', 'vorbereitet') ?? 'Vorbereitet'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.status) === 'in_pruefung'}
            onClick={() => setFields(f => ({ ...f, status: (lookupKey(f.status) === 'in_pruefung' ? undefined : 'in_pruefung') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.status) === 'in_pruefung'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('entscheidungen', 'status', 'in_pruefung') ?? 'In Prüfung'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.status) === 'entschieden'}
            onClick={() => setFields(f => ({ ...f, status: (lookupKey(f.status) === 'entschieden' ? undefined : 'entschieden') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.status) === 'entschieden'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('entscheidungen', 'status', 'entschieden') ?? 'Entschieden'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.status) === 'umgesetzt'}
            onClick={() => setFields(f => ({ ...f, status: (lookupKey(f.status) === 'umgesetzt' ? undefined : 'umgesetzt') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.status) === 'umgesetzt'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('entscheidungen', 'status', 'umgesetzt') ?? 'Umgesetzt'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.status) === 'verworfen'}
            onClick={() => setFields(f => ({ ...f, status: (lookupKey(f.status) === 'verworfen' ? undefined : 'verworfen') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.status) === 'verworfen'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('entscheidungen', 'status', 'verworfen') ?? 'Verworfen'}
          </button>
        </div>
        {showErrors && !fields.status && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('entscheidungen', 'status')}</p>
        )}
      </div>
    ),
    'begruendung': (
      <div key="begruendung" className="space-y-1.5">
        <Label htmlFor="begruendung">{fieldLabel('entscheidungen', 'begruendung')}</Label>
        <Textarea
          id="begruendung"
          placeholder="Warum diese Entscheidung?"
          value={fields.begruendung ?? ''}
          onChange={e => setFields(f => ({ ...f, begruendung: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'entscheidungsdatum': (
      <div key="entscheidungsdatum" className="space-y-1.5">
        <Label htmlFor="entscheidungsdatum">{fieldLabel('entscheidungen', 'entscheidungsdatum')}</Label>
        <DatePicker
          id="entscheidungsdatum"
          placeholder="Wann wurde entschieden?"
          mode="date"
          value={fields.entscheidungsdatum ?? null}
          onChange={v => setFields(f => ({ ...f, entscheidungsdatum: v ?? undefined }))}
        />
      </div>
    ),
    'umsetzungsplan': (
      <div key="umsetzungsplan" className="space-y-1.5">
        <Label htmlFor="umsetzungsplan">{fieldLabel('entscheidungen', 'umsetzungsplan')}</Label>
        <Textarea
          id="umsetzungsplan"
          placeholder="Ein Schritt pro Zeile"
          value={fields.umsetzungsplan ?? ''}
          onChange={e => setFields(f => ({ ...f, umsetzungsplan: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'erwartetes_ergebnis': (
      <div key="erwartetes_ergebnis" className="space-y-1.5">
        <Label htmlFor="erwartetes_ergebnis">{fieldLabel('entscheidungen', 'erwartetes_ergebnis')}</Label>
        <Textarea
          id="erwartetes_ergebnis"
          placeholder="Was soll herauskommen?"
          value={fields.erwartetes_ergebnis ?? ''}
          onChange={e => setFields(f => ({ ...f, erwartetes_ergebnis: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'tatsaechliches_ergebnis': (
      <div key="tatsaechliches_ergebnis" className="space-y-1.5">
        <Label htmlFor="tatsaechliches_ergebnis">{fieldLabel('entscheidungen', 'tatsaechliches_ergebnis')}</Label>
        <Textarea
          id="tatsaechliches_ergebnis"
          placeholder="Was ist herausgekommen?"
          value={fields.tatsaechliches_ergebnis ?? ''}
          onChange={e => setFields(f => ({ ...f, tatsaechliches_ergebnis: e.target.value }))}
          rows={3}
        />
      </div>
    ),
  };
  const orderedFields = applyFieldOrder(Object.keys(fieldBlocks), formEnhancements.fieldOrder);
  const orderedFieldsKey = orderedFields.map((it) => typeof it === 'string' ? it : it.row.join('+')).join(',');

  // Render-Modell für Computed-Felder:
  //
  //   • BACKEND-FELDER mit computed-Eintrag (z.B. gesamtpreis bei einer
  //     Katzenpension) bleiben als normales Eingabe-Feld stehen. Der Number-
  //     Input nutzt den computed-Wert als Vorschlag, der User kann jederzeit
  //     überschreiben (clearing → restore computed).
  //   • VIRTUELLE computed-Keys (Eintrag in formEnhancements.computed, ABER
  //     kein passendes Backend-Feld in orderedFields) erscheinen NICHT als
  //     Input, sondern unten als kompakte 'Berechnungen'-Übersicht oder als
  //     Inline-Hint unter dem letzten beitragenden Input.
  const FIELD_LABELS: Record<string, string> = {"gewaehlte_option": "Gewählte Option", "vorhaben": "Vorhaben", "entscheidungsfrage": "Entscheidungsfrage", "situationstyp": "Situationstyp", "gesicherte_fakten": "Gesicherte Fakten", "offene_annahmen": "Offene Annahmen", "fehlende_informationen": "Fehlende Informationen", "geltende_regeln": "Geltende Regeln und Grenzen", "zustaendiger": "Zuständiger", "frist": "Frist", "status": "Status", "begruendung": "Begründung", "entscheidungsdatum": "Entscheidungsdatum", "umsetzungsplan": "Umsetzungsplan", "erwartetes_ergebnis": "Erwartetes Ergebnis", "tatsaechliches_ergebnis": "Tatsächliches Ergebnis"};
  const CURRENCY_KEYS = new Set<string>([]);
  // Applookup-Referenz-Labels: pro applookup-Feld in dieser Form (ownKey)
  // eine Map { lookupKey: label } für ALLE Felder des Target-Schemas. Wird
  // beim Render-Walk gefiltert auf die in der computed-Formel tatsächlich
  // referenzierten lookupKeys (siehe applookupRefs unten).
  const APPLOOKUP_LABELS: Record<string, Record<string, string>> = {"gewaehlte_option": {"bezeichnung": "Bezeichnung", "beschreibung": "Beschreibung", "konsequenzen": "Konsequenzen", "risiken": "Risiken", "aufwand": "Aufwand", "empfehlungsgrad": "Empfehlungsgrad", "herkunft": "Herkunft", "vorgeschlagen_von": "Vorgeschlagen von", "entscheidung": "Entscheidung"}, "vorhaben": {"titel": "Titel", "ziel": "Ziel", "fachlicher_kontext": "Fachlicher Kontext", "hintergrund_historie": "Hintergrund und Historie", "arbeitszustand": "Arbeitszustand", "naechster_schritt": "Nächster Schritt", "verantwortlicher": "Verantwortlicher", "beteiligte": "Beteiligte", "geltende_regeln": "Geltende Regeln", "ansprechpartner": "Ansprechpartner und Besonderheiten", "start": "Start", "zieltermin": "Zieltermin", "dokumentation": "Dokumentation"}, "geltende_regeln": {"bezeichnung": "Bezeichnung", "beschreibung": "Beschreibung", "regeltyp": "Regeltyp", "geltungsbereich": "Geltungsbereich", "betroffene_rolle": "Betroffene Rolle", "freigabepflicht": "Freigabe durch einen Menschen erforderlich", "gueltig_ab": "Gültig ab", "status": "Status", "verantwortlicher": "Verantwortlicher"}, "zustaendiger": {"nutzer_firstname": "Vorname", "nutzer_lastname": "Nachname", "email": "E-Mail", "art": "Art", "rolle": "Rolle", "fachgebiet": "Fachgebiet", "verantwortungsbereich": "Verantwortungsbereich", "aktiv": "Aktiv"}};
  const inputFields = useMemo(() => flattenFieldOrder(orderedFields), [orderedFieldsKey]);
  const backendFieldSet = useMemo(() => new Set(inputFields), [inputFields.join(',')]);
  const virtualComputed = useMemo(
    () => Object.fromEntries(
      Object.entries(formEnhancements.computed).filter(([k]) => !backendFieldSet.has(k)),
    ),
    [backendFieldSet],
  );
  const virtualFormEnhancements = useMemo(
    () => ({ ...formEnhancements, computed: virtualComputed }),
    [virtualComputed],
  );
  const computedLayout = useMemo(
    () => classifyComputed(virtualFormEnhancements, inputFields, computedDeps),
    [virtualFormEnhancements, inputFields.join(',')],
  );
  // Applookup-Referenzen: pro ownKey (Lookup-Feld im Form) die Liste der
  // lookupKeys, die in irgendeiner computed-Formel referenziert werden.
  // MODUS-1: aus dem Spec-Tree extrahiert. MODUS-2: aus dem Build-Time-
  // Export computedApplookupRefs (parse-formulas hat Regex-Pairs gesammelt).
  // Pro (ownKey, lookupKey)-Paar nur einmal; pro ownKey können aber mehrere
  // lookupKeys gleichzeitig auftauchen (z.B. einzelpreis UND karten10_preis
  // beim Yoga-Kurs), und alle werden separat als Inline-Hint gerendert.
  const applookupRefs = useMemo(
    () => mergeApplookupRefs(
      extractApplookupRefs(formEnhancements.computed),
      computedApplookupRefs,
    ),
    [],
  );
  function summaryLabel(k: string): string {
    if (FIELD_LABELS[k]) return FIELD_LABELS[k];
    // Leading underscore(s) als Virtual-Marker abstreifen; Unterstriche zu
    // Leerzeichen, jedes Wort kapitalisieren. Umlaute kommen vom Sub-Agent
    // direkt im Key (z. B. `_buchung_dauer_nächte`) — JS/TS/Vite unterstützen
    // Unicode-Identifier nativ, daher keine ASCII-Transliteration nötig.
    return k.replace(/^_+/, '')
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  function formatSummaryValue(k: string, v: unknown): string {
    if (v === undefined || v === null || v === '' || (typeof v === 'number' && !Number.isFinite(v))) return '—';
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) return String(v);
    // Backend-Feld mit €-Label ODER virtueller Computed-Key, dessen Name nach Geld aussieht.
    const looksLikeCurrency = CURRENCY_KEYS.has(k) || /(?:kosten|preis|betrag|gesamt|netto|brutto|summe|mwst|rabatt|anzahlung|umsatz|saldo)/i.test(k);
    if (looksLikeCurrency) {
      return n.toLocaleString(localeTag(), { style: 'currency', currency: CURRENCY, minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return n.toLocaleString(localeTag(), { maximumFractionDigits: 2 });
  }

  return (
    <>
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[92vh] flex flex-col overflow-hidden p-0 gap-0 max-sm:[&>button]:size-10 max-sm:[&>button]:grid max-sm:[&>button]:place-items-center max-sm:[&>button]:rounded-full max-sm:[&>button]:border max-sm:[&>button]:border-input max-sm:[&>button]:bg-background max-sm:[&>button]:opacity-100 max-sm:[&>button>svg]:size-5">
        <DialogHeader className="px-6 pt-5 pb-3 border-b flex flex-row items-center gap-3 space-y-0">
          <DialogTitle className="flex-1 truncate text-left">{DIALOG_INTENT}</DialogTitle>
          {enablePhotoScan && (
            <button
              type="button"
              onClick={() => setAiOpen(o => !o)}
              aria-expanded={aiOpen}
              aria-controls="ai-fill-panel"
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 max-sm:py-2.5 max-sm:px-4 text-xs font-semibold transition-all mr-7 max-sm:mr-12 shadow-sm ${
                aiOpen
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                  : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15 hover:border-primary/50'
              }`}
            >
              <IconSparkles className={`h-3.5 w-3.5 ${aiOpen ? '' : 'text-primary'}`} />
              <span className="hidden sm:inline">{t('smart_fill')}</span>
              <IconChevronDown className={`h-3 w-3 transition-transform ${aiOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
        </DialogHeader>
        {enablePhotoScan && aiOpen && (
          <div id="ai-fill-panel" className="border-b bg-muted/20 px-6 py-4 space-y-3">
            <p className="text-xs text-muted-foreground">{t('scan_header_sub')}</p>
            <div className="flex items-start gap-2 pl-0.5">
              <Checkbox
                id="ai-use-personal-info"
                checked={usePersonalInfo}
                onCheckedChange={(v) => setUsePersonalInfo(!!v)}
                className="mt-0.5"
              />
              <span className="text-xs text-muted-foreground leading-snug">
                <Label htmlFor="ai-use-personal-info" className="text-xs font-normal text-muted-foreground cursor-pointer inline">
                  {t('useinfo_label')}
                </Label>
                {' '}
                <button type="button" onClick={handleShowProfileInfo} className="text-xs text-primary hover:underline whitespace-nowrap">
                  {profileLoading ? t('useinfo_loading') : `(${t('useinfo_more')})`}
                </button>
              </span>
            </div>
            {showProfileInfo && (
              <div className="rounded-md border bg-muted/50 p-2 text-xs max-h-40 overflow-y-auto">
                <p className="font-medium mb-1">{t('profile_preamble')}</p>
                {profileData ? Object.values(profileData).map((v, i) => (
                  <span key={i}>{i > 0 && ", "}{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                )) : (
                  <span className="text-muted-foreground">{t('useinfo_error')}</span>
                )}
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileSelect} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !scanning && fileInputRef.current?.click()}
              className={`
                relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
                ${scanning
                  ? 'border-primary/40 bg-primary/5'
                  : scanSuccess
                    ? 'border-green-500/40 bg-green-50/50 dark:bg-green-950/20'
                    : dragOver
                      ? 'border-primary bg-primary/10 scale-[1.01]'
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                }
              `}
            >
              {scanning ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <IconLoader2 className="h-7 w-7 text-primary animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{t('scan_analyzing')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('scan_analyzing_sub')}</p>
                  </div>
                </div>
              ) : scanSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <IconCircleCheck className="h-7 w-7 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">{t('scan_success')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('scan_success_sub')}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/8 flex items-center justify-center">
                    <IconPhotoPlus className="h-7 w-7 text-primary/70" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{t('scan_upload')}</p>
                  </div>
                </div>
              )}

              {preview && !scanning && (
                <div className="absolute top-2 right-2">
                  <div className="relative group">
                    <img src={preview} alt="" className="h-10 w-10 rounded-md object-cover border shadow-sm" />
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setPreview(null); }}
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-muted-foreground/80 text-white flex items-center justify-center"
                    >
                      <IconX className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); cameraInputRef.current?.click(); }}>
                <IconCamera className="h-3.5 w-3.5 mr-1" />{t('scan_camera_btn')}
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                <IconUpload className="h-3.5 w-3.5 mr-1" />{t('scan_file_btn')}
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => {
                  e.stopPropagation();
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'application/pdf,.pdf';
                    fileInputRef.current.click();
                    setTimeout(() => { if (fileInputRef.current) fileInputRef.current.accept = 'image/*,application/pdf'; }, 100);
                  }
                }}>
                <IconFileText className="h-3.5 w-3.5 mr-1" />{t('scan_doc_btn')}
              </Button>
            </div>

            <div className="relative">
              <Textarea
                placeholder={t('scan_text_placeholder')}
                value={aiText}
                onChange={e => {
                  setAiText(e.target.value);
                  const el = e.target;
                  el.style.height = 'auto';
                  el.style.height = Math.min(Math.max(el.scrollHeight, 56), 96) + 'px';
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && aiText.trim() && !scanning) {
                    e.preventDefault();
                    handleAiExtract();
                  }
                }}
                disabled={scanning}
                rows={2}
                className="pr-12 resize-none text-sm overflow-y-auto"
              />
              <button
                type="button"
                className="absolute right-2 top-2 h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                disabled={scanning}
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) setAiText(prev => prev ? prev + '\n' + text : text);
                  } catch {}
                }}
                title={t('paste')}
              >
                <IconClipboard className="h-4 w-4" />
              </button>
            </div>
            {aiText.trim() && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-9 text-xs"
                disabled={scanning}
                onClick={() => handleAiExtract()}
              >
                <IconSparkles className="h-3.5 w-3.5 mr-1.5" />{t('scan_text_analyze')}
              </Button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col min-h-0 min-w-0 max-sm:[&_input]:h-11">
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 space-y-4 min-w-0">
            {(() => {
              const renderField = (k: string) => {
                const inlineHints = computedLayout.anchors[k] ?? [];
                const refs = applookupRefs[k] ?? [];
                // A field the plan gives to a TOOL. On CREATE it is not shown
                // at all — the value does not exist yet and typing one only
                // gets overwritten. On EDIT it stays a normal input with a
                // note: when a tool could not compose its value (a missing
                // ingredient), this is the only place to repair the record.
                if (SYSTEM_ASSIGNED.includes(k) && !recordId) {
                  return (
                    <div key={k} className="space-y-1.5 min-w-0">
                      <Label>{fieldLabel('entscheidungen', k)}</Label>
                      <p className="text-sm text-muted-foreground">{t('assigned_by_system')}</p>
                    </div>
                  );
                }
                return (
                  <div key={k} className="space-y-1.5 min-w-0">
                    {fieldBlocks[k]}
                    {SYSTEM_ASSIGNED.includes(k) && (
                      <p className="text-xs text-muted-foreground">{t('assigned_by_system')}</p>
                    )}
                    {refs.map(({ lookupKey }) => {
                      // Show the live numeric value the formula will pull from
                      // the selected lookup target (e.g. "Monatspreis: 34,90 €"
                      // under the Tarif combobox). Hidden while no lookup is
                      // selected or the target field is non-numeric.
                      const v = resolveApplookupRef(k, lookupKey, fields as Record<string, unknown>, computedContext);
                      if (v === null) return null;
                      const lbl = APPLOOKUP_LABELS[k]?.[lookupKey] ?? lookupKey;
                      const text = formatSummaryValue(lookupKey, v);
                      return (
                        <div key={`alh-${k}-${lookupKey}`} className="flex items-center gap-1.5 pl-3 text-xs text-muted-foreground">
                          <span className="text-primary/70">→</span>
                          <span>{lbl}</span>
                          <span className="ml-auto font-medium tabular-nums text-foreground">{text}</span>
                        </div>
                      );
                    })}
                    {inlineHints.map((cKey) => {
                      const v = computedValues[cKey];
                      const text = formatSummaryValue(cKey, v);
                      if (text === '—') return null;
                      return (
                        <div key={cKey} className="flex items-center gap-1.5 pl-3 text-xs text-muted-foreground">
                          <span className="text-primary/70">→</span>
                          <span>{summaryLabel(cKey)}</span>
                          <span className="ml-auto font-medium tabular-nums text-foreground">{text}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              };
              return orderedFields.map((item, idx) => {
                if (typeof item === 'string') return renderField(item);
                const cols = item.cols ?? `repeat(${item.row.length}, minmax(0, 1fr))`;
                return (
                  <div key={`row-${idx}`} className="grid gap-3" style={{ gridTemplateColumns: cols }}>
                    {item.row.map(renderField)}
                  </div>
                );
              });
            })()}
            {(computedLayout.aggregates.length > 0 || computedLayout.finalTotal) && (
              <div className="mt-6 pt-4 border-t border-border space-y-1.5">
                {computedLayout.aggregates.length > 0 && (
                  <dl className="space-y-1.5 pb-2">
                    {computedLayout.aggregates.map((k) => {
                      const userVal = (fields as Record<string, unknown>)[k];
                      const computed = computedValues[k];
                      const v = userVal !== undefined && userVal !== null && userVal !== '' ? userVal : computed;
                      return (
                        <div key={k} className="flex justify-between items-baseline gap-3">
                          <dt className="text-sm text-muted-foreground truncate">{summaryLabel(k)}</dt>
                          <dd className="text-sm font-medium tabular-nums whitespace-nowrap">{formatSummaryValue(k, v)}</dd>
                        </div>
                      );
                    })}
                  </dl>
                )}
                {computedLayout.finalTotal && (() => {
                  const k = computedLayout.finalTotal;
                  const userVal = (fields as Record<string, unknown>)[k];
                  const computed = computedValues[k];
                  const v = userVal !== undefined && userVal !== null && userVal !== '' ? userVal : computed;
                  // Innere Border nur wenn aggregates existieren — sonst hätten wir
                  // zwei direkt aufeinanderfolgende Striche (Outer + Inner) mit nur
                  // einer Aggregat-Zeile dazwischen → zu viel visuelles Rauschen.
                  const sep = computedLayout.aggregates.length > 0 ? 'pt-3 border-t border-border' : 'pt-1';
                  return (
                    <div className={`flex justify-between items-baseline gap-3 ${sep}`}>
                      <span className="text-base font-semibold text-foreground">{summaryLabel(k)}</span>
                      <span className="text-lg font-bold tabular-nums whitespace-nowrap text-foreground">{formatSummaryValue(k, v)}</span>
                    </div>
                  );
                })()}
              </div>
            )}
            {showErrors && missingRequired.length > 0 && (
              <p className="text-xs text-destructive flex items-center gap-1.5" role="alert">
                <IconAlertCircle className="h-3.5 w-3.5 shrink-0" />
                {t('missing_required')}
              </p>
            )}
            {recordId && (
              <div className="pt-2 border-t border-border">
                <AttachmentsSection appId={APP_IDS.ENTSCHEIDUNGEN} recordId={recordId} />
              </div>
            )}
          </div>
          {submitError && (
            <div className="flex items-start gap-2 border-t border-destructive/20 bg-destructive/10 px-6 py-2.5 text-sm text-destructive" role="alert">
              <IconAlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="min-w-0 break-words">{submitError}</span>
            </div>
          )}
          <DialogFooter className="sticky bottom-0 border-t bg-background/95 backdrop-blur px-6 py-3 gap-2 max-sm:flex-row">
            <Button type="button" variant="outline" onClick={onClose} className="max-sm:h-12 max-sm:flex-1 max-sm:text-base">{t('cancel')}</Button>
            <Button
              type="submit"
              className="max-sm:h-12 max-sm:flex-1 max-sm:text-base"
              disabled={saving || !isDirty || (showErrors && missingRequired.length > 0)}
            >
              {saving ? t('saving') : defaultValues ? t('save') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    {createAlternativenOpen && (
      <AlternativenDialog
        open={createAlternativenOpen}
        onClose={() => setCreateAlternativenOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createAlternativenEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as Alternativen;
            setExtraAlternativen(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.ALTERNATIVEN, result.id);
            setFields(prev => ({ ...prev, [createAlternativenField]: url } as any));
          }
          setCreateAlternativenOpen(false);
        }}
        defaultValues={createAlternativenInitial
          ? ({ bezeichnung: createAlternativenInitial } as any)
          : undefined}
        nutzerList={nutzerList}
        entscheidungenList={[]}
      />
    )}
    {createVorhabenOpen && (
      <VorhabenDialog
        open={createVorhabenOpen}
        onClose={() => setCreateVorhabenOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createVorhabenEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as Vorhaben;
            setExtraVorhaben(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.VORHABEN, result.id);
            setFields(prev => ({ ...prev, [createVorhabenField]: url } as any));
          }
          setCreateVorhabenOpen(false);
        }}
        defaultValues={createVorhabenInitial
          ? ({ titel: createVorhabenInitial } as any)
          : undefined}
        nutzerList={nutzerList}
        regelnUndBerechtigungenList={regelnUndBerechtigungenList}
      />
    )}
    {createRegelnUndBerechtigungenOpen && (
      <RegelnUndBerechtigungenDialog
        open={createRegelnUndBerechtigungenOpen}
        onClose={() => setCreateRegelnUndBerechtigungenOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createRegelnUndBerechtigungenEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as RegelnUndBerechtigungen;
            setExtraRegelnUndBerechtigungen(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.REGELN_UND_BERECHTIGUNGEN, result.id);
            setFields(prev => ({ ...prev, [createRegelnUndBerechtigungenField]: url } as any));
          }
          setCreateRegelnUndBerechtigungenOpen(false);
        }}
        defaultValues={createRegelnUndBerechtigungenInitial
          ? ({ bezeichnung: createRegelnUndBerechtigungenInitial } as any)
          : undefined}
        nutzerList={nutzerList}
      />
    )}
    {createNutzerOpen && (
      <NutzerDialog
        open={createNutzerOpen}
        onClose={() => setCreateNutzerOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createNutzerEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as Nutzer;
            setExtraNutzer(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.NUTZER, result.id);
            setFields(prev => ({ ...prev, [createNutzerField]: url } as any));
          }
          setCreateNutzerOpen(false);
        }}
        defaultValues={createNutzerInitial
          ? ({ nutzer_firstname: createNutzerInitial } as any)
          : undefined}
      />
    )}
    </>
  );
}