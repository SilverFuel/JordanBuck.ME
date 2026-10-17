import { test, expect, demoURL, fixtureManifest, openLiveDemo, openFilters } from './portfolio-test.js';

async function expectWork(demo, titles, total = 4, unit = 'work items') {
  await expect(demo.locator('#result-count')).toHaveText(`${titles.length} of ${total} ${unit}`);
  await expect(demo.locator('#work-results article')).toHaveCount(titles.length);
  for (const title of titles) await expect(demo.locator('#work-results').getByRole('link', { name: title, exact: true })).toBeVisible();
}

async function expectFrameFits(page, demo) {
  const parent = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  expect(parent.document).toBeLessThanOrEqual(parent.viewport);
  expect(parent.body).toBeLessThanOrEqual(parent.viewport);
  const child = await demo.locator('html').evaluate(element => ({ viewport: innerWidth, document: element.scrollWidth, body: document.body.scrollWidth }));
  expect(child.viewport).toBeGreaterThanOrEqual(320);
  expect(child.document).toBeLessThanOrEqual(child.viewport);
  expect(child.body).toBeLessThanOrEqual(child.viewport);
  for (const nav of await demo.locator('[data-view]').all()) {
    await expect(nav).toBeVisible();
    const bounds = await nav.evaluate(element => {
      const box = element.getBoundingClientRect();
      return { left: box.left, right: box.right, width: box.width };
    });
    expect(bounds.left).toBeGreaterThanOrEqual(0);
    expect(bounds.right).toBeLessThanOrEqual(child.viewport);
    expect(bounds.width).toBeGreaterThan(0);
  }
  const iframe = await page.locator('[data-mission-frame]').boundingBox();
  expect(iframe.x).toBeGreaterThanOrEqual(0);
  expect(iframe.x + iframe.width).toBeLessThanOrEqual(parent.viewport);
}

