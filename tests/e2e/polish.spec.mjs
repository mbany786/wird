import { withApp, ok, summary, tab, openSettings, logCount } from './harness.mjs';

const startFresh = async (p) => { const b = p.getByRole('button', { name: 'Start fresh' }); if (await b.count()) await b.click(); };
const card = (p, t) => p.locator('[id^="habit-"]').filter({ has: p.locator(`span.font-medium:text-is("${t}")`) }).first();

await withApp('Today home: opens on Today with progress and what is left', async ({ ctx, open }) => {
  const p = await open(ctx);
  await startFresh(p);
  ok(await p.getByRole('button', { name: 'Today', exact: true }).first().getAttribute('aria-current') === 'page', 'app opens on Today');
  const count0 = await p.getByTestId('today-count').innerText();
  const m = count0.match(/0 of (\d+) done/);
  ok(!!m, `progress starts at zero (${count0})`);
  const total = Number(m[1]);
  await card(p, 'Fajr').getByRole('button', { name: /Jamat/ }).click(); await p.waitForTimeout(300);
  ok(await p.getByTestId('today-count').innerText() === `1 of ${total} done`, 'logging updates progress');
  const chips = await p.getByLabel('Still to do').getByRole('button').allInnerTexts();
  ok(!chips.includes('Fajr') && chips[0] === 'Zuhar', `what's left starts with the next item (${chips.slice(0, 3).join(', ')})`);
  await p.getByLabel('Still to do').getByRole('button', { name: 'Isha' }).click(); await p.waitForTimeout(700);
  const box = await p.locator('#habit-isha').boundingBox();
  ok(box && box.y > 0 && box.y < 874, 'tapping an item scrolls to it');
});

await withApp('Undo: every log can be undone from the message bar', async ({ ctx, open }) => {
  const p = await open(ctx);
  await startFresh(p);
  await card(p, 'Fajr').getByRole('button', { name: /Jamat/ }).click(); await p.waitForTimeout(300);
  const bar = p.getByRole('status');
  ok((await bar.innerText()).includes('Fajr: With Jamat') || (await bar.innerText()).includes('Fajr: Jamat'), `bar says what changed (${(await bar.innerText()).split('\n')[0]})`);
  await bar.getByRole('button', { name: 'Undo' }).click(); await p.waitForTimeout(400);
  ok(await logCount(p) === 0, 'undo removes a new entry');
  ok((await p.getByTestId('today-count').innerText()).startsWith('0 of'), 'progress goes back');

  // change an existing entry, then undo restores the previous state
  await card(p, 'Fajr').getByRole('button', { name: /Jamat/ }).click(); await p.waitForTimeout(6500);
  await card(p, 'Fajr').getByRole('button', { name: /Qaza/ }).click(); await p.waitForTimeout(300);
  await p.getByRole('status').getByRole('button', { name: 'Undo' }).click(); await p.waitForTimeout(400);
  ok((await card(p, 'Fajr').locator('button.ring-1').innerText()).includes('Jamat'), 'undo restores the previous choice');

  // a burst of + taps undoes back to the start of the burst
  const q = card(p, 'Recitation of Quran');
  for (let i = 0; i < 3; i++) { await q.locator('button').filter({ has: p.locator('svg.lucide-plus') }).first().click(); await p.waitForTimeout(120); }
  ok((await q.innerText()).includes('3'), 'three taps counted');
  await p.getByRole('status').getByRole('button', { name: 'Undo' }).click(); await p.waitForTimeout(400);
  ok(!(await p.evaluate(() => new Promise(r => { const q = indexedDB.open('AegisLocalHabitDB'); q.onsuccess = () => { const g = q.result.transaction('logs').objectStore('logs').getAll(); g.onsuccess = () => { r(g.result.some(l => l.habitId === 'quran_pages')); q.result.close(); }; }; }))), 'undo reverts the whole burst');
});

await withApp('Settings: one place, stacked sheets, week start', async ({ ctx, open }) => {
  const p = await open(ctx);
  await startFresh(p);
  await openSettings(p);
  const s = p.locator('[role="dialog"][aria-label="Settings"]');
  ok(await s.isVisible(), 'Settings opens from the menu');
  ok((await s.getByRole('button', { name: 'Backup & data' }).innerText()).includes('No backup yet'), 'shows backup status');
  ok((await s.getByRole('button', { name: 'Prayer times & reminders' }).innerText()).includes('Location not set'), 'shows prayer location status');
  await s.getByRole('button', { name: 'Prayer times & reminders' }).click(); await p.waitForTimeout(300);
  ok(await p.locator('[role="dialog"][aria-label="Prayer times & reminders"]').isVisible(), 'opens prayer settings on top');
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  ok(await s.isVisible() && !(await p.locator('[role="dialog"][aria-label="Prayer times & reminders"]').count()), 'Escape closes only the top sheet');
  await s.getByRole('button', { name: 'Templates' }).click(); await p.waitForTimeout(300);
  ok(await p.locator('[role="dialog"]').count() === 2, 'templates opens on top');
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  ok(await p.locator('[role="dialog"]').count() === 0, 'second Escape closes Settings');
});

await withApp('Analytics beyond one month', async ({ ctx, open }) => {
  const p = await open(ctx);
  await p.getByRole('button', { name: 'Explore with sample data' }).click(); await p.waitForTimeout(2500);
  await tab(p, 'Analytics').click(); await p.waitForTimeout(800);
  ok(await p.getByTestId('long-term').isVisible(), 'long-term section shown');
  ok(await p.getByRole('radio', { name: '3 mo' }).getAttribute('aria-checked') === 'true', 'range starts at the shortest that covers the history');
  ok((await p.getByLabel('Insights').locator('li').count()) >= 1, `plain-language insights (${(await p.getByLabel('Insights').innerText()).split('\n').filter(Boolean)[0]})`);
  const bars = p.getByRole('list', { name: 'Monthly completion' }).getByRole('listitem');
  ok(await bars.count() === 3, 'three monthly bars');
  await p.getByRole('radio', { name: '1 yr' }).click(); await p.waitForTimeout(300);
  ok(await bars.count() === 12, 'a year shows twelve months');
  const prev = await bars.nth(10).getAttribute('aria-label');
  ok(/\d+%/.test(prev), `last month has a score (${prev})`);
  const day = p.getByRole('grid', { name: 'Daily completion' }).getByRole('button', { name: /: \d+ of \d+/ }).last();
  await day.click();
  ok(/of \d+ \(\d+%\)/.test(await p.getByTestId('heat-picked').innerText()), `tapping a day explains it (${await p.getByTestId('heat-picked').innerText()})`);
  ok(await p.getByLabel('Prayer quality').locator('[role="img"]').count() === 5, 'prayer quality for all five prayers');
  ok(await p.getByRole('list', { name: 'Streaks' }).locator('li').count() >= 3, 'streaks across months listed');
});

summary();
