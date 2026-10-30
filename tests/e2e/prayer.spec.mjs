import * as adhan from 'adhan';
import { withApp, ok, summary, tab, openMenu, openPrayerSettings } from './harness.mjs';

const startFresh = async (p) => { const b = p.getByRole('button', { name: 'Start fresh' }); if (await b.count()) await b.click(); };
const sheet = (p) => p.locator('[role="dialog"]').last();
const pad = (n) => String(n).padStart(2, '0');
const today = new Date();
const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

function expected(lat, lng, method, hanafi, tz) {
  const p = adhan.CalculationMethod[method]();
  p.madhab = hanafi ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;
  const c = new adhan.Coordinates(lat, lng);
  p.highLatitudeRule = adhan.HighLatitudeRule.recommended(c);
  const t = new adhan.PrayerTimes(c, new Date(today.getFullYear(), today.getMonth(), today.getDate()), p);
  const f = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz });
  return { fajr: f(t.fajr), dhuhr: f(t.dhuhr), asr: f(t.asr), maghrib: f(t.maghrib), isha: f(t.isha) };
}

await withApp('Prayer times: city, method, Asr, logging, persistence', async ({ ctx, open }) => {
  const p = await open(ctx);
  await startFresh(p);
  await tab(p, 'Today').click(); await p.waitForTimeout(300);
  ok(await p.getByText("Set your location to see today's times").isVisible(), 'Daily invites prayer-time setup');
  await p.getByRole('button', { name: 'Set up' }).click(); await p.waitForTimeout(200);
  await sheet(p).getByLabel('Search city').fill('princ');
  await sheet(p).getByRole('button', { name: /Princeton, NJ/ }).click(); await p.waitForTimeout(200);
  ok(await sheet(p).getByLabel('Method').inputValue() === 'NorthAmerica', 'city picks its usual method (ISNA)');
  const exp = expected(40.36, -74.67, 'NorthAmerica', false, 'America/New_York');
  ok(await sheet(p).getByTestId('preview-fajr').innerText() === exp.fajr, `Fajr matches independent calculation (${exp.fajr})`);
  ok(await sheet(p).getByTestId('preview-maghrib').innerText() === exp.maghrib, `Maghrib matches (${exp.maghrib})`);
  const asrStd = await sheet(p).getByTestId('preview-asr').innerText();
  await sheet(p).getByRole('radio', { name: /Hanafi/ }).click(); await p.waitForTimeout(100);
  const asrHan = await sheet(p).getByTestId('preview-asr').innerText();
  ok(asrHan === expected(40.36, -74.67, 'NorthAmerica', true, 'America/New_York').asr && asrHan !== asrStd, `Hanafi Asr is later (${asrStd} → ${asrHan})`);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);

  ok(await p.getByTestId('time-isha').innerText() === exp.isha, 'Daily card shows the times');
  await p.getByRole('button', { name: 'Log Fajr' }).click();
  await p.locator('section[aria-label="Prayer times"]').getByRole('button', { name: /Jamat/ }).click(); await p.waitForTimeout(300);
  const fajrCard = p.locator('div.rounded-xl.border').filter({ has: p.locator('span.text-sm.font-bold:text-is("Fajr")') }).first();
  ok((await fajrCard.locator('button.ring-1').innerText()).includes('Jamat'), 'logging from the time card updates Fajr');
  ok(await p.getByRole('button', { name: /Fajr: With Jamat\. Change/ }).isVisible(), 'time card shows the logged state');

  await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(700);
  await tab(p, 'Today').click(); await p.waitForTimeout(300);
  ok(await p.getByTestId('time-asr').innerText() === asrHan, 'location, method and Asr setting persist');
});

await withApp('Prayer times: use my location picks regional conventions', async ({ browser, ctx: _unused, open }) => {
  const ctx = await browser.newContext({ viewport: { width: 402, height: 874 }, geolocation: { latitude: 24.86, longitude: 67.01 }, permissions: ['geolocation'] });
  const p = await open(ctx);
  await startFresh(p);
  await openPrayerSettings(p);
  await sheet(p).getByRole('button', { name: 'Use my location' }).click(); await p.waitForTimeout(1200);
  ok(await sheet(p).getByText('My location', { exact: true }).isVisible(), 'device location used');
  ok(await sheet(p).getByLabel('Method').inputValue() === 'Karachi', 'Karachi method suggested for Pakistan');
  ok(await sheet(p).getByRole('radio', { name: /Hanafi/ }).getAttribute('aria-checked') === 'true', 'Hanafi Asr suggested for South Asia');
});

await withApp('Prayer times: denied location gives a clear way forward', async ({ browser, open }) => {
  const ctx = await browser.newContext({ viewport: { width: 402, height: 874 } }); // no geolocation permission
  const p = await open(ctx);
  await startFresh(p);
  await openPrayerSettings(p);
  await sheet(p).getByRole('button', { name: 'Use my location' }).click(); await p.waitForTimeout(2500);
  ok(await sheet(p).getByRole('alert').isVisible(), `explains what to do (${(await sheet(p).getByRole('alert').innerText()).slice(0, 60)}…)`);
});

summary();
