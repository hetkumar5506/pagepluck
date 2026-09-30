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
try {
  let workers = context.serviceWorkers();
  if (!workers.length) workers = [await context.waitForEvent('serviceworker')];
  const extensionId = new URL(workers[0].url()).host;
  const site = await context.newPage();
  await site.goto('http://127.0.0.1:4173');
  const panel = await context.newPage();
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

  await panel.locator('nav button').nth(1).click();
  if (!(await panel.locator('body').innerText()).includes('test-star')) throw new Error('SVG route failed');
  await panel.locator('nav button').nth(2).click();
  if (await panel.locator('.color-list button').count() < 1) throw new Error('Colors route failed');
  await panel.locator('nav button').nth(3).click();
  if (!(await panel.locator('body').innerText()).includes('Arial')) throw new Error('Fonts route failed');

  await site.goto('https://example.com');
  await site.bringToFront();
  await panel.reload();
  await panel.waitForTimeout(900);
  const liveBody = await panel.locator('body').innerText();
  if (!liveBody.includes('Example Domain') || liveBody.includes('cannot scan')) throw new Error(`Live-site scan failed: ${liveBody}`);
  console.log(JSON.stringify({ extensionId, styling: 'passed', multiSelect: 'passed', fixtureRoutes: ['images', 'svgs', 'colors', 'fonts'], liveSite: 'https://example.com', status: 'passed' }));
} finally { await context.close(); server.close(); }
