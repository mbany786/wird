import { readFile } from 'node:fs/promises';
import { withApp, ok, summary, tab, matrixRows, openMenu, openData, closeSheet, logCount } from './harness.mjs';

await withApp('Fresh install: no demo data, first-run choice', async ({ ctx, open }) => {
  const page = await open(ctx);
  ok(await logCount(page) === 0, 'no entries are created on first launch');
  ok(await page.getByText('Welcome to Wird').isVisible(), 'first-run prompt offers sample data');
  await page.getByRole('button', { name: 'Start fresh' }).click();
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(500);
  ok(!(await page.getByText('Welcome to Wird').isVisible()), '"Start fresh" is remembered after relaunch');
});

await withApp('Built-in template edits survive relaunch', async ({ ctx, open }) => {
  const page = await open(ctx);
  await page.getByRole('button', { name: 'Open Template Studio' }).click();
  await page.waitForTimeout(300);
  const row = page.locator('div.rounded-xl').filter({ has: page.locator('span.font-semibold:text-is("Tahajjud")') }).first();
  await row.getByTitle('Delete task').click();
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  ok(!(await matrixRows(page)).includes('Tahajjud'), 'Tahajjud deleted');
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(700);
  ok(!(await matrixRows(page)).includes('Tahajjud'), 'Tahajjud stays deleted after relaunch (no overwrite)');
  ok((await matrixRows(page)).includes('Ishraq'), 'other built-in habits still present');
});

await withApp('Settings remembered between launches', async ({ ctx, open }) => {
  const page = await open(ctx);
  const sel = page.getByLabel('Switch tracker template');
  const vals = await sel.locator('option').evaluateAll(os => os.map(o => [o.value, o.textContent]));
  const reading = vals.find(([, t]) => /Reading/.test(t));
  await sel.selectOption(reading[0]);
  await page.waitForTimeout(300);
  await sel.selectOption(vals[0][0]); // back to spiritual so Hijri controls show
  await page.waitForTimeout(300);
  await openMenu(page);
  await page.getByRole('button', { name: 'Hijri adjustment +1 day' }).click();
  await page.getByRole('button', { name: /Hijri dates/ }).click(); // turn off
  await page.keyboard.press('Escape');
  await sel.selectOption(reading[0]);
  await page.waitForTimeout(300);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(700);
  ok(await sel.inputValue() === reading[0], 'selected template restored after relaunch');
  await sel.selectOption(vals[0][0]); await page.waitForTimeout(300);
  await openMenu(page);
  ok(await page.getByRole('button', { name: 'Hijri adjustment +1 day' }).count() === 0, 'Hijri off restored (adjustment hidden)');
  await page.getByRole('button', { name: /Hijri dates/ }).click(); // on again
  await page.waitForTimeout(150);
  ok(await page.getByRole('button', { name: 'Hijri adjustment +1 day' }).getAttribute('class').then(c => c.includes('bg-emerald-600')), 'Hijri +1 adjustment restored');
});

await withApp('Sample data: opt-in, never overwrites, removable', async ({ ctx, open }) => {
  const page = await open(ctx);
  // a real entry first: mark Fajr today as Jamat on Daily
  await tab(page, 'Daily').click(); await page.waitForTimeout(300);
  const fajr = page.locator('div.rounded-xl.border').filter({ has: page.locator('span.text-sm.font-bold:text-is("Fajr")') }).first();
  await fajr.getByRole('button', { name: /Jamat/ }).click(); await page.waitForTimeout(300);
  ok(await logCount(page) === 1, 'one real entry logged');
  await openData(page);
  await page.getByRole('button', { name: 'Load sample data' }).click(); await page.waitForTimeout(800);
  const withSample = await logCount(page);
  ok(withSample > 500, `sample data loaded (${withSample} entries)`);
  await closeSheet(page);
  await tab(page, 'Daily').click(); await page.waitForTimeout(300);
  ok((await fajr.locator('button.ring-1').innerText()).includes('Jamat'), 'real Fajr entry kept (sample skipped that day)');
  await openData(page);
  await page.getByRole('button', { name: 'Remove sample data' }).click(); await page.waitForTimeout(800);
  ok(await logCount(page) === 1, 'removing samples leaves exactly the real entry');
});

await withApp('Backup, delete, restore (merge and replace)', async ({ ctx, open }) => {
  const page = await open(ctx);
  await openData(page);
  await page.getByRole('button', { name: 'Load sample data' }).click(); await page.waitForTimeout(800);
  const before = await logCount(page);
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Back up now' }).click();
  const download = await dl;
  const path = await download.path();
  const json = JSON.parse(await readFile(path, 'utf8'));
  ok(json.format === 'wird-backup' && json.version === 1, 'backup file has format + version');
  ok(json.data.logs.length === before, `backup contains every entry (${json.data.logs.length})`);
  ok(json.data.templates.length >= 7 && json.data.templates[0].habits.length > 0, 'backup contains templates with habits');
  ok(await page.getByText(/Last backup/).isVisible(), 'last backup date shown');

  await page.getByRole('button', { name: 'Delete all entries…' }).click();
  await page.getByRole('button', { name: 'Delete everything permanently' }).click(); await page.waitForTimeout(500);
  ok(await logCount(page) === 0, 'all entries deleted');

  await page.getByLabel('Choose backup file').setInputFiles(path); await page.waitForTimeout(400);
  ok(await page.getByText(/entries from/i).isVisible(), 'restore preview shows what is in the file');
  await page.getByRole('button', { name: 'Merge with this device' }).click(); await page.waitForTimeout(1200);
  ok(await logCount(page) === before, `merge restored all entries (${await logCount(page)})`);

  await page.getByLabel('Choose backup file').setInputFiles(path); await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Merge with this device' }).click(); await page.waitForTimeout(1200);
  ok(await logCount(page) === before, 'merging the same backup twice creates no duplicates');

  await page.getByLabel('Choose backup file').setInputFiles(path); await page.waitForTimeout(400);
  await page.getByRole('button', { name: /Replace everything/ }).click();
  await page.getByRole('button', { name: /Tap again to erase/ }).click(); await page.waitForTimeout(1500);
  ok(await logCount(page) === before, 'replace restores exactly the backup');

  // invalid file
  const bad = '/tmp/claude-0/not-a-backup.json';
  await (await import('node:fs/promises')).writeFile(bad, '{"hello":1}');
  await page.getByLabel('Choose backup file').setInputFiles(bad); await page.waitForTimeout(300);
  ok(await page.getByText("This file isn't a Wird backup").isVisible(), 'non-backup file rejected with a clear message');
});

summary();
