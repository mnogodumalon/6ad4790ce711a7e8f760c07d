import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { IconAlertTriangle, IconPlus, IconGavel, IconShieldCheck, IconBulb, IconTargetArrow, IconUserOff, IconBook2 } from '@tabler/icons-react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import type { EnrichedEntscheidungen, EnrichedMassnahmen, EnrichedErfahrungen } from '@/types/enriched';
import { lookupOption } from '@/types/app';
import { LOOKUP_OPTIONS } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate, lookupKey } from '@/lib/formatters';
import { tx, dateFnsLocale } from '@/i18n';
import { useClock, gruss, namen, undoToast } from '@/lib/polish';
import { DashboardGrid } from '@/components/DashboardGrid';
import { WorkList } from '@/components/WorkList';
import { HeroBanner } from '@/components/HeroBanner';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { KanbanWidget, type KanbanCard, type KanbanColumn } from '@/components/widgets/KanbanWidget';

type KpiFilter = 'all' | 'overdue' | 'unowned';

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const { vorhaben, lernpruefungen, erfahrungen, setVorhaben, setEntscheidungen, setMassnahmen, fetchAll } = data;
  const clock = useClock();
  const today = format(clock, 'yyyy-MM-dd');
  const [kpiFilter, setKpiFilter] = useState<KpiFilter>('all');

  // --- shared write helpers (hero, work lists and overlay footer use the same paths) ---
  function advanceEntscheidung(r: EnrichedEntscheidungen) {
    if (lookupKey(r.fields.status) !== 'vorbereitet') { crud.entscheidungen.openDetail(r); return; }
    const prev = r.fields.status;
    const set = (s: typeof prev) =>
      setEntscheidungen(list => list.map(e => (e.record_id === r.record_id ? { ...e, fields: { ...e.fields, status: s } } : e)));
    set(lookupOption('entscheidungen', 'status', 'in_pruefung'));
    LivingAppsService.updateEntscheidungenEntry(r.record_id, { status: 'in_pruefung' }).catch(() => fetchAll());
    undoToast(tx`Entscheidung in Prüfung gesetzt`, () => {
      set(prev);
      LivingAppsService.updateEntscheidungenEntry(r.record_id, { status: prev?.key ?? 'vorbereitet' }).catch(() => fetchAll());
    });
  }

  function releaseMassnahme(r: EnrichedMassnahmen) {
    const prev = r.fields.status;
    const prevDate = r.fields.freigabedatum;
    const stamp = format(clock, "yyyy-MM-dd'T'HH:mm");
    const set = (s: typeof prev, d: string | undefined) =>
      setMassnahmen(list => list.map(m => (m.record_id === r.record_id ? { ...m, fields: { ...m.fields, status: s, freigabedatum: d } } : m)));
    set(lookupOption('massnahmen', 'status', 'freigegeben'), stamp);
    LivingAppsService.updateMassnahmenEntry(r.record_id, { status: 'freigegeben', freigabedatum: stamp }).catch(() => fetchAll());
    undoToast(tx`Maßnahme freigegeben`, () => {
      set(prev, prevDate);
      LivingAppsService.updateMassnahmenEntry(r.record_id, { status: prev?.key ?? 'vorgeschlagen', freigabedatum: prevDate }).catch(() => fetchAll());
    });
  }

  function reviewErfahrung(r: EnrichedErfahrungen) {
    crud.lernpruefungen.openCreate({ erfahrung: r.record_id });
  }

  const crud = useEntityCrud(data, {
    footer: top => {
      if (top.type === 'entscheidungen' && lookupKey(top.record.fields.status) === 'vorbereitet')
        return { label: tx('Prüfung starten'), onClick: () => advanceEntscheidung(top.record) };
      if (top.type === 'massnahmen' && lookupKey(top.record.fields.status) === 'vorgeschlagen')
        return { label: tx('Freigeben'), onClick: () => releaseMassnahme(top.record) };
      if (top.type === 'erfahrungen' && lookupKey(top.record.fields.status) === 'entwurf')
        return { label: tx('Prüfung erfassen'), onClick: () => reviewErfahrung(top.record) };
      return undefined;
    },
  });
  const enrichedEntscheidungen = crud.enriched.entscheidungen;
  const enrichedMassnahmen = crud.enriched.massnahmen;
  const enrichedErfahrungen = crud.enriched.erfahrungen;
  const enrichedVorhaben = crud.enriched.vorhaben;

  // --- derived work axes ---
  const openDecisions = useMemo(
    () =>
      enrichedEntscheidungen
        .filter(e => ['vorbereitet', 'in_pruefung'].includes(lookupKey(e.fields.status) ?? ''))
        .sort((a, b) => (a.fields.frist ?? '9999').localeCompare(b.fields.frist ?? '9999')),
    [enrichedEntscheidungen],
  );
  const overdueDecisions = openDecisions.filter(e => e.fields.frist && e.fields.frist < today);

  const awaitingRelease = useMemo(
    () => enrichedMassnahmen.filter(m => lookupKey(m.fields.status) === 'vorgeschlagen'),
    [enrichedMassnahmen],
  );

  const draftExperiences = useMemo(
    () => enrichedErfahrungen.filter(e => lookupKey(e.fields.status) === 'entwurf'),
    [enrichedErfahrungen],
  );
  const dueReviews = useMemo(
    () =>
      lernpruefungen
        .filter(l => l.fields.naechste_ueberpruefung && l.fields.naechste_ueberpruefung <= format(new Date(clock.getTime() + 14 * 86400000), 'yyyy-MM-dd'))
        .sort((a, b) => (a.fields.naechste_ueberpruefung ?? '').localeCompare(b.fields.naechste_ueberpruefung ?? '')),
    [lernpruefungen, clock],
  );

  const doneKeys = ['abgeschlossen'];
  const activeVorhaben = enrichedVorhaben.filter(v => !doneKeys.includes(lookupKey(v.fields.arbeitszustand) ?? ''));
  const lateVorhaben = activeVorhaben.filter(v => v.fields.zieltermin && v.fields.zieltermin < today);
  const unownedVorhaben = activeVorhaben.filter(v => !v.fields.verantwortlicher);
  const checkedShare = erfahrungen.length ? erfahrungen.filter(e => lookupKey(e.fields.status) === 'geprueft').length : 0;

  // --- kanban ---
  const columns = useMemo<KanbanColumn[]>(
    () => (LOOKUP_OPTIONS['vorhaben']?.['arbeitszustand'] ?? []).map(o => ({ key: o.key, label: o.label })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clock],
  );
  const cards = useMemo<KanbanCard[]>(() => {
    const filtered =
      kpiFilter === 'overdue' ? lateVorhaben : kpiFilter === 'unowned' ? unownedVorhaben : enrichedVorhaben;
    return [...filtered]
      .sort((a, b) => (a.fields.zieltermin ?? '9999').localeCompare(b.fields.zieltermin ?? '9999'))
      .map(v => {
        const key = lookupKey(v.fields.arbeitszustand) ?? columns[0]?.key ?? '';
        const late = !!v.fields.zieltermin && v.fields.zieltermin < today && key !== 'abgeschlossen';
        const parts = [v.verantwortlicherName, v.fields.zieltermin ? formatDate(v.fields.zieltermin) : ''].filter(Boolean);
        return {
          id: `vorhaben:${v.record_id}`,
          column: key,
          title: v.fields.titel ?? tx('Ohne Titel'),
          subtitle: parts.join(' · '),
          tone: late ? 'destructive' : key === 'wartet_auf_entscheidung' ? 'warning' : 'default',
        };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrichedVorhaben, kpiFilter, today, columns]);

  function moveCard(cardId: string, newColumn: string) {
    const rid = cardId.split(':')[1];
    const rec = vorhaben.find(v => v.record_id === rid);
    if (!rid || !rec) return;
    const prev = rec.fields.arbeitszustand;
    const set = (s: typeof prev) =>
      setVorhaben(list => list.map(v => (v.record_id === rid ? { ...v, fields: { ...v.fields, arbeitszustand: s } } : v)));
    set(lookupOption('vorhaben', 'arbeitszustand', newColumn));
    LivingAppsService.updateVorhabenEntry(rid, { arbeitszustand: newColumn }).catch(() => fetchAll());
    undoToast(tx`Arbeitszustand geändert`, () => {
      set(prev);
      LivingAppsService.updateVorhabenEntry(rid, { arbeitszustand: prev?.key ?? newColumn }).catch(() => fetchAll());
    });
  }

  // --- context line ---
  const first = overdueDecisions[0];
  let context: string;
  if (vorhaben.length === 0) context = tx`Lege dein erstes Vorhaben an, damit Kontext und Entscheidungen an einem Ort liegen.`;
  else if (overdueDecisions.length > 0)
    context = tx`${namen(overdueDecisions.map(e => e.vorhabenName))}: Entscheidungsfrist überschritten.`;
  else if (awaitingRelease.length > 0)
    context = tx`Zur Freigabe warten Maßnahmen bei ${namen(awaitingRelease.map(m => m.vorhabenName))}.`;
  else if (openDecisions.length > 0)
    context = tx`Offene Entscheidungen bei ${namen(openDecisions.map(e => e.vorhabenName))}.`;
  else if (activeVorhaben.length > 0)
    context = tx`Gerade laufen ${namen(activeVorhaben.map(v => v.fields.titel ?? ''))}.`;
  else context = tx`Alle Vorhaben sind abgeschlossen — Erfahrungen sichern das Wissen.`;

  const dayLabel = (d?: string) => (d ? formatDate(d) : '—');

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{gruss(clock)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{context}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{format(clock, 'EEEE, d. MMMM yyyy', { locale: dateFnsLocale() })}</p>
        </div>
        {crud.vorhaben.canWrite && (
          <Button onClick={() => crud.vorhaben.openCreate({ arbeitszustand: 'idee' })} className="w-full sm:w-auto">
            <IconPlus size={16} className="shrink-0" />
            {tx('Neues Vorhaben')}
          </Button>
        )}
      </header>

      <DashboardGrid
        variant="wide"
        hero={
          vorhaben.length === 0 ? (
            crud.vorhaben.canWrite ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-8 text-center">
                <IconTargetArrow size={48} className="text-muted-foreground" />
                <p className="max-w-md text-sm text-muted-foreground">
                  {tx('Hier bearbeiten Menschen und KI gemeinsam komplexe Vorhaben — mit Kontext, Entscheidungen und Erfahrungen.')}
                </p>
                <Button onClick={() => crud.vorhaben.openCreate({ arbeitszustand: 'idee' })}>{tx('Erstes Vorhaben anlegen')}</Button>
              </div>
            ) : undefined
          ) : first ? (
            <HeroBanner
              icon={<IconAlertTriangle size={18} />}
              action={{
                label: lookupKey(first.fields.status) === 'vorbereitet' ? tx('Prüfung starten') : tx('Entscheidung öffnen'),
                onClick: () => advanceEntscheidung(first),
              }}
            >
              <b>{namen(overdueDecisions.map(e => e.vorhabenName))}</b>{' '}
              {tx`— Entscheidungsfrist überschritten:`} {first.fields.entscheidungsfrage?.slice(0, 80)} ({tx`Frist`} {dayLabel(first.fields.frist)}
              {first.zustaendigerName ? `, ${first.zustaendigerName}` : ''})
            </HeroBanner>
          ) : undefined
        }
        kpis={
          vorhaben.length === 0 ? undefined : (
            <StatStrip>
              <StatStripItem
                title={tx('Zieltermin überschritten')}
                value={lateVorhaben.length}
                icon={<IconTargetArrow size={16} className="text-muted-foreground" />}
                tone={lateVorhaben.length > 0 ? 'warning' : 'default'}
                onClick={() => setKpiFilter(f => (f === 'overdue' ? 'all' : 'overdue'))}
                active={kpiFilter === 'overdue'}
              />
              <StatStripItem
                title={tx('Ohne Verantwortlichen')}
                value={unownedVorhaben.length}
                icon={<IconUserOff size={16} className="text-muted-foreground" />}
                tone={unownedVorhaben.length > 0 ? 'warning' : 'default'}
                onClick={() => setKpiFilter(f => (f === 'unowned' ? 'all' : 'unowned'))}
                active={kpiFilter === 'unowned'}
              />
              <StatStripItem
                title={tx('Erfahrungen geprüft')}
                value={`${checkedShare} / ${erfahrungen.length}`}
                icon={<IconBook2 size={16} className="text-muted-foreground" />}
                tone="default"
              />
            </StatStrip>
          )
        }
        primary={
          <KanbanWidget
            cards={cards}
            columns={columns}
            defaultCollapsed={['abgeschlossen', 'pausiert']}
            onCardClick={card => {
              const rec = vorhaben.find(v => v.record_id === card.id.split(':')[1]);
              if (rec) crud.vorhaben.openDetail(rec);
            }}
            onCardMove={crud.vorhaben.canWrite ? moveCard : undefined}
            onAddCard={crud.vorhaben.canWrite ? column => crud.vorhaben.openCreate({ arbeitszustand: column }) : undefined}
          />
        }
        aside={
          <>
            <WorkList
              title={tx('Offene Entscheidungen')}
              icon={<IconGavel size={14} />}
              items={openDecisions.map(e => {
                const late = !!e.fields.frist && e.fields.frist < today;
                return {
                  id: e.record_id,
                  title: e.fields.entscheidungsfrage ?? e.vorhabenName,
                  secondLine: (
                    <>
                      <span className={late ? 'font-medium text-destructive' : 'font-medium text-amber-600'}>
                        {late ? tx('Überfällig') : e.fields.status?.label}
                      </span>
                      <span className="text-muted-foreground"> · {e.vorhabenName} · {tx('Frist')} {dayLabel(e.fields.frist)}</span>
                    </>
                  ),
                  action: lookupKey(e.fields.status) === 'vorbereitet'
                    ? { label: tx('Prüfen'), onClick: () => advanceEntscheidung(e) }
                    : undefined,
                };
              })}
              onItemClick={id => {
                const rec = data.entscheidungen.find(e => e.record_id === id);
                if (rec) crud.entscheidungen.openDetail(rec);
              }}
              empty={{ text: tx('Keine offene Entscheidung — alles entschieden.') }}
            />
            <WorkList
              title={tx('Wartet auf Freigabe')}
              icon={<IconShieldCheck size={14} />}
              items={awaitingRelease.map(m => {
                const ki = lookupKey(m.fields.herkunft) === 'ki_vorschlag';
                return {
                  id: m.record_id,
                  title: m.fields.beschreibung ?? m.vorhabenName,
                  secondLine: (
                    <>
                      <span className={ki ? 'font-medium text-violet-600' : 'font-medium text-muted-foreground'}>
                        {ki ? tx('KI-Vorschlag') : tx('Von Mensch')}
                      </span>
                      <span className="text-muted-foreground"> · {m.vorhabenName}</span>
                    </>
                  ),
                  action: crud.massnahmen.canWrite ? { label: tx('Freigeben'), onClick: () => releaseMassnahme(m) } : undefined,
                };
              })}
              onItemClick={id => {
                const rec = data.massnahmen.find(m => m.record_id === id);
                if (rec) crud.massnahmen.openDetail(rec);
              }}
              empty={{ text: tx('Nichts wartet auf Freigabe.') }}
            />
            <WorkList
              title={tx('Erfahrungen & Überprüfungen')}
              icon={<IconBulb size={14} />}
              items={[
                ...dueReviews.map(l => {
                  const late = (l.fields.naechste_ueberpruefung ?? '') < today;
                  const exp = enrichedErfahrungen.find(e => e.record_id === l.fields.erfahrung?.split('/').pop());
                  return {
                    id: `l:${l.record_id}`,
                    title: exp?.fields.titel ?? tx('Überprüfung'),
                    secondLine: (
                      <>
                        <span className={late ? 'font-medium text-destructive' : 'font-medium text-amber-600'}>
                          {late ? tx('Überprüfung überfällig') : tx('Überprüfung ansteht')}
                        </span>
                        <span className="text-muted-foreground"> · {dayLabel(l.fields.naechste_ueberpruefung)}</span>
                      </>
                    ),
                    action: exp && crud.lernpruefungen.canWrite
                      ? { label: tx('Prüfen'), onClick: () => reviewErfahrung(exp) }
                      : undefined,
                  };
                }),
                ...draftExperiences.map(e => ({
                  id: `e:${e.record_id}`,
                  title: e.fields.titel ?? tx('Ohne Titel'),
                  secondLine: (
                    <>
                      <span className="font-medium text-muted-foreground">{tx('Entwurf')}</span>
                      <span className="text-muted-foreground"> · {e.erfasst_vonName || e.vorhabenName}</span>
                    </>
                  ),
                  action: crud.lernpruefungen.canWrite ? { label: tx('Prüfen'), onClick: () => reviewErfahrung(e) } : undefined,
                })),
              ]}
              onItemClick={id => {
                const [kind, rid] = id.split(':');
                if (kind === 'l') {
                  const rec = lernpruefungen.find(l => l.record_id === rid);
                  if (rec) crud.lernpruefungen.openDetail(rec);
                } else {
                  const rec = data.erfahrungen.find(e => e.record_id === rid);
                  if (rec) crud.erfahrungen.openDetail(rec);
                }
              }}
              empty={{
                text: tx('Keine Entwürfe oder Überprüfungen offen.'),
                action: crud.erfahrungen.canWrite
                  ? { label: tx('Erfahrung erfassen'), onClick: () => crud.erfahrungen.openCreate({ status: 'entwurf' }) }
                  : undefined,
              }}
            />
          </>
        }
      />
      {crud.surfaces}
    </div>
  );
}
