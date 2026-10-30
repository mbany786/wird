import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db, SETTING } from './db';
import { Habit, HabitSection, HabitLog, TrackerTemplate } from './types';
import { TEMPLATES } from './data/templates';
import { Header, VIEW_TABS } from './components/Header';
import { MatrixGrid } from './components/MatrixGrid';
import { DailyRoutineView } from './components/DailyRoutineView';
import { BiAnalyticsDashboard } from './components/BiAnalyticsDashboard';
import { CellEditorModal } from './components/CellEditorModal';
import { TemplateCustomizerModal } from './components/TemplateCustomizerModal';
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
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
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

  // Add custom habit to current template
  const handleAddHabit = async (newHabit: Habit) => {
    const updatedHabits = [...habits, newHabit];
    setHabits(updatedHabits);
    await db.habits.put(newHabit);

    // Update in template object
    const updatedTemplate = {
      ...currentTemplate,
      habits: updatedHabits
    };
    setCurrentTemplate(updatedTemplate);
    setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
    await db.templates.put(updatedTemplate);
  };

  // Create a brand new blank template
  const handleCreateBlankTemplate = async () => {
    const newId = `custom_tracker_${Date.now()}`;
    const newSecId = `sec_${Date.now()}_1`;
    const newTemplate: TrackerTemplate = {
      id: newId,
      title: 'My Custom Tracker',
      description: 'Personalized habit tracker. Add custom sections, tasks, or generate them via prompt.',
      icon: 'Sparkles',
      badge: 'Custom Canvas',
      sections: [
        { id: newSecId, title: 'Daily Core Routine', order: 1 }
      ],
      habits: [
        { id: `habit_${Date.now()}_1`, sectionId: newSecId, title: 'Daily Focus Habit', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 1, isCustom: true }
      ]
    };

    await db.templates.put(newTemplate);
    for (const s of newTemplate.sections) await db.sections.put(s);
    for (const h of newTemplate.habits) await db.habits.put(h);

    setTemplates(prev => [...prev, newTemplate]);
    setCurrentTemplate(newTemplate);
    setSections(newTemplate.sections);
    setHabits(newTemplate.habits);
    setIsCustomizerOpen(true);
  };

  // Update existing template metadata (title, badge, description)
  const handleUpdateTemplate = async (updated: TrackerTemplate) => {
    setCurrentTemplate(updated);
    setSections(updated.sections);
    setHabits(updated.habits);
    setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
    await db.templates.put(updated);
  };

  // Add section to current template
  const handleAddSection = async (title: string) => {
    if (!title.trim()) return;
    const newSec: HabitSection = {
      id: `sec_${Date.now()}`,
      title: title.trim(),
      order: sections.length + 1
    };
    const updatedSections = [...sections, newSec];
    setSections(updatedSections);
    const updatedTemplate = { ...currentTemplate, sections: updatedSections };
    setCurrentTemplate(updatedTemplate);
    setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
    await db.sections.put(newSec);
    await db.templates.put(updatedTemplate);
  };

  // Delete section
  const handleDeleteSection = async (sectionId: string) => {
    const updatedSections = sections.filter(s => s.id !== sectionId);
    const updatedHabits = habits.filter(h => h.sectionId !== sectionId);
    setSections(updatedSections);
    setHabits(updatedHabits);
    const updatedTemplate = { ...currentTemplate, sections: updatedSections, habits: updatedHabits };
    setCurrentTemplate(updatedTemplate);
    setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
    await db.sections.delete(sectionId);
    await db.templates.put(updatedTemplate);
  };

  // Apply generated routine (sections & habits)
  const handleApplyGeneratedRoutine = async (newSections: HabitSection[], newHabits: Habit[], newTitle?: string) => {
    const updatedTemplate: TrackerTemplate = {
      ...currentTemplate,
      title: newTitle || currentTemplate.title,
      sections: newSections,
      habits: newHabits
    };
    setCurrentTemplate(updatedTemplate);
    setSections(newSections);
    setHabits(newHabits);
    setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
    await db.templates.put(updatedTemplate);
    for (const s of newSections) await db.sections.put(s);
    for (const h of newHabits) await db.habits.put(h);
  };

  // Delete habit
  // Save a changed habit list for the current template (state + database)
  const commitHabits = async (updatedHabits: Habit[]) => {
    const updatedTemplate = { ...currentTemplate, habits: updatedHabits };
    setHabits(updatedHabits);
    setCurrentTemplate(updatedTemplate);
    setTemplates(prev => prev.map(t => (t.id === updatedTemplate.id ? updatedTemplate : t)));
    await db.templates.put(updatedTemplate);
  };

  const handleDeleteHabit = async (habitId: string) => {
    await db.habits.delete(habitId);
    await commitHabits(habits.filter(h => h.id !== habitId));
  };

  // Edit an existing habit (name, section, cadence, targets…); history stays attached by id
  const handleUpdateHabit = async (updated: Habit) => {
    const exists = habits.some(h => h.id === updated.id);
    if (!exists) return;
    // Moving to another section puts it at the end of that section
    const prev = habits.find(h => h.id === updated.id)!;
    let list = habits.map(h => (h.id === updated.id ? updated : h));
    if (prev.sectionId !== updated.sectionId) {
      list = [...list.filter(h => h.id !== updated.id), updated];
    }
    list = list.map((h, i) => ({ ...h, order: i + 1 }));
    await db.habits.put(list.find(h => h.id === updated.id)!);
    await commitHabits(list);
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
    await commitHabits(list.map((h, i) => ({ ...h, order: i + 1 })));
  };

  // Export template as JSON
  const handleExportTemplate = () =>
    runExport(() =>
      shareFile({
        filename: `${currentTemplate.title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')}-template.json`,
        data: JSON.stringify(currentTemplate, null, 2),
        mimeType: 'application/json',
        title: `${currentTemplate.title} template`
      })
    );

  // Import custom template
  const handleImportTemplate = async (jsonStr: string) => {
    try {
      const parsed: TrackerTemplate = JSON.parse(jsonStr);
      if (!parsed.id || !parsed.title || !parsed.habits) {
        alert('Invalid template schema format.');
        return;
      }
      await db.templates.put(parsed);
      for (const s of parsed.sections) await db.sections.put(s);
      for (const h of parsed.habits) await db.habits.put(h);

      setTemplates(prev => [...prev.filter(t => t.id !== parsed.id), parsed]);
      setCurrentTemplate(parsed);
      setIsCustomizerOpen(false);
    } catch (e) {
      alert('Failed to parse JSON file.');
    }
  };

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
        onCreateBlankTemplate={handleCreateBlankTemplate}
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
            onAddCustomHabit={() => setIsCustomizerOpen(true)}
            onRemoveHabit={handleDeleteHabit}
            onEditHabit={(h) => setEditingHabit(h)}
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

      {/* Edit a habit (from the Studio or the Matrix quick-count panel) */}
      {editingHabit && (
        <HabitEditorSheet
          habit={editingHabit}
          sections={sections}
          entryCount={logs.filter(l => l.habitId === editingHabit.id && !l.sample).length}
          onSave={handleUpdateHabit}
          onDelete={handleDeleteHabit}
          onClose={() => setEditingHabit(null)}
        />
      )}

      <Toast toast={toast} onDismiss={dismissToast} />

      {/* Backup, restore, sample data */}
      {isDataOpen && <DataSheet onClose={() => setIsDataOpen(false)} onDataChanged={loadAll} />}

      {/* Template Customizer Modal */}
      {isCustomizerOpen && (
        <TemplateCustomizerModal
          template={currentTemplate}
          sections={sections}
          habits={habits}
          onAddHabit={handleAddHabit}
          onUpdateHabit={handleUpdateHabit}
          onEditHabit={(h) => setEditingHabit(h)}
          onMoveHabit={handleMoveHabit}
          onDeleteHabit={handleDeleteHabit}
          onAddSection={handleAddSection}
          onDeleteSection={handleDeleteSection}
          onUpdateTemplate={handleUpdateTemplate}
          onApplyGeneratedTemplate={handleApplyGeneratedRoutine}
          onClose={() => setIsCustomizerOpen(false)}
          onExportTemplate={handleExportTemplate}
          onImportTemplate={handleImportTemplate}
        />
      )}
    </div>
  );
};

export default App;
