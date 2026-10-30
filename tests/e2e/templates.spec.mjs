import { readFile } from 'node:fs/promises';
import { withApp, ok, summary, tab, matrixRows, logCount } from './harness.mjs';

const startFresh = async (p) => { const b = p.getByRole('button', { name: 'Start fresh' }); if (await b.count()) await b.click(); };
const openTemplates = async (p) => { await p.getByLabel('Switch tracker template').selectOption('__MANAGE__'); await p.waitForTimeout(300); };
const openStudio = async (p) => { await p.getByRole('button', { name: 'Open Template Studio' }).click(); await p.waitForTimeout(300); };
const sheet = (p) => p.locator('[role="dialog"]').last();
const title = (p) => p.locator('header h1').innerText();

await withApp('Create, build and edit a template', async ({ ctx, open }) => {
  const p = await open(ctx);
  await startFresh(p);
  await openTemplates(p);
  ok(await sheet(p).getByText('Daily Spiritual Schedule').isVisible(), 'Templates sheet lists templates');
  await sheet(p).getByRole('button', { name: 'Blank', exact: true }).click(); await p.waitForTimeout(400);
  ok(await title(p) === 'My Tracker', 'blank template created and selected');

  await openStudio(p);
  await sheet(p).getByLabel('New section name').fill('Morning');
  await sheet(p).getByRole('button', { name: 'Add section' }).click(); await p.waitForTimeout(200);
  await sheet(p).getByRole('button', { name: 'Add habit to Morning' }).click(); await p.waitForTimeout(200);
  await sheet(p).getByLabel('Name', { exact: true }).fill('Ishraq prayer');
  await sheet(p).getByLabel('Tracked as').selectOption('MULTI_STATE');
  await sheet(p).getByRole('button', { name: 'Save', exact: true }).click(); await p.waitForTimeout(300);
  await sheet(p).getByRole('button', { name: 'Add habit to Morning' }).click(); await p.waitForTimeout(200);
  await sheet(p).getByLabel('Name', { exact: true }).fill('Quran pages');
  await sheet(p).getByLabel('Tracked as').selectOption('QUANTITY');
  await sheet(p).getByLabel('Unit').fill('pages');
  await sheet(p).getByLabel('Daily target').fill('10');
  await sheet(p).getByRole('button', { name: 'Save', exact: true }).click(); await p.waitForTimeout(300);
  ok(await sheet(p).getByText('Prayer quality', { exact: true }).isVisible(), 'prayer-quality habit created with prayer states');
  ok(await sheet(p).getByText('pages · goal 10').isVisible(), 'number habit created with unit and goal');

  await sheet(p).getByRole('button', { name: 'Rename section Morning' }).click();
  await sheet(p).getByLabel('Section name', { exact: true }).fill('Fajr to Ishraq');
  await sheet(p).getByRole('button', { name: 'Save', exact: true }).click(); await p.waitForTimeout(200);
  await sheet(p).getByRole('button', { name: 'Move section Fajr to Ishraq up' }).click(); await p.waitForTimeout(200);
  await sheet(p).getByRole('button', { name: 'Move Quran pages up' }).click(); await p.waitForTimeout(200);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  const rows = await matrixRows(p);
  ok(JSON.stringify(rows) === JSON.stringify(['Quran pages', 'Ishraq prayer']), `habits in new order (${rows})`);
  ok(await p.locator('tbody span.font-semibold').first().innerText() === 'Fajr to Ishraq', 'renamed section moved to the top');

  // template colour/icon
  await openTemplates(p);
  await sheet(p).getByRole('button', { name: 'Edit My Tracker' }).click();
  await sheet(p).getByLabel('Name', { exact: true }).fill('Morning Wird');
  await sheet(p).getByRole('radio', { name: 'violet' }).click();
  await sheet(p).getByRole('radio', { name: 'Sun' }).click();
  await sheet(p).getByRole('button', { name: 'Save', exact: true }).click(); await p.waitForTimeout(300);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(700);
  ok(await title(p) === 'Morning Wird', 'renamed template persists and stays selected');
  await openTemplates(p);
  ok(await sheet(p).locator('button[aria-label="Use Morning Wird"] svg.lucide-sun').count() === 1, 'icon saved');
  ok(await sheet(p).locator('button[aria-label="Use Morning Wird"] .bg-violet-950\\/70').count() === 1, 'colour saved');
});

