import { withApp, ok, summary, openMenu, logCount } from './harness.mjs';

const startFresh = async (p) => { const b = p.getByRole('button', { name: 'Start fresh' }); if (await b.count()) await b.click(); };
const R = (p) => p.locator('[role="dialog"][aria-label="Reset entries"]');
const countWhere = (p, fn) => p.evaluate((src) => new Promise(r => { const q = indexedDB.open('AegisLocalHabitDB'); q.onsuccess = () => { const g = q.result.transaction('logs').objectStore('logs').getAll(); g.onsuccess = () => { r(g.result.filter(new Function('l', 'return ' + src)).length); q.result.close(); }; }; }), fn);

await withApp('Reset: clear day, week, all — scoped to the template, undoable', async ({ ctx, open }) => {
  const p = await open(ctx);
  await p.getByRole('button', { name: 'Explore with sample data' }).click(); await p.waitForTimeout(2500);
  const total = await logCount(p);
  // an entry in another template that must survive
  await p.evaluate(() => new Promise(r => { const q = indexedDB.open('AegisLocalHabitDB'); q.onsuccess = () => { const tx = q.result.transaction('logs', 'readwrite'); tx.objectStore('logs').add({ habitId: 'zz_other_template_habit', date: '2026-10-01', status: 'COMPLETED', numericValue: 1, timestamp: 1 }); tx.oncomplete = () => { q.result.close(); r(); }; }; }));
  await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(800);

  await p.getByRole('button', { name: 'Reset', exact: true }).click(); await p.waitForTimeout(300);
  ok(await R(p).isVisible(), 'Reset opens from Today');
  const dayDetail = await R(p).getByRole('button', { name: 'Clear this day' }).innerText();
  const dayN = Number(dayDetail.match(/(\d+) entr/)?.[1] ?? 0);
  ok(dayN > 0, `day option shows its count (${dayDetail.split('\n').pop()})`);
  await R(p).getByRole('button', { name: 'Clear this day' }).click(); await p.waitForTimeout(500);
  ok(await logCount(p) === total + 1 - dayN, 'clearing the day removes only that day');
  ok((await p.getByTestId('today-count').innerText()).startsWith('0 of'), 'Today shows nothing logged');
  await p.getByRole('status').getByRole('button', { name: 'Undo' }).click(); await p.waitForTimeout(500);
  ok(await logCount(p) === total + 1, 'undo brings the day back');

  await openMenu(p);
  await p.getByRole('button', { name: 'Reset entries…' }).click(); await p.waitForTimeout(300);
  const weekN = Number((await R(p).getByRole('button', { name: 'Clear this week' }).innerText()).match(/(\d+) entr/)?.[1] ?? 0);
  ok(weekN > dayN, `week option covers more days (${weekN})`);
  await R(p).getByRole('button', { name: 'Clear this week' }).click(); await p.waitForTimeout(500);
  ok(await logCount(p) === total + 1 - weekN, 'clearing the week removes that week');

  await p.getByRole('button', { name: 'Reset', exact: true }).click(); await p.waitForTimeout(300);
  const allN = Number((await R(p).getByRole('button', { name: 'Clear all' }).first().innerText()).match(/(\d+) entr/)?.[1] ?? 0);
  const beforeAll = await logCount(p);
  await R(p).getByRole('button', { name: 'Clear all' }).first().click(); await p.waitForTimeout(200);
  ok(await R(p).getByRole('alert').isVisible(), 'clear all asks to confirm');
  ok(await logCount(p) === total + 1 - weekN, 'nothing removed before confirming');
  await R(p).getByRole('alert').getByRole('button', { name: 'Clear all' }).click(); await p.waitForTimeout(500);
  const left = await logCount(p); ok(left === beforeAll - allN && left > 0, `clear all removes exactly this template's ${allN} entries (${left} left in other templates)`);
  ok(await countWhere(p, "l.habitId === 'zz_other_template_habit'") === 1, 'other templates untouched');
  await p.getByRole('status').getByRole('button', { name: 'Undo' }).click(); await p.waitForTimeout(600);
  ok(await logCount(p) === total + 1 - weekN, 'undo restores everything cleared');
  await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(800);
  ok(await logCount(p) === total + 1 - weekN, 'restored entries persist');
});

await withApp('Reset: nothing to clear', async ({ ctx, open }) => {
  const p = await open(ctx);
  await startFresh(p);
  await p.getByRole('button', { name: 'Reset', exact: true }).click(); await p.waitForTimeout(300);
  ok(await R(p).getByRole('button', { name: 'Clear this day' }).isDisabled(), 'options disabled when empty');
  ok((await R(p).getByRole('button', { name: 'Clear all' }).innerText()).includes('nothing logged'), 'says nothing logged');
});

summary();
