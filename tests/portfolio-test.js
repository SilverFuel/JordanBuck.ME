import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { test as base, expect } from '@playwright/test';

export { expect };
export const demoURL = 'https://missionboard-portfolio-demo.silverfuel.chatgpt.site/';
export const demoOrigin = new URL(demoURL).origin;
const fixtureDirectory = new URL('./fixtures/missionboard/', import.meta.url);
export const fixtureManifest = JSON.parse(readFileSync(new URL('manifest.json', fixtureDirectory), 'utf8'));
const fixturePaths = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/demo.css': ['demo.css', 'text/css; charset=utf-8'],
  '/demo.js': ['demo.js', 'text/javascript; charset=utf-8'],
  '/sample-data.js': ['sample-data.js', 'text/javascript; charset=utf-8'],
  '/product.css': ['product.css', 'text/css; charset=utf-8'],
  '/brand-mark.svg': ['brand-mark.svg', 'image/svg+xml'],
};
const fixtureResponses = new Map();

assert.equal(fixtureManifest.publicOrigin, demoOrigin);
assert.deepEqual(Object.keys(fixtureManifest.files).sort(), Object.values(fixturePaths).map(([name]) => name).sort());
assert.deepEqual(readdirSync(fixtureDirectory).sort(), [...Object.keys(fixtureManifest.files), 'manifest.json'].sort());
for (const [pathname, [name, contentType]] of Object.entries(fixturePaths)) {
  const body = readFileSync(new URL(name, fixtureDirectory));
  assert.equal(createHash('sha256').update(body).digest('hex'), fixtureManifest.files[name].sha256, `${name} must match the verified snapshot`);
  assert.equal(body.length, fixtureManifest.files[name].bytes);
  fixtureResponses.set(pathname, { body, contentType });
}