await withApp('Starter, duplicate (separate history), export/import, delete, restore', async ({ ctx, open }) => {
  const p = await open(ctx);
  await startFresh(p);
  // log Fajr on the original
  await tab(p, 'Daily').click(); await p.waitForTimeout(300);
  await p.locator('div.rounded-xl.border').filter({ has: p.locator('span.text-sm.font-bold:text-is("Fajr")') }).first().getByRole('button', { name: /Jamat/ }).click();
  await p.waitForTimeout(200);

  await openTemplates(p);
  await sheet(p).getByRole('button', { name: 'Starter…' }).click();
  await sheet(p).getByRole('button', { name: /Student & Academic Excellence/ }).click(); await p.waitForTimeout(400);
  ok(await title(p) === 'Student & Academic Excellence', 'starter routine created as a new template');
  await openTemplates(p);
  ok(await sheet(p).getByText('Daily Spiritual Schedule').isVisible(), 'original templates untouched by the starter');
  await sheet(p).getByRole('button', { name: 'Use Daily Spiritual Schedule' }).click(); await p.waitForTimeout(300);

  await openTemplates(p);
  await sheet(p).getByRole('button', { name: 'Copy current' }).click(); await p.waitForTimeout(400);
  ok(await title(p) === 'Daily Spiritual Schedule (copy)', 'duplicate created');
  await tab(p, 'Daily').click(); await p.waitForTimeout(300);
  const fajrCopy = p.locator('div.rounded-xl.border').filter({ has: p.locator('span.text-sm.font-bold:text-is("Fajr")') }).first();
  ok(await fajrCopy.locator('button.ring-1').count() === 0, 'duplicate starts with no history');
  await fajrCopy.getByRole('button', { name: /Qaza/ }).click(); await p.waitForTimeout(200);
  await openTemplates(p);
  await sheet(p).getByRole('button', { name: 'Use Daily Spiritual Schedule', exact: true }).click(); await p.waitForTimeout(300);
  const fajrOrig = p.locator('div.rounded-xl.border').filter({ has: p.locator('span.text-sm.font-bold:text-is("Fajr")') }).first();
  ok((await fajrOrig.locator('button.ring-1').innerText()).includes('Jamat'), "original's Fajr unaffected by the copy's entry");

  // export + import
  await openTemplates(p);
  await sheet(p).getByRole('button', { name: 'Edit Student & Academic Excellence' }).click();
  const dl = p.waitForEvent('download');
  await sheet(p).getByRole('button', { name: 'Share file' }).click();
  const file = await (await dl).path();
  const json = JSON.parse(await readFile(file, 'utf8'));
  ok(json.title === 'Student & Academic Excellence' && json.habits.length === 7, 'template exported to a file');
  await sheet(p).getByRole('button', { name: '‹ All templates' }).click();
  await sheet(p).getByLabel('Choose template file').setInputFiles(file); await p.waitForTimeout(400);
  await openTemplates(p);
  ok(await sheet(p).getByRole('button', { name: 'Use Student & Academic Excellence' }).count() === 2, 'imported as a separate template (fresh ids)');

  // delete with entries, then restore built-in
  const before = await logCount(p);
  await sheet(p).getByRole('button', { name: 'Edit Daily Spiritual Schedule', exact: true }).click();
  await sheet(p).getByRole('button', { name: 'Delete template…' }).click();
  ok(await sheet(p).getByText(/and 1 logged entries/).isVisible(), 'delete warns about its entries');
  await sheet(p).getByRole('button', { name: 'Delete permanently' }).click(); await p.waitForTimeout(400);
  ok(await logCount(p) === before - 1, "deleting a template deletes only its own entries");
  await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(700);
  await openTemplates(p);
  ok(await sheet(p).getByRole('button', { name: 'Use Daily Spiritual Schedule', exact: true }).count() === 0, 'deleted built-in stays deleted after relaunch');
  await sheet(p).getByRole('button', { name: 'Restore Daily Spiritual Schedule' }).click(); await p.waitForTimeout(400);
  ok(await title(p) === 'Daily Spiritual Schedule', 'built-in template restored');
});

summary();
