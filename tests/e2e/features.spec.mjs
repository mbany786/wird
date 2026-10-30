import { readFile } from 'node:fs/promises';
import * as XLSX from 'xlsx';
import { withApp, ok, summary, tab, matrixRows, openMenu } from './harness.mjs';

const studio = async (page) => { await page.getByRole('button', { name: 'Open Template Studio' }).click(); await page.waitForTimeout(300); };
const dailyCard = (page, t) => page.locator('div.rounded-xl.border').filter({ has: page.locator(`span.text-sm.font-bold:text-is("${t}")`) }).first();
const startFresh = async (page) => { const b = page.getByRole('button', { name: 'Start fresh' }); if (await b.count()) await b.click(); };

await withApp('Exports go through share/download and produce real files', async ({ ctx, open }) => {
  const page = await open(ctx);
  await startFresh(page);
  // log something so the files have content
  await tab(page, 'Daily').click(); await page.waitForTimeout(300);
  await dailyCard(page, 'Fajr').getByRole('button', { name: /Takbeer/ }).click(); await page.waitForTimeout(200);

  await openMenu(page);
  let dl = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Share as Excel' }).click();
  let file = await (await dl).path();
  const wb = XLSX.read(await readFile(file));
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  ok(rows.some(r => r.some(c => String(c).startsWith('Fajr'))), `Excel file has the habits (${wb.SheetNames.join(', ')})`);

  await openMenu(page);
  dl = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Share monthly chart (PDF)' }).click();
  const pdfDl = await dl;
  file = await pdfDl.path();
  const pdf = await readFile(file);
  ok(pdf.subarray(0, 4).toString() === '%PDF' && pdf.length > 20000, `PDF chart created (${Math.round(pdf.length / 1024)} KB, ${pdfDl.suggestedFilename()})`);
  await (await import('node:fs/promises')).copyFile(file, '/tmp/claude-0/chart.pdf');

  await page.getByLabel('Switch tracker template').selectOption('__MANAGE__');
  await page.getByRole('button', { name: 'Edit Daily Spiritual Schedule', exact: true }).click();
  dl = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Share file' }).click();
  file = await (await dl).path();
  const tpl = JSON.parse(await readFile(file, 'utf8'));
  ok(tpl.id === 'daily_spiritual_schedule' && tpl.habits.length > 30, 'template JSON exported');
});

await withApp('Edit habits: rename, cadence, lock, reorder, from Studio and Matrix', async ({ ctx, open }) => {
  const page = await open(ctx);
  await startFresh(page);
  await studio(page);
  await page.getByRole('button', { name: 'Edit Surah Yaseen' }).click(); await page.waitForTimeout(200);
  ok(await page.getByLabel('Tracked as').isEnabled(), 'type can change while the habit has no entries');
  await page.getByLabel('Name', { exact: true }).fill('Surah Ya-Sin');
  await page.getByLabel('How often').selectOption('WEEKLY_ONCE');
  await page.getByRole('button', { name: 'Save', exact: true }).click(); await page.waitForTimeout(300);
  ok(await page.locator('[role="dialog"]').getByText('Surah Ya-Sin').isVisible(), 'renamed in the Studio list');
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  ok((await matrixRows(page)).includes('Surah Ya-Sin'), 'renamed in the Matrix');
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(700);
  ok((await matrixRows(page)).includes('Surah Ya-Sin'), 'edit persists after relaunch');

  // reorder: move Zuhar above Fajr
  await studio(page);
  await page.getByRole('button', { name: 'Move Zuhar up' }).click(); await page.waitForTimeout(300);
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  const rows = await matrixRows(page);
  ok(rows.indexOf('Zuhar') < rows.indexOf('Fajr'), 'Zuhar moved above Fajr');

  // lock: log an entry for Ishraq, then the type is locked; edit from Matrix pencil
  await page.locator('td.sticky span.text-\\[15px\\]:text-is("Ishraq")').click(); await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await tab(page, 'Daily').click(); await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Mark Ishraq done' }).click(); await page.waitForTimeout(200);
  await tab(page, 'Matrix').click(); await page.waitForTimeout(300);
  await page.locator('td.sticky span.text-\\[15px\\]:text-is("Ishraq")').click(); await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Edit habit' }).click(); await page.waitForTimeout(200);
  ok(await page.getByText(/Locked because this habit already has entries/).isVisible(), 'type locked once the habit has entries');
  await page.getByLabel('Daily target').count().then(n => ok(n === 0, 'no target fields for a done/not-done habit'));
  await page.getByRole('button', { name: 'Cancel' }).click();
});

await withApp('Weekly habits are scored per week', async ({ ctx, open }) => {
  const page = await open(ctx);
  await startFresh(page);
  await studio(page);
  await page.getByRole('button', { name: 'Edit Surah Mulk' }).click();
  await page.getByLabel('How often').selectOption('WEEKLY_ONCE');
  await page.getByRole('button', { name: 'Save', exact: true }).click(); await page.waitForTimeout(200);
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  const row = page.locator('tr').filter({ has: page.locator('td.sticky span.text-\\[15px\\]:text-is("Surah Mulk")') }).first();
  const label0 = await row.locator('td.sticky').innerText();
  ok(/0\/[45] wk/.test(label0), `weekly summary starts at 0 of the month's weeks (${label0.replace(/\n/g, ' ')})`);

  // mark done today on Daily
  await tab(page, 'Daily').click(); await page.waitForTimeout(300);
  const card = dailyCard(page, 'Surah Mulk');
  ok(await card.getByText('Weekly').isVisible(), 'Daily shows a Weekly badge');
  await page.getByRole('button', { name: 'Mark Surah Mulk done' }).click(); await page.waitForTimeout(200);
  // the previous day in the same week (unless today is the first day of the week) says done this week
  const today = new Date();
  const weekStartOffset = (today.getDay() - 1 + 7) % 7;
  if (weekStartOffset > 0) {
    await page.getByRole('button', { name: 'Previous day' }).click(); await page.waitForTimeout(200);
    ok(/Done this week \(/.test(await card.innerText()), 'another day of the same week shows "Done this week"');
  } else {
    await page.getByRole('button', { name: 'Next day' }).click(); await page.waitForTimeout(200);
    ok(/Done this week \(/.test(await card.innerText()), 'another day of the same week shows "Done this week"');
  }
  await tab(page, 'Matrix').click(); await page.waitForTimeout(300);
  const label1 = await row.locator('td.sticky').innerText();
  ok(/1\/[45] wk/.test(label1), `one done day counts as one week (${label1.replace(/\n/g, ' ')})`);
  ok(await row.locator('span[title="Done this week"]').count() >= 1 || weekStartOffset === 6, 'other days of that week show a faint ✓');
});

summary();
