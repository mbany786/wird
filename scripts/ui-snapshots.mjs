#!/usr/bin/env node
/**
 * Headless UI snapshots — no simulator, no windows, no screen takeover.
 *
 * Builds nothing itself: run `bun run build` first (the `ui:snap` script does both).
 * Serves ./dist with Vite's preview server, drives headless Chromium through the
 * main screens at real device sizes, and writes PNGs to ./.snapshots/<device>/.
 *
 *   bun run ui:snap                 # all devices
 *   SNAP_DEVICES=iphone bun run ui:snap
 *
 * First run on a new machine: `bunx playwright install chromium`
 */
import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const DEVICES = {
  // iPhone 17 Pro (6.3") and Pro Max (6.9", App Store size class)
  iphone: { width: 402, height: 874, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  'iphone-max': { width: 440, height: 956, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  // iPad Pro 13" (App Store size class)
  ipad: { width: 1032, height: 1376, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

const wanted = (process.env.SNAP_DEVICES || Object.keys(DEVICES).join(','))
  .split(',').map(s => s.trim()).filter(Boolean);
const outRoot = path.resolve('.snapshots');

const server = await preview({ preview: { port: 0, strictPort: false, open: false }, logLevel: 'error' });
const baseUrl = server.resolvedUrls.local[0];
const browser = await chromium.launch();
const problems = [];

try {
  for (const name of wanted) {
    const device = DEVICES[name];
    if (!device) { problems.push(`unknown device "${name}"`); continue; }
    const dir = path.join(outRoot, name);
    await mkdir(dir, { recursive: true });

    const ctx = await browser.newContext({ ...device, viewport: { width: device.width, height: device.height } });
    const page = await ctx.newPage();
    page.on('pageerror', e => problems.push(`[${name}] page error: ${e.message}`));

    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const shot = async (file) => page.screenshot({ path: path.join(dir, file) });

    // Tabs live in the bottom bar on iPhone and in the header on iPad/desktop
    const tab = (label) => page.getByRole('button', { name: label, exact: true }).first();

    await shot('01-matrix.png');
    await page.locator('td.sticky span.text-\\[15px\\]').first().click();
    await page.waitForTimeout(400);
    await shot('02-quick-count.png');
    await page.getByRole('button', { name: 'Close', exact: true }).click();

    await tab('Daily').click();
    await page.waitForTimeout(400);
    await shot('03-daily.png');

    await tab('Analytics').click();
    await page.waitForTimeout(400);
    await shot('04-analytics.png');

    await page.getByRole('button', { name: 'More options' }).click();
    await page.waitForTimeout(200);
    await shot('05-more-menu.png');

    // Smallest rendered font size on the matrix — guards the 11pt minimum
    await page.getByRole('button', { name: 'More options' }).click();
    await tab('Matrix').click();
    const minFont = await page.evaluate(() => {
      let min = Infinity;
      for (const el of document.querySelectorAll('body *')) {
        if (!el.childNodes.length || ![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        min = Math.min(min, parseFloat(getComputedStyle(el).fontSize));
      }
      return min;
    });
    if (minFont < 11) problems.push(`[${name}] text smaller than 11px found (${minFont}px)`);

    await ctx.close();
    console.log(`✓ ${name}: ${path.relative(process.cwd(), dir)}/ (min font ${minFont}px)`);
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}

if (problems.length) {
  console.error('\n' + problems.join('\n'));
  process.exit(1);
}
