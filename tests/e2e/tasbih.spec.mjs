import { withApp, ok, summary, tab, openMenu } from './harness.mjs';

const startFresh = async (p) => { const b = p.getByRole('button', { name: 'Start fresh' }); if (await b.count()) await b.click(); };
const T = (p) => p.locator('[role="dialog"][aria-label="Tasbih"]');
const tap = async (p, n) => { for (let i = 0; i < n; i++) await T(p).getByRole('button', { name: 'Count' }).click({ delay: 0 }); };
const entry = (p, habitId) => p.evaluate((id) => new Promise((resolve) => {
  const req = indexedDB.open('AegisLocalHabitDB');
  req.onsuccess = () => {
    const all = req.result.transaction('logs', 'readonly').objectStore('logs').getAll();
    all.onsuccess = () => { resolve(all.result.filter(l => l.habitId === id)); req.result.close(); };
  };
}), habitId);

await withApp('Tasbih: count, rounds, undo, save, Lataif, free count', async ({ ctx, open }) => {
  const p = await open(ctx);
  await startFresh(p);
  await tab(p, 'Daily').click(); await p.waitForTimeout(300);
  await p.getByRole('button', { name: 'Tasbih for Durood Sharif - 100' }).click(); await p.waitForTimeout(300);
  ok(await T(p).isVisible(), 'opens from the Daily card');
  ok(await T(p).getByLabel('Dhikr').inputValue() === 'durood_100', 'starts on the chosen dhikr');
  ok(await T(p).getByLabel('Round size').inputValue() === '33', 'target of 100 counts in rounds of 33');
  await tap(p, 35);
  ok(await p.getByTestId('tasbih-total').innerText() === '35', 'counts every tap');
  ok((await p.getByTestId('tasbih-session').innerText()).startsWith('Round 2 · 2/33'), 'moves into round 2 after 33');
  await T(p).getByRole('button', { name: 'Undo one' }).click();
  ok(await p.getByTestId('tasbih-total').innerText() === '34', 'undo removes one');
  await p.waitForTimeout(900);
  let e = await entry(p, 'durood_100');
  ok(e.length === 1 && e[0].numericValue === 34 && e[0].status === 'PARTIAL', 'saves to today while counting (34, partial)');
  await tap(p, 66);
  ok(await T(p).getByText('Target reached').isVisible(), 'celebrates reaching the target quietly');
  await T(p).getByRole('button', { name: 'Close tasbih' }).click(); await p.waitForTimeout(400);
  e = await entry(p, 'durood_100');
  ok(e.length === 1 && e[0].numericValue === 100 && e[0].status === 'COMPLETED', 'closing saves immediately (100, completed)');

  // reopening continues from the saved count
  await p.getByRole('button', { name: 'Tasbih for Durood Sharif - 100' }).click(); await p.waitForTimeout(300);
  ok(await p.getByTestId('tasbih-total').innerText() === '100', 'reopening continues from the day total');
  // switch to a Lataif lesson
  await T(p).getByLabel('Dhikr').selectOption('lataif_1'); await p.waitForTimeout(200);
  ok(await T(p).getByLabel('Round size').inputValue() === '100', 'large targets count in rounds of 100');
  await tap(p, 5);
  await T(p).getByRole('button', { name: 'Close tasbih' }).click(); await p.waitForTimeout(400);
  e = await entry(p, 'lataif_1');
  ok(e.length === 1 && e[0].numericValue === 5 && e[0].unitUsed === 'count', 'Lataif saved as count');

  // free count from the menu doesn't save
  await openMenu(p);
  await p.getByRole('button', { name: 'Tasbih counter' }).click(); await p.waitForTimeout(300);
  await T(p).getByLabel('Dhikr').selectOption('__free__');
  await tap(p, 7);
  ok(await p.getByTestId('tasbih-total').innerText() === '7', 'free count counts');
  const before = await p.evaluate(() => new Promise(r => { const q = indexedDB.open('AegisLocalHabitDB'); q.onsuccess = () => { const c = q.result.transaction('logs').objectStore('logs').count(); c.onsuccess = () => { r(c.result); q.result.close(); }; }; }));
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  const after = await p.evaluate(() => new Promise(r => { const q = indexedDB.open('AegisLocalHabitDB'); q.onsuccess = () => { const c = q.result.transaction('logs').objectStore('logs').count(); c.onsuccess = () => { r(c.result); q.result.close(); }; }; }));
  ok(before === after && !(await T(p).count()), 'free count is not saved; Esc closes');

  // matrix dock entry
  await tab(p, 'Matrix').click(); await p.waitForTimeout(300);
  const row = p.locator('tr', { hasText: 'Astaghfar - 100' }).first();
  await row.locator('td').nth(1).click(); await p.waitForTimeout(300);
  const dockBtn = p.getByRole('button', { name: 'Open tasbih counter' });
  ok(await dockBtn.isVisible(), 'matrix dock offers Tasbih for counted dhikr');
  await dockBtn.click(); await p.waitForTimeout(300);
  ok(await T(p).getByLabel('Dhikr').inputValue() === 'astaghfar_100', 'opens on the selected habit');
});

summary();
