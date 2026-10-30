import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db, SETTING } from './db';
import { Habit, HabitSection, HabitLog, TrackerTemplate } from './types';
import { TEMPLATES } from './data/templates';
import { Header, VIEW_TABS } from './components/Header';
import { MatrixGrid } from './components/MatrixGrid';
import { DailyRoutineView } from './components/DailyRoutineView';
import { BiAnalyticsDashboard } from './components/BiAnalyticsDashboard';
import { CellEditorModal } from './components/CellEditorModal';
import { StudioSheet } from './components/StudioSheet';
import { TemplatesSheet } from './components/TemplatesSheet';
import { newId } from './utils/templateOps';
import { DEFAULT_PRAYER_CONFIG, PrayerConfig } from './utils/prayerTimes';
import { PrayerSettingsSheet } from './components/PrayerSettingsSheet';
import { ActivityFilter, ALL_ACTIVITIES, filterHabits } from './components/ActivityFilter';
import { downloadExcel, getEmailReportUri } from './utils/exportUtils';
import { shareFile } from './utils/share';
import { monthChartPdf } from './utils/monthChart';
import { Toast, ToastMessage } from './components/Toast';
import { todayStr, currentMonthStr } from './utils/date';
import { DataSheet } from './components/DataSheet';
import { HabitEditorSheet } from './components/HabitEditorSheet';
import { SampleDataPrompt } from './components/SampleDataPrompt';

