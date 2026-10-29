import React, { useState, useEffect } from 'react';
import { Habit, HabitLog } from '../types';
import { X, Check, Minus, Plus, Play, Pause, RotateCcw, ShieldCheck, AlertTriangle } from 'lucide-react';

interface CellEditorModalProps {
  habit: Habit;
  date: string; // YYYY-MM-DD
  dayNumber: number;
  currentLog?: HabitLog;
  onSave: (logData: Partial<HabitLog>) => void;
  onClose: () => void;
}

export const CellEditorModal: React.FC<CellEditorModalProps> = ({
  habit,
  date,
  dayNumber,
  currentLog,
  onSave,
  onClose
}) => {
  const [numericVal, setNumericVal] = useState<number>(
    currentLog?.numericValue ?? (habit.targetValue || 0)
  );
  const [selectedState, setSelectedState] = useState<string | undefined>(
    currentLog?.stateCode
  );
  const [notes, setNotes] = useState<string>(currentLog?.notes ?? '');

  const isNegative = habit.category === 'NEGATIVE_ABSTINENCE';
  const [negativeIncidents, setNegativeIncidents] = useState<number>(
    currentLog?.numericValue ?? (currentLog?.status === 'FAILED' ? 1 : 0)
  );

  // Lataif dual mode state
  const [lataifMode, setLataifMode] = useState<'COUNT' | 'MIN'>(
    currentLog?.unitUsed === 'min' ? 'MIN' : 'COUNT'
  );
  const [lataifCount, setLataifCount] = useState<number>(
    currentLog?.unitUsed === 'min'
      ? Math.round((currentLog?.numericValue || 0) * (5000 / 30))
      : (currentLog?.numericValue ?? 5000)
  );
  const [lataifMinutes, setLataifMinutes] = useState<number>(
    currentLog?.unitUsed === 'min'
      ? (currentLog?.numericValue ?? 30)
      : Math.round(((currentLog?.numericValue ?? 5000) * 30) / 5000)
  );

  const handleUpdateLataifCount = (val: number) => {
    const validCount = Math.max(0, val);
    setLataifCount(validCount);
    setLataifMinutes(Math.round((validCount * 30) / 5000));
  };

  const handleUpdateLataifMin = (val: number) => {
    const validMin = Math.max(0, val);
    setLataifMinutes(validMin);
    setLataifCount(Math.round((validMin * 5000) / 30));
  };

  const handleSaveLataif = () => {
    if (lataifMode === 'COUNT') {
      const isComplete = lataifCount >= 5000;
      onSave({
        status: isComplete ? 'COMPLETED' : 'PARTIAL',
        numericValue: lataifCount,
        unitUsed: 'count',
        notes
      });
    } else {
      const isComplete = lataifMinutes >= 30;
      onSave({
        status: isComplete ? 'COMPLETED' : 'PARTIAL',
        numericValue: lataifMinutes,
        unitUsed: 'min',
        notes
      });
    }
  };
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(
    (currentLog?.numericValue || 0) * 60
  );

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleSaveBoolean = (status: 'COMPLETED' | 'FAILED' | 'SKIPPED') => {
    onSave({
      status,
      numericValue: status === 'COMPLETED' ? 1 : 0,
      notes
    });
  };

  const handleSaveMultiState = (stateCode: string) => {
    const stateObj = habit.multiStates?.find(s => s.code === stateCode);
    const isSuccess = stateObj ? stateObj.scoreWeight > 0 : false;
    onSave({
      status: isSuccess ? 'COMPLETED' : 'FAILED',
      stateCode,
      numericValue: stateObj ? stateObj.scoreWeight : 0,
      notes
    });
  };

  const handleSaveNumeric = () => {
    const isComplete = habit.targetValue ? numericVal >= habit.targetValue : numericVal > 0;
    onSave({
      status: isComplete ? 'COMPLETED' : 'PARTIAL',
      numericValue: numericVal,
      notes
    });
  };

  const handleSaveTimer = () => {
    const totalMinutes = Math.round(timerSeconds / 60);
    const isComplete = habit.targetValue ? totalMinutes >= habit.targetValue : totalMinutes > 0;
    onSave({
      status: isComplete ? 'COMPLETED' : 'PARTIAL',
      numericValue: totalMinutes,
      notes
    });
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <span>Day {dayNumber}</span>
            <span>•</span>
            <span>{date}</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">{habit.title}</h2>
          {habit.urduTitle && (
            <p className="text-sm text-emerald-300 font-medium" dir="rtl">{habit.urduTitle}</p>
          )}
        </div>

        {/* Input Form based on habit category and inputType */}
        <div className="space-y-5">
          {/* 0. NEGATIVE HABITS / ABSTINENCE (Inverse Tracking) */}
          {isNegative ? (
            <div className="space-y-4">
              {/* Abstinence Education & Status Card */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Negative Action / Vice Tracking (تزکیہ و ترکِ معاصی)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Tracked in the inverse: 0 incidents keeps your score at 100% and advances your clean streak. Logging slips records occurrences and triggers honestly without breaking motivation.
                </p>
              </div>

              {/* Clean Day Button */}
              <button
                type="button"
                onClick={() => onSave({
                  status: 'COMPLETED',
                  numericValue: 0,
                  notes: notes || 'Clean day - 0 incidents'
                })}
                className="w-full p-3.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600/80 text-left transition flex items-center justify-between group shadow-lg shadow-emerald-950/40"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-900/80 border border-emerald-700/80 flex items-center justify-center text-emerald-300 font-bold text-lg">
                    ✓
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-emerald-200">
                      Mark Clean Day (0 Incidents)
                    </div>
                    <div className="text-[11px] text-emerald-400/90">
                      No incidents occurred • Streak preserved
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-300 bg-emerald-900/60 px-2.5 py-1 rounded-lg border border-emerald-700">
                  100% Score
                </span>
              </button>

              {/* Log Incident / Slip Counter */}
              <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-900/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Log Incidents / Slips</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Penalizes score</span>
                </div>

                {/* Counter controls */}
                <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNegativeIncidents(v => Math.max(1, v - (habit.inputType === 'DURATION' ? 15 : 1)))}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-xl font-bold text-rose-400 font-mono min-w-[40px] text-center">
                      {negativeIncidents || 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setNegativeIncidents(v => (v || 0) + (habit.inputType === 'DURATION' ? 15 : 1))}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-slate-400 font-medium ml-1">
                      {habit.inputType === 'DURATION' ? 'minutes' : (habit.unit || 'incidents')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {habit.inputType === 'DURATION' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setNegativeIncidents(15)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-rose-300"
                        >
                          15m
                        </button>
                        <button
                          type="button"
                          onClick={() => setNegativeIncidents(30)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-rose-300"
                        >
                          30m
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setNegativeIncidents(1)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-rose-300"
                        >
                          1
                        </button>
                        <button
                          type="button"
                          onClick={() => setNegativeIncidents(2)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-rose-300"
                        >
                          2
                        </button>
                        <button
                          type="button"
                          onClick={() => setNegativeIncidents(3)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-rose-300"
                        >
                          3
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const count = Math.max(1, negativeIncidents);
                    onSave({
                      status: 'FAILED',
                      numericValue: count,
                      notes: notes || `${count} incident(s) logged`
                    });
                  }}
                  className="w-full bg-rose-700 hover:bg-rose-600 text-white font-semibold py-2 rounded-xl transition shadow-lg shadow-rose-950 flex items-center justify-center gap-2 text-xs"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Save {Math.max(1, negativeIncidents)} Incident(s) Logged</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 1. MULTI-STATE or SLOT (e.g. 4 Prayer States or Jore Slots) */}
          {(habit.inputType === 'MULTI_STATE' || habit.inputType === 'SLOT') && habit.multiStates && (
            <div className="space-y-2.5">
              <label className="text-xs font-medium text-slate-400">Select Status / Quality:</label>
              <div className="grid grid-cols-1 gap-2">
                {habit.multiStates.map(state => {
                  const isSelected = selectedState === state.code;
                  return (
                    <button
                      key={state.code}
                      onClick={() => handleSaveMultiState(state.code)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition ${
                        isSelected 
                          ? `${state.bgClass} ring-2 ring-emerald-400`
                          : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-slate-950 flex items-center justify-center font-bold text-base shadow-sm">
                          {state.symbol}
                        </span>
                        <div className="text-left">
                          <div>{state.label.split(' (')[0]}</div>
                          {state.urduLabel && (
                            <div className="text-xs opacity-75 font-normal font-arabic" dir="rtl">{state.urduLabel}</div>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-950/80 text-slate-300">
                        {Math.round(state.scoreWeight * 100)}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. QUANTITY INPUT (Pages, Counts, ML, Steps) */}
          {habit.inputType === 'QUANTITY' && (
            <div className="space-y-4">
              <div className="text-center py-4 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-4xl font-extrabold text-emerald-400 tracking-tight">
                  {numericVal}
                </span>
                <span className="text-sm font-semibold text-slate-400 ml-2 uppercase">
                  {habit.unit || 'units'}
                </span>
                {habit.targetValue && (
                  <p className="text-xs text-slate-500 mt-1">
                    Target: {habit.targetValue} {habit.unit}
                  </p>
                )}
              </div>

              {/* Increments Buttons */}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setNumericVal(v => Math.max(0, v - (habit.step || 1)))}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
                >
                  <Minus className="w-4 h-4" />
                </button>

                {/* Quick Add Presets */}
                {(habit.step && habit.step >= 100) ? (
                  <>
                    <button
                      onClick={() => setNumericVal(v => v + 100)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-emerald-400 transition"
                    >
                      +100
                    </button>
                    <button
                      onClick={() => setNumericVal(v => v + 500)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-emerald-400 transition"
                    >
                      +500
                    </button>
                    <button
                      onClick={() => setNumericVal(v => v + 1000)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-emerald-400 transition"
                    >
                      +1000
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setNumericVal(v => v + (habit.step || 1))}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-emerald-400 transition"
                    >
                      +{habit.step || 1}
                    </button>
                    <button
                      onClick={() => setNumericVal(v => v + 5)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-emerald-400 transition"
                    >
                      +5
                    </button>
                    <button
                      onClick={() => setNumericVal(v => v + 10)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-emerald-400 transition"
                    >
                      +10
                    </button>
                  </>
                )}

                <button
                  onClick={() => setNumericVal(v => v + (habit.step || 1))}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Direct numeric input */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={numericVal}
                  onChange={(e) => setNumericVal(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-center font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Custom quantity"
                />
              </div>

              <button
                onClick={handleSaveNumeric}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition shadow-lg shadow-emerald-950 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save {numericVal} {habit.unit}</span>
              </button>
            </div>
          )}

          {/* 2b. LATAIF DUAL TRACKING (Count or Time: 5000 count = 30 min) */}
          {habit.inputType === 'LATAIF' && (
            <div className="space-y-4">
              {/* Mode Toggle */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setLataifMode('COUNT')}
                  className={`flex-1 py-1.5 rounded-lg transition ${
                    lataifMode === 'COUNT'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Track by Count (تسبیح)
                </button>
                <button
                  type="button"
                  onClick={() => setLataifMode('MIN')}
                  className={`flex-1 py-1.5 rounded-lg transition ${
                    lataifMode === 'MIN'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Track by Time (وقت / منٹ)
                </button>
              </div>

              {/* Display & Equivalency */}
              <div className="text-center py-4 bg-slate-950 rounded-xl border border-slate-800">
                {lataifMode === 'COUNT' ? (
                  <>
                    <div className="text-4xl font-extrabold text-emerald-400 tracking-tight">
                      {lataifCount.toLocaleString()}
                      <span className="text-xs text-slate-400 ml-1.5 font-normal uppercase">reps</span>
                    </div>
                    <div className="text-xs text-emerald-300/90 font-medium mt-1">
                      ≈ {lataifMinutes} minutes of continuous zikr
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-4xl font-extrabold text-sky-400 tracking-tight">
                      {lataifMinutes}
                      <span className="text-xs text-slate-400 ml-1.5 font-normal uppercase">minutes</span>
                    </div>
                    <div className="text-xs text-sky-300/90 font-medium mt-1">
                      ≈ {lataifCount.toLocaleString()} count / reps
                    </div>
                  </>
                )}
              </div>

              {/* Conversion Rule Callout */}
              <div className="text-[11px] text-center text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                Rule: <span className="text-emerald-400 font-semibold">5,000 count = 30 minutes</span> (166.7 reps/min)
              </div>

              {/* Quick Presets */}
              {lataifMode === 'COUNT' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleUpdateLataifCount(Math.max(0, lataifCount - 1000))}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateLataifCount(lataifCount + 1000)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => handleUpdateLataifCount(2500)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 font-semibold text-slate-200"
                    >
                      2.5k (15m)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateLataifCount(5000)}
                      className="p-2 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold"
                    >
                      5k (30m)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateLataifCount(7500)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 font-semibold text-slate-200"
                    >
                      7.5k (45m)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateLataifCount(10000)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 font-semibold text-slate-200"
                    >
                      10k (60m)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleUpdateLataifMin(15)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 font-semibold text-slate-200"
                  >
                    15m (2.5k)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateLataifMin(30)}
                    className="p-2 rounded-lg bg-sky-950 text-sky-300 border border-sky-800 font-bold"
                  >
                    30m (5k)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateLataifMin(45)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 font-semibold text-slate-200"
                  >
                    45m (7.5k)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateLataifMin(60)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 font-semibold text-slate-200"
                  >
                    60m (10k)
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveLataif}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition shadow-lg shadow-emerald-950 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save {lataifMode === 'COUNT' ? `${lataifCount.toLocaleString()} count` : `${lataifMinutes} min`}</span>
              </button>
            </div>
          )}

          {/* 3. DURATION / TIMER INPUT (e.g. Moraqiba Minutes, Focus) */}
          {habit.inputType === 'DURATION' && (
            <div className="space-y-4">
              <div className="text-center py-5 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-4xl font-mono font-bold text-emerald-400 tracking-wider">
                  {formatTimer(timerSeconds)}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Target: {habit.targetValue} minutes ({Math.round(timerSeconds / 60)} min logged)
                </p>
              </div>

              {/* Timer Controls */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition ${
                    isTimerRunning
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isTimerRunning ? 'Pause Timer' : 'Start Timer'}</span>
                </button>

                <button
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerSeconds(0);
                  }}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Quick minute manual adjust */}
              <div className="flex items-center justify-center gap-2">
                {[5, 10, 15, 20, 30].map(mins => (
                  <button
                    key={mins}
                    onClick={() => setTimerSeconds(mins * 60)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition"
                  >
                    {mins}m
                  </button>
                ))}
              </div>

              <button
                onClick={handleSaveTimer}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition shadow-lg shadow-emerald-950 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save {Math.round(timerSeconds / 60)} Minutes</span>
              </button>
            </div>
          )}

          {/* 4. BOOLEAN (Done, Skipped, Not Done) */}
          {habit.inputType === 'BOOLEAN' && (
            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => handleSaveBoolean('COMPLETED')}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-emerald-900/40 hover:bg-emerald-900/70 border border-emerald-500/80 text-emerald-300 font-semibold transition"
              >
                <Check className="w-6 h-6 mb-1 text-emerald-400" />
                <span>Completed (✓)</span>
              </button>

              <button
                onClick={() => handleSaveBoolean('SKIPPED')}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 font-semibold transition"
              >
                <span className="text-xl mb-1 text-slate-400">⏸</span>
                <span>Skipped / Freeze</span>
              </button>

              <button
                onClick={() => handleSaveBoolean('FAILED')}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-rose-900/30 hover:bg-rose-900/60 border border-rose-500/70 text-rose-300 font-semibold transition"
              >
                <X className="w-6 h-6 mb-1 text-rose-400" />
                <span>Not Done (✗)</span>
              </button>
            </div>
          )}
        </>
      )}

          {/* Notes Input */}
          <div>
            <label className="text-xs font-medium text-slate-400">Notes & Reflections (Optional):</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Felt relaxed, prayed in 2nd row..."
              className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
