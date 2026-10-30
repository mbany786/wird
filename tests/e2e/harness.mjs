/**
 * Tiny headless test harness: serves ./dist with Vite preview and drives Chromium at iPhone size.
 * Each test gets a fresh browser context (fresh IndexedDB) unless it reuses one on purpose.
 */
import { preview } from 'vite';
import { chromium } from 'playwright';

export const IPHONE = { viewport: { width: 402, height: 874 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

let failures = 0;
let passes = 0;
export function ok(cond, msg) {
  if (cond) { passes++; console.log(`  PASS ${msg}`); }
  else { failures++; console.log(`  FAIL ${msg}`); }
}

export async function withApp(name, fn) {
  console.log(`\n${name}`);
  const server = await preview({ preview: { port: 0 }, logLevel: 'error' });
  const browser = await chromium.launch();
  const url = server.resolvedUrls.local[0];
  const errors = [];
  const open = async (ctx) => {
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', d => d.accept());
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);
    return page;
  };
  try {
    const ctx = await browser.newContext({ ...IPHONE, acceptDownloads: true });
    await fn({ ctx, open, url, browser });
    ok(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
  } finally {
    await browser.close();
    await new Promise(r => server.httpServer.close(r));
  }
}

export function summary() {
  console.log(`\n${passes} passed, ${failures} failed`);
  if (failures) process.exit(1);
}

// ---- helpers shared by specs ----
export const tab = (page, name) => page.getByRole('button', { name, exact: true }).first();
export async function matrixRows(page) {
  if (!(await page.locator('table').count())) { await tab(page, 'Matrix').click(); await page.waitForTimeout(300); }
  return page.locator('td.sticky span.text-\\[15px\\]').allInnerTexts();
}
export async function openMenu(page) {
  await page.getByRole('button', { name: 'More options' }).click();
  await page.waitForTimeout(150);
}
export async function openSettings(page) {
  await openMenu(page);
  await page.getByRole('button', { name: 'Settings…' }).click();
  await page.waitForTimeout(250);
}
export async function openData(page) {
  await openSettings(page);
  await page.getByRole('button', { name: 'Backup & data' }).click();
  await page.waitForTimeout(300);
}
export async function openPrayerSettings(page) {
  await openSettings(page);
  await page.getByRole('button', { name: 'Prayer times & reminders' }).click();
  await page.waitForTimeout(300);
}
/** Closes every open sheet (Settings can sit under the one opened from it). */
export async function closeSheet(page) {
  for (let i = 0; i < 4 && await page.locator('[role="dialog"] button[aria-label="Close"]').count(); i++) {
    await page.locator('[role="dialog"] button[aria-label="Close"]').last().click();
    await page.waitForTimeout(200);
  }
}
export async function logCount(page) {
  return page.evaluate(() => new Promise((resolve) => {
    const req = indexedDB.open('AegisLocalHabitDB');
    req.onsuccess = () => {
      const tx = req.result.transaction('logs', 'readonly');
      const c = tx.objectStore('logs').count();
      c.onsuccess = () => { resolve(c.result); req.result.close(); };
    };
  }));
}