export const App: React.FC = () => {
  const [templates, setTemplates] = useState<TrackerTemplate[]>(TEMPLATES);
  const [currentTemplate, setCurrentTemplate] = useState<TrackerTemplate>(TEMPLATES[0]);
  const [sections, setSections] = useState<HabitSection[]>(TEMPLATES[0].sections);
  const [habits, setHabits] = useState<Habit[]>(TEMPLATES[0].habits);
  const [logs, setLogs] = useState<HabitLog[]>([]);

  // Navigation & View state
  const [activeView, setActiveView] = useState<'matrix' | 'daily' | 'bi' | 'customize'>('matrix');
  const [currentMonth, setCurrentMonth] = useState<string>(() => currentMonthStr());
  const [selectedDate, setSelectedDate] = useState<string>(() => todayStr());
  const [monthlyRemarks, setMonthlyRemarks] = useState<string>('');

  // Hijri Calendar state (active by default for spiritual tracker)
  const [showHijri, setShowHijri] = useState<boolean>(true);
  const [hijriOffset, setHijriOffset] = useState<number>(0);

  // Modals state
  const [cellModalData, setCellModalData] = useState<{
    habit: Habit;
    date: string;
    dayNumber: number;
    log?: HabitLog;
  } | null>(null);

  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);
  const [isDataOpen, setIsDataOpen] = useState<boolean>(false);
  // Habit editor: { habit } edits, { sectionId } creates
  const [editingHabit, setEditingHabit] = useState<{ habit?: Habit; sectionId?: string } | null>(null);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState<boolean>(false);
  const [isPrayerOpen, setIsPrayerOpen] = useState<boolean>(false);
  const [prayerConfig, setPrayerConfig] = useState<PrayerConfig>(DEFAULT_PRAYER_CONFIG);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const showToast = useCallback((t: Omit<ToastMessage, 'id'>) => setToast({ ...t, id: Date.now() }), []);
  const dismissToast = useCallback(() => setToast(null), []);

  // True once stored data + settings have loaded (prevents saving defaults over stored settings)
  const [ready, setReady] = useState<boolean>(false);
  const [sampleDismissed, setSampleDismissed] = useState<boolean>(true);

  // Activity filter: show every habit, one section, or a single habit across Matrix / Daily / Analytics
  const [activityFilter, setActivityFilter] = useState<string>(ALL_ACTIVITIES);
  useEffect(() => { setActivityFilter(ALL_ACTIVITIES); }, [currentTemplate.id]);
  const visibleHabits = useMemo(() => filterHabits(habits, activityFilter), [habits, activityFilter]);
  const visibleSections = useMemo(
    () => (activityFilter === ALL_ACTIVITIES ? sections : sections.filter(s => visibleHabits.some(h => h.sectionId === s.id))),
    [sections, visibleHabits, activityFilter]
  );

  // Load everything from the local database (used at launch and after restore / sample changes)
  const loadAll = useCallback(async () => {
    await db.ensureDefaultTemplates();

    const [dbTemplates, allLogs, storedTemplateId, storedShowHijri, storedOffset, dismissed] = await Promise.all([
      db.templates.toArray(),
      db.logs.toArray(),
      db.getSetting<string | null>(SETTING.currentTemplateId, null),
      db.getSetting<boolean>(SETTING.showHijri, true),
      db.getSetting<number>(SETTING.hijriOffset, 0),
      db.getSetting<boolean>(SETTING.sampleDismissed, false)
    ]);
    setPrayerConfig({ ...DEFAULT_PRAYER_CONFIG, ...(await db.getSetting<PrayerConfig | null>(SETTING.prayerConfig, null)) });

    if (dbTemplates.length > 0) {
      // Keep built-in templates in their defined order, then the user's own
      const order = new Map(TEMPLATES.map((t, i) => [t.id, i]));
      dbTemplates.sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
      setTemplates(dbTemplates);
      const active = dbTemplates.find(t => t.id === storedTemplateId) || dbTemplates[0];
      setCurrentTemplate(active);
      setSections(active.sections);
      setHabits(active.habits);
    }

    setLogs(allLogs);
    setShowHijri(storedShowHijri);
    setHijriOffset(storedOffset);
    setSampleDismissed(dismissed);
    setReady(true);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Remember settings between launches
  useEffect(() => { if (ready) db.setSetting(SETTING.currentTemplateId, currentTemplate.id); }, [ready, currentTemplate.id]);
  useEffect(() => { if (ready) db.setSetting(SETTING.showHijri, showHijri); }, [ready, showHijri]);
  useEffect(() => { if (ready) db.setSetting(SETTING.hijriOffset, hijriOffset); }, [ready, hijriOffset]);
  useEffect(() => { if (ready) db.setSetting(SETTING.prayerConfig, prayerConfig); }, [ready, prayerConfig]);

  // When currentTemplate changes, reload its sections & habits
  useEffect(() => {
    setSections(currentTemplate.sections);
    setHabits(currentTemplate.habits);
  }, [currentTemplate]);

  // When month or template changes, reload remarks
  useEffect(() => {
    const loadRemarks = async () => {
      const rec = await db.remarks
        .where({ templateId: currentTemplate.id, monthKey: currentMonth })
        .first();
      setMonthlyRemarks(rec?.remarks || '');
    };
    loadRemarks();
  }, [currentMonth, currentTemplate, ready, logs.length]);

  // Handle Android hardware back button & Escape key to close active modals before exiting
  useEffect(() => {
    const handleBackOrEscape = (e: Event) => {
      if (cellModalData) {
        e.preventDefault?.();
        setCellModalData(null);
      } else if (isCustomizerOpen) {
        e.preventDefault?.();
        setIsCustomizerOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleBackOrEscape(e);
    };
    document.addEventListener('backbutton', handleBackOrEscape, false);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('backbutton', handleBackOrEscape, false);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [cellModalData, isCustomizerOpen]);

  // Handle cell click on 31-day matrix
  const handleCellClick = (habit: Habit, date: string, dayNumber: number) => {
    const existingLog = logs.find(l => l.habitId === habit.id && l.date === date);

    // If boolean, quick toggle directly or open modal
    if (habit.inputType === 'BOOLEAN') {
      const newStatus = existingLog?.status === 'COMPLETED' ? 'FAILED' : 'COMPLETED';
      handleUpdateLog(habit.id, {
        status: newStatus,
        numericValue: newStatus === 'COMPLETED' ? 1 : 0,
        date
      });
      return;
    }

    // Open detailed editor modal for multi-state, quantity, duration
    setCellModalData({
      habit,
      date,
      dayNumber,
      log: existingLog
    });
  };

  // Upsert a habit log in state and Dexie
  const handleUpdateLog = useCallback(async (habitId: string, logData: Partial<HabitLog>) => {
    const targetDate = logData.date || selectedDate;
    const existingLogIndex = logs.findIndex(l => l.habitId === habitId && l.date === targetDate);

    let existing: HabitLog | undefined = existingLogIndex >= 0 ? logs[existingLogIndex] : undefined;
    if (!existing) {
      existing = await db.logs.where({ habitId, date: targetDate }).first();
    }
    const existingId = existing?.id;

    // Merge into the existing entry so fields not part of this update (notes, custom amount,
    // Lataif unit, prayer state…) survive. Keys passed explicitly as undefined still clear.
    const logToSave: HabitLog = {
      ...(existing ?? {}),
      ...logData,
      habitId,
      date: targetDate,
      status: logData.status ?? existing?.status ?? 'COMPLETED',
      numericValue: 'numericValue' in logData ? (logData.numericValue ?? 0) : (existing?.numericValue ?? 0),
      timestamp: Date.now()
    };
    delete logToSave.id;

    if (existingId) {
      logToSave.id = existingId;
    }

    // Save to Dexie
    const id = await db.logs.put(logToSave);
    logToSave.id = id;

    // Update state
    setLogs(prev => {
      const updated = [...prev];
      if (existingLogIndex >= 0) {
        updated[existingLogIndex] = logToSave;
      } else {
        const foundAgain = updated.findIndex(l => l.habitId === habitId && l.date === targetDate);
        if (foundAgain >= 0) {
          updated[foundAgain] = logToSave;
        } else {
          updated.push(logToSave);
        }
      }
      return updated;
    });
  }, [logs, selectedDate]);

  // Save monthly remarks
  const handleRemarksChange = async (val: string) => {
    setMonthlyRemarks(val);
    const existing = await db.remarks
      .where({ templateId: currentTemplate.id, monthKey: currentMonth })
      .first();

    await db.remarks.put({
      id: existing?.id,
      templateId: currentTemplate.id,
      monthKey: currentMonth,
      remarks: val
    });
  };

  // ---------------------------------------------------------------------------
  // Templates, sections and habits — one save path keeps state and database in sync
  // ---------------------------------------------------------------------------

  /** Saves a template (state, template list and database). Sections/habits tables mirror it. */
  const commitTemplate = useCallback(async (updated: TrackerTemplate) => {
    setTemplates(prev => (prev.some(t => t.id === updated.id) ? prev.map(t => (t.id === updated.id ? updated : t)) : [...prev, updated]));
    setCurrentTemplate(cur => (cur.id === updated.id ? updated : cur));
    await db.transaction('rw', [db.templates, db.sections, db.habits], async () => {
      await db.templates.put(updated);
      await db.sections.bulkPut(updated.sections);
      await db.habits.bulkPut(updated.habits);
    });
  }, []);

  const renumber = <T extends { order: number }>(list: T[]) => list.map((x, i) => ({ ...x, order: i + 1 }));

  const commitHabits = (updatedHabits: Habit[]) => commitTemplate({ ...currentTemplate, habits: updatedHabits });
  const commitSections = (updatedSections: HabitSection[], updatedHabits = habits) =>
    commitTemplate({ ...currentTemplate, sections: updatedSections, habits: updatedHabits });

  const handleAddHabit = async (newHabit: Habit) => {
    // New habits go to the end of their section
    const others = habits.filter(h => h.sectionId !== newHabit.sectionId);
    const inSection = habits.filter(h => h.sectionId === newHabit.sectionId);
    const ordered = sections.flatMap(sec => (sec.id === newHabit.sectionId ? [...inSection, newHabit] : others.filter(h => h.sectionId === sec.id)));
    const orphans = others.filter(h => !sections.some(sec => sec.id === h.sectionId));
    await commitHabits(renumber([...ordered, ...orphans]));
  };

  const handleDeleteHabit = async (habitId: string) => {
    await db.transaction('rw', [db.habits, db.logs], async () => {
      await db.habits.delete(habitId);
      await db.logs.where('habitId').equals(habitId).delete();
    });
    setLogs(prev => prev.filter(l => l.habitId !== habitId));
    await commitHabits(habits.filter(h => h.id !== habitId));
  };

  // Edit an existing habit (name, section, cadence, targets…); history stays attached by id
  const handleUpdateHabit = async (updated: Habit) => {
    const prev = habits.find(h => h.id === updated.id);
    if (!prev) return handleAddHabit(updated);
    let list = habits.map(h => (h.id === updated.id ? updated : h));
    if (prev.sectionId !== updated.sectionId) {
      // Moving to another section puts it at the end of that section
      list = list.filter(h => h.id !== updated.id);
      const lastIdx = list.map(h => h.sectionId).lastIndexOf(updated.sectionId);
      list.splice(lastIdx + 1, 0, updated);
    }
    await commitHabits(renumber(list));
  };

  // Move a habit up/down within its section
  const handleMoveHabit = async (habitId: string, direction: -1 | 1) => {
    const idx = habits.findIndex(h => h.id === habitId);
    if (idx < 0) return;
    const sectionId = habits[idx].sectionId;
    let j = idx + direction;
    while (j >= 0 && j < habits.length && habits[j].sectionId !== sectionId) j += direction;
    if (j < 0 || j >= habits.length) return;
    const list = [...habits];
    [list[idx], list[j]] = [list[j], list[idx]];
    await commitHabits(renumber(list));
  };

  const handleAddSection = async (title: string, urduTitle?: string) => {
    await commitSections(renumber([...sections, { id: newId('sec'), title, urduTitle, order: 0 }]));
  };

  const handleRenameSection = async (sectionId: string, title: string, urduTitle?: string) => {
    await commitSections(sections.map(sec => (sec.id === sectionId ? { ...sec, title, urduTitle } : sec)));
  };

  const handleMoveSection = async (sectionId: string, direction: -1 | 1) => {
    const ordered = [...sections].sort((a, b) => a.order - b.order);
    const i = ordered.findIndex(sec => sec.id === sectionId);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= ordered.length) return;
    [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
    await commitSections(renumber(ordered));
  };

  // Deleting a section deletes its habits and their entries
  const handleDeleteSection = async (sectionId: string) => {
    const doomed = habits.filter(h => h.sectionId === sectionId).map(h => h.id);
    await db.transaction('rw', [db.sections, db.habits, db.logs], async () => {
      await db.sections.delete(sectionId);
      await db.habits.bulkDelete(doomed);
      await db.logs.where('habitId').anyOf(doomed).delete();
    });
    setLogs(prev => prev.filter(l => !doomed.includes(l.habitId)));
    await commitSections(renumber(sections.filter(sec => sec.id !== sectionId)), habits.filter(h => h.sectionId !== sectionId));
  };

  const handleSwitchTemplate = (id: string) => {
    const t = templates.find(x => x.id === id);
    if (t) setCurrentTemplate(t);
  };

  const handleCreateTemplate = async (t: TrackerTemplate) => {
    await commitTemplate(t);
    setCurrentTemplate(t);
    showToast({ text: `Created “${t.title}”` });
  };

  // Deleting a template removes its habits and entries; built-ins are remembered as deleted
  const handleDeleteTemplate = async (id: string) => {
    const t = templates.find(x => x.id === id);
    if (!t || templates.length <= 1) return;
    const habitIds = t.habits.map(h => h.id);
    await db.transaction('rw', [db.templates, db.sections, db.habits, db.logs, db.remarks], async () => {
      await db.templates.delete(id);
      await db.sections.bulkDelete(t.sections.map(sec => sec.id));
      await db.habits.bulkDelete(habitIds);
      await db.logs.where('habitId').anyOf(habitIds).delete();
      await db.remarks.filter(r => r.templateId === id).delete();
    });
    setLogs(prev => prev.filter(l => !habitIds.includes(l.habitId)));
    const remaining = templates.filter(x => x.id !== id);
    setTemplates(remaining);
    if (currentTemplate.id === id) setCurrentTemplate(remaining[0]);
    showToast({ text: `Deleted “${t.title}”` });
  };

  const handleRestoreBuiltIn = async (id: string) => {
    const t = TEMPLATES.find(x => x.id === id);
    if (!t) return;
    await commitTemplate(t);
    setCurrentTemplate(t);
  };

  const deletedBuiltIns = useMemo(() => TEMPLATES.filter(t => !templates.some(x => x.id === t.id)), [templates]);

  const entryCountByHabit = useMemo(() => {
    const m: Record<string, number> = {};
    for (const l of logs) if (!l.sample) m[l.habitId] = (m[l.habitId] ?? 0) + 1;
    return m;
  }, [logs]);

  const entryCountByTemplate = useMemo(() => {
    const m: Record<string, number> = {};
    for (const t of templates) m[t.id] = t.habits.reduce((n, h) => n + (entryCountByHabit[h.id] ?? 0), 0);
    return m;
  }, [templates, entryCountByHabit]);

  const exportTemplate = (t: TrackerTemplate) =>
    runExport(() =>
      shareFile({
        filename: `${t.title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-') || 'template'}-template.json`,
        data: JSON.stringify(t, null, 2),
        mimeType: 'application/json',
        title: `${t.title} template`
      })
    );

  // Export and Share Handlers
  // Run an export and report problems (cancelling the share sheet is not a problem)
  const runExport = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (e) {
      showToast({ text: `Couldn't export: ${(e as Error).message || 'unknown error'}`, tone: 'error' });
    }
  };

  const handleExportExcel = () =>
    runExport(() =>
      downloadExcel(
        currentTemplate,
        habits,
        sections,
        logs.filter(l => l.date.startsWith(currentMonth)),
        currentMonth,
        monthlyRemarks,
        showHijri,
        hijriOffset
      )
    );

  const handlePrintPDF = () =>
    runExport(async () => {
      const bytes = await monthChartPdf({
        template: currentTemplate,
        sections,
        habits,
        logs: logs.filter(l => l.date.startsWith(currentMonth)),
        monthKey: currentMonth,
        remarks: monthlyRemarks,
        showHijri,
        hijriOffset
      });
      return shareFile({
        filename: `${currentTemplate.title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')}-${currentMonth}.pdf`,
        data: bytes,
        mimeType: 'application/pdf',
        title: `${currentTemplate.title} — ${currentMonth}`
      });
    });

  const handleEmailReport = () => {
    const uri = getEmailReportUri(
      currentTemplate,
      currentMonth,
      habits,
      logs.filter(l => l.date.startsWith(currentMonth)),
      monthlyRemarks
    );
    window.location.href = uri;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Header */}
      <Header
        currentTemplate={currentTemplate}
        templates={templates}
        onSelectTemplate={setCurrentTemplate}
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenCustomizer={() => setIsCustomizerOpen(true)}
        showHijri={showHijri}
        onToggleHijri={() => setShowHijri(prev => !prev)}
        hijriOffset={hijriOffset}
        onOffsetChange={setHijriOffset}
        onExportExcel={handleExportExcel}
        onPrintPDF={handlePrintPDF}
        onEmailReport={handleEmailReport}
        onManageTemplates={() => setIsTemplatesOpen(true)}
        onOpenPrayer={() => setIsPrayerOpen(true)}
        onOpenData={() => setIsDataOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 pt-4 md:p-6 space-y-6 pb-[calc(env(safe-area-inset-bottom)+49px+24px)] sm:pb-[max(env(safe-area-inset-bottom),24px)]">
        {/* First-run choice: start fresh or explore with removable sample data */}
        {ready && logs.length === 0 && !sampleDismissed && (
          <SampleDataPrompt
            onLoad={async () => {
              await db.loadSampleData();
              await loadAll();
            }}
            onDismiss={() => {
              setSampleDismissed(true);
              db.setSetting(SETTING.sampleDismissed, true);
            }}
          />
        )}

        {/* Activity filter */}
        <div className="-mb-3">
          <ActivityFilter
            habits={habits}
            sections={sections}
            value={visibleHabits.length === habits.length ? ALL_ACTIVITIES : activityFilter}
            onChange={setActivityFilter}
            showUrdu={currentTemplate.id === 'daily_spiritual_schedule'}
          />
        </div>

        {activeView === 'matrix' && (
          <MatrixGrid
            template={currentTemplate}
            habits={visibleHabits}
            sections={visibleSections}
            logs={logs.filter(l => l.date.startsWith(currentMonth))}
            currentMonth={currentMonth}
            onCellClick={handleCellClick}
            onUpdateLog={handleUpdateLog}
            monthlyRemarks={monthlyRemarks}
            onRemarksChange={handleRemarksChange}
            onAddCustomHabit={(sectionId) => setEditingHabit({ sectionId })}
            onRemoveHabit={handleDeleteHabit}
            onEditHabit={(h) => setEditingHabit({ habit: h })}
            showHijri={showHijri}
            hijriOffset={hijriOffset}
          />
        )}

        {activeView === 'daily' && (
          <DailyRoutineView
            template={currentTemplate}
            habits={visibleHabits}
            sections={visibleSections}
            logs={logs}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onUpdateLog={handleUpdateLog}
            onRemoveHabit={handleDeleteHabit}
            showHijri={showHijri}
            hijriOffset={hijriOffset}
            prayerConfig={prayerConfig}
            onOpenPrayerSettings={() => setIsPrayerOpen(true)}
          />
        )}

        {activeView === 'bi' && (
          <BiAnalyticsDashboard
            template={currentTemplate}
            habits={visibleHabits}
            logs={logs.filter(l => l.date.startsWith(currentMonth))}
            currentMonth={currentMonth}
          />
        )}
      </main>

      {/* iPhone bottom tab bar (iPad/desktop show tabs in the header) */}
      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-[env(safe-area-inset-bottom)]"
        aria-label="Views"
      >
        <div className="flex h-[49px]">
          {VIEW_TABS.map(({ id, label, Icon }) => {
            const active = activeView === id;
            return (
              <button
                key={id}
                onClick={() => setActiveView(id)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition ${
                  active ? 'text-emerald-400' : 'text-slate-500'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="w-6 h-6" strokeWidth={active ? 2.25 : 1.75} />
                <span className="text-[11px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Cell Editor Modal */}
      {cellModalData && (
        <CellEditorModal
          habit={cellModalData.habit}
          date={cellModalData.date}
          dayNumber={cellModalData.dayNumber}
          currentLog={cellModalData.log}
          onSave={(logData) => {
            handleUpdateLog(cellModalData.habit.id, {
              ...logData,
              date: cellModalData.date
            });
            setCellModalData(null);
          }}
          onClose={() => setCellModalData(null)}
        />
      )}

      <Toast toast={toast} onDismiss={dismissToast} />

      {/* Backup, restore, sample data */}
      {isDataOpen && <DataSheet onClose={() => setIsDataOpen(false)} onDataChanged={loadAll} />}

      {/* Prayer times (location, method) */}
      {isPrayerOpen && (
        <PrayerSettingsSheet config={prayerConfig} onChange={setPrayerConfig} onClose={() => setIsPrayerOpen(false)} />
      )}

      {/* Templates: switch, create, duplicate, import/export, edit, delete */}
      {isTemplatesOpen && (
        <TemplatesSheet
          templates={templates}
          currentId={currentTemplate.id}
          entryCounts={entryCountByTemplate}
          deletedBuiltIns={deletedBuiltIns}
          onSwitch={handleSwitchTemplate}
          onCreate={handleCreateTemplate}
          onUpdate={commitTemplate}
          onDelete={handleDeleteTemplate}
          onExport={exportTemplate}
          onRestoreBuiltIn={handleRestoreBuiltIn}
          onClose={() => setIsTemplatesOpen(false)}
        />
      )}

      {/* Studio: sections and habits of the current template */}
      {isCustomizerOpen && (
        <StudioSheet
          template={currentTemplate}
          entryCountByHabit={entryCountByHabit}
          onAddHabit={(sectionId) => setEditingHabit({ sectionId })}
          onEditHabit={(h) => setEditingHabit({ habit: h })}
          onMoveHabit={handleMoveHabit}
          onAddSection={handleAddSection}
          onRenameSection={handleRenameSection}
          onMoveSection={handleMoveSection}
          onDeleteSection={handleDeleteSection}
          onClose={() => setIsCustomizerOpen(false)}
        />
      )}

      {/* Habit editor (above the Studio) */}
      {editingHabit && (
        <HabitEditorSheet
          habit={editingHabit.habit}
          defaultSectionId={editingHabit.sectionId}
          sections={sections}
          entryCount={editingHabit.habit ? entryCountByHabit[editingHabit.habit.id] ?? 0 : 0}
          onSave={handleUpdateHabit}
          onDelete={handleDeleteHabit}
          onClose={() => setEditingHabit(null)}
        />
      )}
    </div>
  );
};

export default App;
