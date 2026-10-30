import { Habit, HabitLog, HabitSection, TrackerTemplate } from '../types';
import { calculateMonthSummary } from './analytics';
import { completedWeekKeys, daysInMonthOf, fridaysInMonth, weekKeyOf } from './cadence';
import { getHijriDate } from './hijri';

/**
 * Draws the month as a classic mamulat chart (light, print-friendly) on a canvas.
 * Used for "Share monthly chart (PDF)" — drawn by hand so Urdu text and prayer symbols render
 * exactly as in the app, which PDF text fonts can't do.
 */

export interface MonthChartInput {
  template: TrackerTemplate;
  sections: HabitSection[];
  habits: Habit[];
  logs: HabitLog[]; // logs of this month
  monthKey: string;
  remarks?: string;
  showHijri?: boolean;
  hijriOffset?: number;
}

const C = {
  bg: '#ffffff',
  ink: '#0f172a',
  muted: '#64748b',
  line: '#e2e8f0',
  section: '#ecfdf5',
  sectionInk: '#047857',
  friday: '#f0fdf4',
  done: '#16a34a',
  fail: '#dc2626',
  qty: '#0f766e',
  min: '#0369a1'
};

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Geeza Pro", "Noto Naskh Arabic", sans-serif';
const pad = (n: number) => String(n).padStart(2, '0');

function cellText(habit: Habit, log: HabitLog | undefined, weekCovered: boolean): { text: string; color: string } {
  if (!log || log.status === 'SKIPPED') return weekCovered ? { text: '✓', color: '#86efac' } : { text: '', color: C.ink };
  if (habit.category === 'NEGATIVE_ABSTINENCE') {
    const n = log.numericValue ?? (log.status === 'FAILED' ? 1 : 0);
    return n > 0 || log.status === 'FAILED' ? { text: `!${n}`, color: C.fail } : { text: '✓', color: C.done };
  }
  if ((habit.inputType === 'MULTI_STATE' || habit.inputType === 'SLOT') && habit.multiStates) {
    const st = habit.multiStates.find(s => s.code === log.stateCode);
    return st ? { text: st.symbol, color: st.color } : { text: '', color: C.ink };
  }
  if (habit.inputType === 'QUANTITY' || habit.inputType === 'LATAIF' || habit.inputType === 'DURATION') {
    const v = log.numericValue ?? 0;
    if (!v) return { text: '', color: C.ink };
    const short = v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : String(v);
    const isMin = habit.inputType === 'DURATION' || log.unitUsed === 'min';
    return { text: isMin ? `${short}m` : short, color: isMin ? C.min : C.qty };
  }
  return log.status === 'COMPLETED' ? { text: '✓', color: C.done } : { text: '✗', color: C.fail };
}

/** Truncates text with an ellipsis so it fits `maxW` in the current font. */
function fit(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (maxW <= 0) return '';
  if (ctx.measureText(text).width <= maxW) return text;
  let lo = 0, hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (ctx.measureText(`${text.slice(0, mid)}…`).width <= maxW) lo = mid; else hi = mid - 1;
  }
  return lo > 0 ? `${text.slice(0, lo)}…` : '';
}

/** Draws an English label on the left and an optional Urdu label on the right of a cell, never overlapping. */
function labelPair(
  ctx: CanvasRenderingContext2D, x: number, w: number, y: number,
  english: string, englishFont: string, urdu: string | undefined, urduFont: string, englishColor: string, urduColor: string
) {
  let urduW = 0;
  let urduText = '';
  if (urdu) {
    ctx.font = urduFont;
    urduText = fit(ctx, urdu, w * 0.45);
    urduW = ctx.measureText(urduText).width;
  }
  ctx.font = englishFont;
  ctx.fillStyle = englishColor;
  ctx.textAlign = 'left';
  ctx.fillText(fit(ctx, english, w - urduW - (urduW ? 10 : 0)), x, y);
  if (urduText) {
    ctx.font = urduFont;
    ctx.fillStyle = urduColor;
    ctx.textAlign = 'right';
    ctx.fillText(urduText, x + w, y);
    ctx.textAlign = 'left';
  }
}