test('the primary action enters the live workspace and screenshots are optional', async ({ page }) => {
  await page.goto('/#projects');
  const reference = page.locator('[data-mission-reference]');
  await expect(reference).not.toHaveAttribute('open');
  await expect(page.locator('[data-mission-tabs]')).toBeHidden();
  const primary = page.getByRole('link', { name: 'Use live demo', exact: true });
  await expect(primary).toHaveAttribute('href', '#missionboard-live');
  await primary.click();
  await expect(page).toHaveURL(/#missionboard-live$/);
  await expect(page.locator('#missionboard-live')).toBeFocused();
  const demo = page.frameLocator('[data-mission-frame]');
  await expect(demo.getByRole('heading', { level: 1, name: 'Overview', exact: true })).toBeVisible();
  await expect(page.locator('[data-mission-standalone]')).toHaveAttribute('href', demoURL);
  await expect(page.locator('.mission-live__help a')).toHaveAttribute('href', demoURL);
});

test('the iframe uses only the six verified fixture assets with no referrer', async ({ page, portfolioAudit }) => {
  const demo = await openLiveDemo(page);
  expect(fixtureManifest.publishedSourceCommit).toBe('1a92a6e6ed87cdb0b2e139f2be3e59b09420e919');
  await expect.poll(() => [...new Set(portfolioAudit.demoRequests.map(request => request.path))].sort()).toEqual([
    '/', '/brand-mark.svg', '/demo.css', '/demo.js', '/product.css', '/sample-data.js',
  ]);
  expect(portfolioAudit.demoRequests.every(request => !request.hasReferrer)).toBe(true);
  await expect(demo.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveAttribute('content', "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'none'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'");
  expect(await demo.locator('html').evaluate(() => document.referrer)).toBe('');
});

test('sandbox allows the demo scripts but denies cross-origin document access', async ({ page }) => {
  const demo = await openLiveDemo(page);
  const iframe = page.locator('[data-mission-frame]');
  await expect(iframe).toHaveAttribute('src', `${demoURL}#overview`);
  await expect(iframe).toHaveAttribute('title', 'MissionBoard live demo — fictional read-only workspace');
  await expect(iframe).toHaveAttribute('loading', 'lazy');
  await expect(iframe).toHaveAttribute('referrerpolicy', 'no-referrer');
  expect(await iframe.evaluate(element => [...element.sandbox].sort())).toEqual(['allow-same-origin', 'allow-scripts']);
  await expect(iframe).toHaveAttribute('allow', "camera 'none'; microphone 'none'; geolocation 'none'; payment 'none'; clipboard-write 'none'; fullscreen 'none'");
  const childAccess = await demo.locator('html').evaluate(() => {
    try { return parent.document.body.tagName; } catch (error) { return error.name; }
  });
  expect(childAccess).toBe('SecurityError');
  const parentAccess = await iframe.evaluate(element => {
    try { return element.contentWindow.document.body.tagName; } catch (error) { return error.name; }
  });
  expect(parentAccess).toBe('SecurityError');
  await expectWork(demo, ['Service desk move', 'Dispatch tablet recovery', 'Choose the pilot handoff window', 'Field kit rollout']);
});

test('embedded owner, group, and type filters combine and clear without submitting', async ({ page }) => {
  const demo = await openLiveDemo(page);
  const search = await openFilters(demo);
  const owner = demo.getByRole('combobox', { name: 'Filter by owner' });
  const group = demo.getByRole('combobox', { name: 'Filter by group' });
  const type = demo.getByRole('combobox', { name: 'Filter by type' });
  await owner.selectOption('Theo Park');
  await expectWork(demo, ['Service desk move']);
  await group.selectOption('Field Operations');
  await expect(demo.getByRole('heading', { name: 'No matching sample work' })).toBeVisible();
  await expect(demo.locator('#result-count')).toHaveText('0 of 4 work items');
  await demo.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(owner).toHaveValue('');
  await expect(group).toHaveValue('');
  await expectWork(demo, ['Service desk move', 'Dispatch tablet recovery', 'Choose the pilot handoff window', 'Field kit rollout']);
  await type.selectOption('Action Item');
  await owner.selectOption('Unassigned');
  await group.selectOption('Field Operations');
  await expectWork(demo, ['Choose the pilot handoff window']);
  await search.fill('HANDOFF');
  await search.press('Enter');
  await expectWork(demo, ['Choose the pilot handoff window']);
  await expect(page).toHaveURL(/#missionboard-live$/);
  expect(await demo.locator('html').evaluate(() => location.hash)).toContain('owner=Unassigned');
  const clear = demo.getByRole('button', { name: 'Clear filters', exact: true });
  await clear.focus();
  await clear.press('Enter');
  for (const field of [search, owner, group, type]) await expect(field).toHaveValue('');
  await expect(demo.locator('#result-count')).toHaveText('4 of 4 work items');
});

test('embedded search finds sample context and recovers from no results', async ({ page }) => {
  const demo = await openLiveDemo(page);
  const search = await openFilters(demo);
  await search.fill('  QUEUED JOBS  ');
  await expectWork(demo, ['Dispatch tablet recovery']);
  await search.fill('no matching fictional record');
  await expect(demo.locator('#work-results article')).toHaveCount(0);
  await expect(demo.getByRole('heading', { name: 'No matching sample work' })).toBeVisible();
  await demo.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(demo.locator('#work-results article')).toHaveCount(4);
  await expect(search).toHaveValue('');
});

test('embedded views and project details keep navigation inside the iframe', async ({ page }) => {
  const demo = await openLiveDemo(page);
  await demo.locator('[data-view="attention"]').click();
  await expect(demo.getByRole('heading', { level: 1, name: 'Needs Attention', exact: true })).toBeVisible();
  await expectWork(demo, ['Service desk move', 'Dispatch tablet recovery', 'Choose the pilot handoff window'], 3);
  await demo.locator('#work-results').getByRole('link', { name: 'Service desk move', exact: true }).click();
  await expect(demo.getByRole('heading', { level: 1, name: 'Service desk move', exact: true })).toBeFocused();
  await expect(demo.locator('.detail-heading .demo-status')).toHaveText('Blocked');
  await expect(demo.locator('.status-snapshot')).toContainText('Theo Park');
  await expect(demo.locator('.next-action-box')).toContainText('Confirm room access with the facilities lead.');
  await expect(demo.getByRole('heading', { name: 'Action items', exact: true })).toBeVisible();
  await expect(demo.getByRole('heading', { name: 'Project updates', exact: true })).toBeVisible();
  await demo.getByRole('link', { name: '← Back to Needs Attention', exact: true }).click();
  await expect(demo.locator('#work-results article')).toHaveCount(3);
  await demo.locator('[data-view="projects"]').click();
  await expectWork(demo, ['Service desk move', 'Dispatch tablet recovery', 'Field kit rollout'], 3, 'projects');
  await expect(demo.locator('[data-view="projects"]')).toHaveAttribute('aria-current', 'page');
  await expect(page).toHaveURL(/#missionboard-live$/);
  await expect(page.locator('[data-mission-reference]')).not.toHaveAttribute('open');
});

test('embedded task and related project links preserve the filtered return view', async ({ page }) => {
  const demo = await openLiveDemo(page);
  await openFilters(demo);
  await demo.getByRole('combobox', { name: 'Filter by owner' }).selectOption('Unassigned');
  await demo.locator('#work-results').getByRole('link', { name: 'Choose the pilot handoff window', exact: true }).click();
  await expect(demo.getByRole('heading', { name: 'Task notes', exact: true })).toBeVisible();
  await expect(demo.locator('.status-snapshot')).toContainText('Unassigned');
  await demo.getByRole('link', { name: 'Field kit rollout', exact: true }).click();
  await expect(demo.getByRole('heading', { level: 1, name: 'Field kit rollout', exact: true })).toBeVisible();
  await demo.locator('.action-list').getByRole('link', { name: 'Choose the pilot handoff window', exact: true }).click();
  await expect(demo.getByRole('heading', { level: 1, name: 'Choose the pilot handoff window', exact: true })).toBeVisible();
  await demo.getByRole('link', { name: '← Back to Overview', exact: true }).click();
  await expectWork(demo, ['Choose the pilot handoff window']);
  await expect(demo.getByRole('combobox', { name: 'Filter by owner' })).toHaveValue('Unassigned');
});

test('keyboard users enter and leave the iframe and can skip to the reference tour', async ({ page }) => {
  const demo = await openLiveDemo(page);
  const skip = page.getByRole('link', { name: 'Skip live demo', exact: true });
  await skip.focus();
  await page.keyboard.press('Tab');
  await expect(demo.getByRole('link', { name: 'Skip to main content', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(skip).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(demo.locator('#main')).toBeFocused();
  await demo.locator('.demo-footer summary').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('.mission-live__help a')).toBeFocused();
  await skip.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#missionboard-walkthrough$/);
  await expect(page.locator('[data-mission-reference]')).toBeFocused();
  await page.keyboard.press('Tab');
  const summary = page.locator('[data-mission-reference] > summary');
  await expect(summary).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-mission-tabs]')).toBeVisible();
});

for (const width of [320, 390, 768, 1440]) {
  test(`embedded demo stays usable within a ${width}px portfolio viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const demo = await openLiveDemo(page);
    await expectFrameFits(page, demo);
    const search = await openFilters(demo);
    await expectFrameFits(page, demo);
    await demo.getByRole('combobox', { name: 'Filter by owner' }).selectOption('Unassigned');
    await expectWork(demo, ['Choose the pilot handoff window']);
    await expect(search).toBeVisible();
    await demo.locator('#work-results').getByRole('link', { name: 'Choose the pilot handoff window', exact: true }).click();
    await expect(demo.getByRole('heading', { level: 1, name: 'Choose the pilot handoff window', exact: true })).toBeVisible();
    await expectFrameFits(page, demo);
    await demo.getByRole('link', { name: 'Field kit rollout', exact: true }).click();
    await expect(demo.getByRole('heading', { level: 1, name: 'Field kit rollout', exact: true })).toBeVisible();
    await expectFrameFits(page, demo);
    await demo.locator('[data-view="projects"]').click();
    await expect(demo.getByRole('heading', { level: 1, name: 'Projects', exact: true })).toBeVisible();
    await expect(demo.locator('#work-results article')).toHaveCount(3);
    await expectFrameFits(page, demo);
  });
}

test.describe('embedded demo without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('explains the limitation while the parent keeps native reference content available', async ({ page }) => {
    await page.goto('/#missionboard-live');
    await page.locator('[data-mission-frame]').scrollIntoViewIfNeeded();
    const demo = page.frameLocator('[data-mission-frame]');
    await expect(demo.getByRole('heading', { name: 'Mission-Board demo', exact: true })).toBeVisible();
    await expect(demo.locator('noscript p')).toContainText('needs JavaScript to filter sample work and open details');
    await expect(page.locator('.mission-live__help a')).toBeVisible();
    await page.getByRole('link', { name: 'Skip live demo', exact: true }).click();
    await page.locator('[data-mission-reference] > summary').click();
    await expect(page.locator('[data-mission-scene]:visible')).toHaveCount(3);
    await expect(page.locator('[data-mission-controls]')).toBeHidden();
  });
});
