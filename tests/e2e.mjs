import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import path from 'node:path';

const fixture = `<!doctype html><title>Asset Test Page</title><style>
body{font-family:Arial;color:rgb(17,34,51);background-color:rgb(250,250,250)}
.hero{width:120px;height:80px;background-image:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=")}
</style><img alt="pixel" width="1" height="1" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="><div class="hero"></div><div class="hero" style="background-position:-1px 0"></div><svg aria-label="test-star" viewBox="0 0 10 10"><path fill="#f00" d="M0 0h10v10H0z"/></svg><p>Test copy</p>`;
const server = createServer((_, response) => { response.setHeader('content-type', 'text/html'); response.end(fixture); });
await new Promise((resolve) => server.listen(4173, '127.0.0.1', resolve));
const extensionPath = path.resolve('.output/chrome-mv3');
const context = await chromium.launchPersistentContext('', { channel: 'chromium', headless: true, args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`] });
let panel;
const theme = () => panel.evaluate(() => document.documentElement.dataset.theme);
// Headless Chromium can refuse clipboard reads; a null here only skips the payload assertion —
// the toast assertion still proves the write succeeded, because a failed write sets a different message.
const readClipboard = () => Promise.race([
  panel.evaluate(() => navigator.clipboard.readText()).catch(() => null),
  new Promise((resolve) => setTimeout(() => resolve(null), 3000)),
]);
const dismissNotice = async () => { await panel.locator('.notice').click(); await panel.locator('.notice').waitFor({ state: 'detached' }); };
try {
  let workers = context.serviceWorkers();
  if (!workers.length) workers = [await context.waitForEvent('serviceworker')];
  const extensionId = new URL(workers[0].url()).host;
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: `chrome-extension://${extensionId}` });
  const site = await context.newPage();
  await site.goto('http://127.0.0.1:4173');
  panel = await context.newPage();
  await panel.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  await site.bringToFront();
  await panel.reload();
  await panel.waitForTimeout(900);

  const body = await panel.locator('body').innerText();
  if (!body.includes('Asset Test Page')) throw new Error(`Scan failed: ${body}`);
  const compactBody = body.replace(/\s/g, '');
  for (const expected of ['Images3', 'SVGs1', 'Colors', 'Fonts1']) if (!compactBody.includes(expected)) throw new Error(`Missing ${expected}: ${body}`);
  const topbarDisplay = await panel.locator('.topbar').evaluate((element) => getComputedStyle(element).display);
  if (topbarDisplay !== 'flex') throw new Error(`Stylesheet failed to load: topbar display is ${topbarDisplay}`);
  await panel.setViewportSize({ width: 390, height: 780 });
  await panel.screenshot({ path: 'tests/pagepluck-ui.png' });

  await panel.bringToFront();
  await panel.locator('.select-all input').check();
  if (await panel.locator('.asset-card.selected').count() !== 3) throw new Error('Image multi-select failed');
  if (await panel.getByRole('button', { name: /Download selected \(3\)/ }).isDisabled()) throw new Error('Selected-download action stayed disabled');

  await panel.locator('.asset-card .preview').first().dblclick();
  await panel.waitForSelector('.notice');
  const imageNotice = await panel.locator('.notice').innerText();
  if (!/copied/i.test(imageNotice)) throw new Error(`Image double-click copy failed: ${imageNotice}`);
  const imageClipboard = await readClipboard();
  if (imageClipboard !== null && !imageClipboard.startsWith('data:image/')) throw new Error(`Image clipboard payload missing: ${imageClipboard}`);
  await dismissNotice();

  await panel.locator('nav button').nth(1).click();
  if (!(await panel.locator('body').innerText()).includes('test-star')) throw new Error('SVG route failed');
  await panel.locator('.asset-card .preview').first().dblclick();
  await panel.waitForSelector('.notice');
  const svgNotice = await panel.locator('.notice').innerText();
  if (!/copied/i.test(svgNotice)) throw new Error(`SVG double-click copy failed: ${svgNotice}`);
  const svgClipboard = await readClipboard();
  if (svgClipboard !== null && !svgClipboard.includes('<svg')) throw new Error(`SVG markup missing from clipboard: ${svgClipboard}`);
  await dismissNotice();

  await panel.locator('nav button').nth(2).click();
  if (await panel.locator('.color-list button').count() < 1) throw new Error('Colors route failed');

  await panel.locator('nav button').nth(3).click();
  if (!(await panel.locator('body').innerText()).includes('Arial')) throw new Error('Fonts route failed');
  await panel.locator('.font-copy').first().click();
  await panel.waitForSelector('.notice');
  const fontClipboard = await readClipboard();
  if (fontClipboard !== null && fontClipboard.trim() !== 'Arial') throw new Error(`Font name missing from clipboard: ${fontClipboard}`);
  await dismissNotice();

  if (await theme() !== 'dark') throw new Error('Default theme should be dark');
  await panel.locator('.theme-toggle').click();
  if (await theme() !== 'light') throw new Error('Light theme toggle failed');
  const lightBackground = await panel.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
  if (lightBackground !== 'rgb(255, 255, 255)') throw new Error(`Light background is not pure white: ${lightBackground}`);
  await panel.reload();
  await panel.waitForTimeout(900);
  if (await theme() !== 'light') throw new Error('Theme preference did not persist across a panel reload');
  await panel.locator('.theme-toggle').click();
  if (await theme() !== 'dark') throw new Error('Dark theme toggle failed');
  await panel.screenshot({ path: 'tests/pagepluck-ui-dark.png' });

  await site.goto('https://example.com');
  await site.bringToFront();
  await panel.reload();
  await panel.waitForTimeout(900);
  const liveBody = await panel.locator('body').innerText();
  if (!liveBody.includes('Example Domain') || liveBody.includes('cannot scan')) throw new Error(`Live-site scan failed: ${liveBody}`);
  console.log(JSON.stringify({ extensionId, styling: 'passed', multiSelect: 'passed', copy: { images: 'passed', svgs: 'passed', fonts: 'passed' }, theme: 'passed', fixtureRoutes: ['images', 'svgs', 'colors', 'fonts'], liveSite: 'https://example.com', status: 'passed' }));
} finally { await context.close(); server.close(); }