export function drawMonthChart(input: MonthChartInput, scale = 2): HTMLCanvasElement {
  const { template, sections, habits, logs, monthKey, remarks, showHijri, hijriOffset = 0 } = input;
  const days = daysInMonthOf(monthKey);
  const fridays = new Set(fridaysInMonth(monthKey));
  const isSpiritual = template.id === 'daily_spiritual_schedule';

  const nameW = 250, dayW = 30, sumW = 86, rowH = 28, secH = 26, headH = 92, dayHeadH = showHijri ? 40 : 30;
  const width = nameW + days * dayW + sumW + 32;
  const rowsH = sections.reduce((h, s) => {
    const n = habits.filter(x => x.sectionId === s.id).length;
    return n ? h + secH + n * rowH : h;
  }, 0);
  const remarksLines = remarks?.trim() ? Math.min(8, Math.ceil(remarks.trim().length / 160) + 1) : 0;
  const height = headH + dayHeadH + rowsH + (remarksLines ? 30 + remarksLines * 18 : 0) + 40;

  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(width * scale);
  canvas.height = Math.ceil(height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, width, height);
  ctx.textBaseline = 'middle';

  const x0 = 16;
  // Title
  const [y, m] = monthKey.split('-').map(Number);
  const monthName = new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  ctx.fillStyle = C.ink;
  ctx.font = `700 22px ${FONT}`;
  ctx.fillText(template.title, x0, 30);
  ctx.font = `500 15px ${FONT}`;
  ctx.fillStyle = C.muted;
  let sub = monthName;
  if (showHijri && isSpiritual) {
    const a = getHijriDate(`${monthKey}-01`, hijriOffset);
    const b = getHijriDate(`${monthKey}-${pad(days)}`, hijriOffset);
    sub += a.monthName === b.monthName ? ` · ${a.monthName} ${a.year} AH` : ` · ${a.monthName} – ${b.monthName} ${b.year} AH`;
  }
  ctx.fillText(sub, x0, 56);
  if (isSpiritual && template.urduTitle) {
    ctx.font = `600 18px ${FONT}`;
    ctx.fillStyle = C.sectionInk;
    ctx.textAlign = 'right';
    ctx.fillText(template.urduTitle, width - x0, 30);
    ctx.textAlign = 'left';
  }

  // Day header
  let yy = headH - 16;
  const gridX = x0 + nameW;
  ctx.font = `600 12px ${FONT}`;
  for (let d = 1; d <= days; d++) {
    const cx = gridX + (d - 1) * dayW;
    if (fridays.has(d)) { ctx.fillStyle = C.friday; ctx.fillRect(cx, yy, dayW, dayHeadH + rowsH); }
    ctx.fillStyle = C.ink;
    ctx.textAlign = 'center';
    ctx.fillText(String(d), cx + dayW / 2, yy + 12);
    if (showHijri && isSpiritual) {
      ctx.fillStyle = C.sectionInk;
      ctx.font = `500 10px ${FONT}`;
      ctx.fillText(String(getHijriDate(`${monthKey}-${pad(d)}`, hijriOffset).day), cx + dayW / 2, yy + 28);
      ctx.font = `600 12px ${FONT}`;
    }
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = C.muted;
  ctx.fillText('Task', x0 + 6, yy + 12);
  ctx.textAlign = 'center';
  ctx.fillText('Month', gridX + days * dayW + sumW / 2, yy + 12);
  ctx.textAlign = 'left';
  yy += dayHeadH;

  const logMap = new Map(logs.map(l => [`${l.habitId}:${l.date}`, l]));

  for (const section of sections) {
    const list = habits.filter(h => h.sectionId === section.id);
    if (!list.length) continue;
    ctx.fillStyle = C.section;
    ctx.fillRect(x0, yy, width - 2 * x0, secH);
    labelPair(ctx, x0 + 6, nameW - 12, yy + secH / 2, section.title, `700 13px ${FONT}`,
      isSpiritual ? section.urduTitle : undefined, `600 13px ${FONT}`, C.sectionInk, C.sectionInk);
    yy += secH;

    for (const habit of list) {
      const hLogs = logs.filter(l => l.habitId === habit.id);
      const sum = calculateMonthSummary(habit, hLogs, days, monthKey);
      const weeks = habit.cadence === 'WEEKLY_ONCE' ? completedWeekKeys(habit, hLogs) : null;

      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x0, yy + rowH); ctx.lineTo(width - x0, yy + rowH); ctx.stroke();

      labelPair(ctx, x0 + 6, nameW - 12, yy + rowH / 2, habit.title, `600 13px ${FONT}`,
        isSpiritual ? habit.urduTitle : undefined, `500 12px ${FONT}`, C.ink, C.sectionInk);

      for (let d = 1; d <= days; d++) {
        const cx = gridX + (d - 1) * dayW;
        const dateStr = `${monthKey}-${pad(d)}`;
        if (habit.cadence === 'FRIDAY_ONLY' && !fridays.has(d)) {
          ctx.fillStyle = '#f8fafc'; ctx.fillRect(cx, yy, dayW, rowH);
          continue;
        }
        const covered = !!weeks?.has(weekKeyOf(dateStr));
        const { text, color } = cellText(habit, logMap.get(`${habit.id}:${dateStr}`), covered);
        if (!text) continue;
        ctx.fillStyle = color;
        ctx.font = `${text.length > 3 ? 600 : 700} ${text.length > 3 ? 10 : 13}px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText(text, cx + dayW / 2, yy + rowH / 2);
        ctx.textAlign = 'left';
      }

      // Month summary
      ctx.textAlign = 'center';
      ctx.fillStyle = C.ink;
      ctx.font = `600 12px ${FONT}`;
      const measured = habit.inputType === 'QUANTITY' || habit.inputType === 'DURATION' || habit.inputType === 'LATAIF';
      const label = habit.category === 'NEGATIVE_ABSTINENCE'
        ? `${sum.periodsDone}/${days} clean`
        : measured
          ? `${sum.totalVolume.toLocaleString()}${habit.inputType === 'DURATION' ? 'm' : ''}`
          : `${sum.periodsDone}/${sum.possible}${habit.cadence === 'WEEKLY_ONCE' ? ' wk' : ''}`;
      ctx.fillText(label, gridX + days * dayW + sumW / 2, yy + rowH / 2);
      ctx.textAlign = 'left';
      yy += rowH;
    }
  }

  // Vertical day lines
  ctx.strokeStyle = C.line;
  for (let d = 0; d <= days; d++) {
    const cx = gridX + d * dayW;
    ctx.beginPath(); ctx.moveTo(cx, headH - 16); ctx.lineTo(cx, yy); ctx.stroke();
  }

  // Reflections
  if (remarksLines) {
    yy += 26;
    ctx.fillStyle = C.ink;
    ctx.font = `700 13px ${FONT}`;
    ctx.fillText('Reflections', x0, yy);
    ctx.font = `400 13px ${FONT}`;
    ctx.fillStyle = C.muted;
    const words = remarks!.trim().split(/\s+/);
    let line = '';
    const maxW = width - 2 * x0;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxW) {
        yy += 18; ctx.fillText(line, x0, yy); line = w;
      } else line = test;
    }
    if (line) { yy += 18; ctx.fillText(line, x0, yy); }
  }

  // Footer
  ctx.fillStyle = '#94a3b8';
  ctx.font = `400 11px ${FONT}`;
  ctx.fillText(`Made with Wird · ${new Date().toLocaleDateString()}`, x0, height - 14);
  return canvas;
}

/** Renders the chart into a single-page PDF sized to the chart (prints well on A4/Letter). */
export async function monthChartPdf(input: MonthChartInput): Promise<Uint8Array> {
  const canvas = drawMonthChart(input, 2);
  const { jsPDF } = await import('jspdf');
  const w = 842; // A4 landscape width in points
  const h = Math.round((canvas.height / canvas.width) * w);
  const pdf = new jsPDF({ orientation: w > h ? 'landscape' : 'portrait', unit: 'pt', format: [w, h], compress: true });
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, h, undefined, 'FAST');
  return new Uint8Array(pdf.output('arraybuffer'));
}
