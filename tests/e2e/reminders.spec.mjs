import { withApp, ok, summary, openMenu } from './harness.mjs';

const startFresh = async (p) => { const b = p.getByRole('button', { name: 'Start fresh' }); if (await b.count()) await b.click(); };
const sheet = (p) => p.locator('[role="dialog"]').last();
const openPrayer = async (p) => { await openMenu(p); await p.getByRole('button', { name: 'Prayer times & reminders…' }).click(); await p.waitForTimeout(300); };

await withApp('Reminders: enable, plan, options, persistence', async ({ ctx, open }) => {
  await ctx.grantPermissions(['notifications']);
  const p = await open(ctx);
  await startFresh(p);
  await openPrayer(p);
  const s = sheet(p);
  const master = s.getByRole('switch', { name: 'Reminders', exact: true });
  ok(await master.getAttribute('aria-checked') === 'false', 'reminders are off by default');
  await master.click(); await p.waitForTimeout(300);
  ok(await master.getAttribute('aria-checked') === 'true', 'turning on with permission granted enables reminders');
  ok(await s.getByRole('switch', { name: 'Fajr' }).isDisabled(), 'prayer reminders wait for a location');
  ok(await s.getByLabel('Upcoming reminders').count() + await s.getByText('Nothing scheduled').count() > 0, 'shows what is coming up');

  await s.getByLabel('Search city').fill('princ');
  await s.getByRole('button', { name: /Princeton, NJ/ }).click(); await p.waitForTimeout(300);
  ok(!(await s.getByRole('switch', { name: 'Fajr' }).isDisabled()), 'prayer toggles enabled once a city is set');
  const items = await s.getByLabel('Upcoming reminders').locator('li').allInnerTexts();
  ok(items.length === 4, `upcoming list shows next 4 (${items.map(t => t.split('\n')[0]).join(', ')})`);
  ok(items.some(t => /Fajr|Zuhr|Asr|Maghrib|Isha/.test(t)), 'prayers appear in the plan');

  await s.getByLabel('Prayer reminder timing').selectOption('10');
  await s.getByRole('switch', { name: 'Morning adhkar' }).click(); await p.waitForTimeout(200);
  ok(await s.getByLabel('Morning adhkar time').isVisible(), 'morning adhkar shows a time picker');
  const after = await s.getByLabel('Upcoming reminders').locator('li').allInnerTexts();
  ok(after.some(t => /in 10 min/.test(t)), 'offset reflected in titles');

  await p.waitForTimeout(600);
  await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(700);
  await openPrayer(p);
  const s2 = sheet(p);
  ok(await s2.getByRole('switch', { name: 'Reminders', exact: true }).getAttribute('aria-checked') === 'true', 'enabled survives reload');
  ok(await s2.getByLabel('Prayer reminder timing').inputValue() === '10', 'timing survives reload');
  ok(await s2.getByRole('switch', { name: 'Morning adhkar' }).getAttribute('aria-checked') === 'true', 'adhkar choice survives reload');
});

await withApp('Reminders: notifications blocked', async ({ ctx, open }) => {
  const p = await open(ctx);
  await p.evaluate(() => {
    Object.defineProperty(window.Notification, 'permission', { get: () => 'denied' });
    window.Notification.requestPermission = async () => 'denied';
  });
  await startFresh(p);
  await openPrayer(p);
  const s = sheet(p);
  await s.getByRole('switch', { name: 'Reminders', exact: true }).click(); await p.waitForTimeout(300);
  ok(await s.getByText('Notifications are off for Wird').isVisible(), 'explains how to turn notifications on');
  ok(await s.getByRole('switch', { name: 'Reminders', exact: true }).getAttribute('aria-checked') === 'false', 'stays off when denied');
});

summary();
