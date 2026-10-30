import * as XLSX from 'xlsx';
import { Habit, HabitSection, HabitLog, TrackerTemplate } from '../types';
import { calculateMonthSummary } from './analytics';
import { getHijriDate } from './hijri';
import { allowsCustomAmount } from './amount';
import { shareFile } from './share';

export async function downloadExcel(
  template: TrackerTemplate,
  habits: Habit[],
  sections: HabitSection[],
  logs: HabitLog[],
  currentMonth: string,
  monthlyRemarks: string,
  showHijri: boolean = false,
  hijriOffset: number = 0
) {
  const [year, month] = currentMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  // Header row
  const header = ['Section', 'Task', 'Input Type', 'Target'];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentMonth}-${String(d).padStart(2, '0')}`;
    let label = `Day ${d}`;
    if (showHijri && template.id === 'daily_spiritual_schedule') {
      const hInfo = getHijriDate(dateStr, hijriOffset);
      label = `Day ${d} (${hInfo.day}h)`;
    }
    header.push(label);
  }
  header.push('Summary');

  // Build matrix rows
  const rows: any[][] = [header];

  // Map logs
  const logMap = new Map<string, HabitLog>();
  logs.forEach(l => logMap.set(`${l.habitId}:${l.date}`, l));

  for (const s of sections) {
    const secHabits = habits.filter(h => h.sectionId === s.id);
    for (const h of secHabits) {
      const habitLogs = logs.filter(l => l.habitId === h.id);
      const summary = calculateMonthSummary(h, habitLogs, daysInMonth, currentMonth);

      const row: any[] = [
        s.title,
        h.urduTitle ? `${h.title} (${h.urduTitle})` : h.title,
        h.inputType,
        h.targetValue ? `${h.targetValue} ${h.unit || ''}` : '-'
      ];

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${currentMonth}-${String(d).padStart(2, '0')}`;
        const log = logMap.get(`${h.id}:${dateStr}`);

        if (!log) {
          row.push('');
        } else if (log.status === 'SKIPPED') {
          row.push('SKIPPED');
        } else if (h.inputType === 'MULTI_STATE' || h.inputType === 'SLOT') {
          row.push(log.stateCode || (log.status === 'COMPLETED' ? '✓' : '✗'));
        } else if (h.inputType === 'QUANTITY') {
          row.push(log.numericValue ?? 0);
        } else if (h.inputType === 'DURATION') {
          row.push(`${log.numericValue ?? 0}m`);
        } else if (h.inputType === 'LATAIF') {
          row.push(log.unitUsed === 'min' ? `${log.numericValue}m` : `${log.numericValue} reps`);
        } else {
          row.push(log.status === 'COMPLETED' ? '✓' : '✗');
        }

        // Append any custom count / minutes entered for status habits, e.g. "✓ 25m"
        if (log?.amount && allowsCustomAmount(h, sections)) {
          const extra = `${log.amount}${log.amountUnit === 'min' ? 'm' : ''}`;
          const last = row.length - 1;
          row[last] = row[last] === '' || row[last] === 'SKIPPED' ? extra : `${row[last]} ${extra}`;
        }
      }

      // Summary column text
      let summaryText = '';
      if (h.inputType === 'MULTI_STATE' && summary.multiStateCounts) {
        summaryText = Object.entries(summary.multiStateCounts).map(([k, v]) => `${k}:${v}`).join(', ');
      } else if (h.inputType === 'QUANTITY') {
        summaryText = `${summary.totalVolume} ${h.unit || ''} (avg: ${summary.dailyAverage}/d)`;
      } else if (h.inputType === 'DURATION') {
        summaryText = `${summary.totalVolume} mins (${(summary.totalVolume / 60).toFixed(1)} hrs)`;
      } else if (h.inputType === 'LATAIF') {
        summaryText = `${summary.totalVolume.toLocaleString()} reps (≈ ${((summary.totalVolume * 30) / 5000 / 60).toFixed(1)} hrs)`;
      } else {
        summaryText = `${summary.totalLoggedDays}/${daysInMonth} (${summary.completionRate}%)`;
      }
      row.push(summaryText);

      rows.push(row);
    }
  }

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  ws['!cols'] = [
    { wch: 22 }, // Section
    { wch: 32 }, // Task
    { wch: 14 }, // Input Type
    { wch: 14 }, // Target
    ...Array(daysInMonth).fill({ wch: 8 }), // Days
    { wch: 30 }  // Summary
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Daily Schedule Matrix');

  // Remarks Sheet
  if (monthlyRemarks.trim()) {
    const remarksSheet = XLSX.utils.aoa_to_sheet([
      ['Month', currentMonth],
      ['Template', template.title],
      [''],
      ['Monthly Remarks & Notes'],
      [monthlyRemarks]
    ]);
    remarksSheet['!cols'] = [{ wch: 25 }, { wch: 70 }];
    XLSX.utils.book_append_sheet(wb, remarksSheet, 'Monthly Notes');
  }

  // Hand the file to the share sheet (downloads don't work inside the iOS app)
  const bytes = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  return shareFile({
    filename: `${template.title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')}-${currentMonth}.xlsx`,
    data: bytes,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    title: `${template.title} — ${currentMonth}`
  });
}

export function getEmailReportUri(
  template: TrackerTemplate,
  currentMonth: string,
  habits: Habit[],
  logs: HabitLog[],
  monthlyRemarks: string
): string {
  const [year, month] = currentMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  const totalLogs = logs.length;
  let summaryLines: string[] = [];

  for (const h of habits.slice(0, 10)) {
    const hLogs = logs.filter(l => l.habitId === h.id);
    const sum = calculateMonthSummary(h, hLogs, daysInMonth, currentMonth);
    let stat = `${sum.totalLoggedDays}/${daysInMonth} days (${sum.completionRate}%)`;
    if (h.inputType === 'QUANTITY') stat = `${sum.totalVolume} ${h.unit || ''} (avg: ${sum.dailyAverage}/d)`;
    if (h.inputType === 'DURATION') stat = `${sum.totalVolume} min (${(sum.totalVolume / 60).toFixed(1)} hrs)`;
    if (h.inputType === 'LATAIF') stat = `${sum.totalVolume.toLocaleString()} reps (≈ ${((sum.totalVolume * 30) / 5000 / 60).toFixed(1)} hrs)`;
    summaryLines.push(`• ${h.title}: ${stat}`);
  }

  const subject = `[Tracker Report] ${template.title} - ${currentMonth}`;
  const body = `Habit Tracking Report
Template: ${template.title}
Period: ${currentMonth} (${daysInMonth} days)
Total Recorded Activity Logs: ${totalLogs}

Key Highlights:
${summaryLines.join('\n')}

Monthly Reflections & Notes:
${monthlyRemarks || 'None recorded.'}

Generated securely on-device with zero-knowledge encryption.`;

  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