// The six exact demo URLs are fulfilled locally before any network access.
// Every other origin, write, API request, or demo path fails the check.
export const test = base.extend({
  portfolioAudit: [async ({ context, page, baseURL }, use) => {
    const allowed = new URL(baseURL);
    const unexpected = [];
    const pageErrors = [];
    const storageEffects = [];
    const demoRequests = [];
    await context.exposeBinding('__recordPortfolioEffect', ({ frame }, operation) => {
      storageEffects.push({ origin: new URL(frame.url()).origin, operation });
    });
    page.on('pageerror', error => pageErrors.push(error.message));
    await context.route('**/*', async route => {
      const request = route.request();
      const url = new URL(request.url());
      const writes = !['GET', 'HEAD'].includes(request.method());
      const api = ['fetch', 'xhr'].includes(request.resourceType()) || /\/api(?:\/|$)/i.test(url.pathname);
      const fixture = url.origin === demoOrigin ? fixtureResponses.get(url.pathname) : undefined;
      if (fixture && request.method() === 'GET' && !url.search && !api) {
        demoRequests.push({ path: url.pathname, hasReferrer: Boolean(request.headers().referer) });
        await route.fulfill({ status: 200, ...fixture, headers: { 'cache-control': 'no-store' } });
        return;
      }
      if (url.origin === demoOrigin || url.origin !== allowed.origin || writes || api) {
        unexpected.push(`${request.method()} ${url.origin}${url.pathname} (${request.resourceType()})`);
        await route.abort('blockedbyclient');
        return;
      }
      await route.continue();
    });
    await context.routeWebSocket('**/*', socket => {
      const url = new URL(socket.url());
      if (url.host === allowed.host && ['localhost', '127.0.0.1', '[::1]'].includes(allowed.hostname)) {
        socket.connectToServer();
      } else {
        unexpected.push(`WebSocket ${url.origin}${url.pathname}`);
        socket.close();
      }
    });
    await context.addInitScript(() => {
      window.__portfolioStorageEffects = [];
      const record = operation => {
        window.__portfolioStorageEffects.push(operation);
        void window.__recordPortfolioEffect(operation);
      };
      const wrap = (prototype, methods, label) => {
        if (!prototype) return;
        for (const method of methods) {
          const original = prototype[method];
          if (typeof original !== 'function') continue;
          prototype[method] = function (...args) {
            record(`${label}.${method}`);
            return original.apply(this, args);
          };
        }
      };
      wrap(Storage.prototype, ['setItem', 'removeItem', 'clear'], 'Storage');
      wrap(IDBFactory.prototype, ['open', 'deleteDatabase'], 'IndexedDB');
      wrap(window.CacheStorage?.prototype, ['open', 'delete'], 'CacheStorage');
      wrap(window.ServiceWorkerContainer?.prototype, ['register'], 'ServiceWorker');
      wrap(window, ['fetch'], 'Network');
      wrap(XMLHttpRequest.prototype, ['open'], 'XMLHttpRequest');
      wrap(Navigator.prototype, ['sendBeacon'], 'Navigator');
      const cookie = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
      if (cookie?.set) {
        Object.defineProperty(Document.prototype, 'cookie', {
          ...cookie,
          set(value) {
            record('document.cookie');
            return cookie.set.call(this, value);
          },
        });
      }
    });
    await use({ demoRequests });
    expect(unexpected, 'No unapproved network, API, or write requests').toEqual([]);
    expect(pageErrors, 'No uncaught browser errors in parent or child').toEqual([]);
    expect(storageEffects, 'No storage or network API calls in parent or child').toEqual([]);
    if (!page.isClosed()) {
      for (const frame of page.frames()) {
        if (frame.url() === 'about:blank') continue;
        expect([allowed.origin, demoOrigin]).toContain(new URL(frame.url()).origin);
        expect(await frame.evaluate(() => window.__portfolioStorageEffects || [])).toEqual([]);
        const state = await frame.evaluate(async () => ({
          local: localStorage.length,
          session: sessionStorage.length,
          databases: typeof indexedDB.databases === 'function' ? (await indexedDB.databases()).length : 0,
          caches: typeof caches === 'undefined' ? 0 : (await caches.keys()).length,
          workers: 'serviceWorker' in navigator ? (await navigator.serviceWorker.getRegistrations()).length : 0,
        }));
        expect(state, `No application storage at ${new URL(frame.url()).origin}`).toEqual({ local: 0, session: 0, databases: 0, caches: 0, workers: 0 });
      }
    }
    const cookies = (await context.cookies()).map(({ name, domain }) => ({ name, domain }));
    expect(cookies, 'Local fixture browsing creates no cookies').toEqual([]);
    expect(context.serviceWorkers(), 'No service workers created').toHaveLength(0);
  }, { auto: true }],
});

export async function openReference(page) {
  const reference = page.locator('[data-mission-reference]');
  await expect(reference).toBeVisible();
  if (await reference.getAttribute('open') === null) await reference.locator(':scope > summary').click();
  await expect(reference).toHaveAttribute('open', '');
}

export async function openLiveDemo(page) {
  await page.goto('/#missionboard-live');
  const iframe = page.locator('[data-mission-frame]');
  await iframe.scrollIntoViewIfNeeded();
  const demo = page.frameLocator('[data-mission-frame]');
  await expect(demo.getByRole('heading', { level: 1, name: 'Overview', exact: true })).toBeVisible();
  // Child coordinates can be stable while the portfolio's containing card moves.
  const explorer = page.locator('[data-mission-explorer]');
  await expect(explorer).toHaveCSS('opacity', '1');
  await expect(explorer).toHaveCSS('transform', 'none');
  await expect.poll(() => iframe.evaluate(async element => {
    let previous = element.getBoundingClientRect();
    for (let frame = 0; frame < 3; frame += 1) {
      await new Promise(requestAnimationFrame);
      const current = element.getBoundingClientRect();
      if (Math.abs(previous.x - current.x) > 0.5 || Math.abs(previous.y - current.y) > 0.5) return false;
      previous = current;
    }
    return true;
  })).toBe(true);
  return demo;
}

export async function openFilters(demo) {
  const search = demo.getByRole('searchbox', { name: 'Search sample work' });
  if (!await search.isVisible()) await demo.getByRole('button', { name: /^Filters/ }).click();
  await expect(search).toBeVisible();
  return search;
}
