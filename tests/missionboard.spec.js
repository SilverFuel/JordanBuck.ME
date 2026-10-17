import { test, expect, demoURL, openReference } from './portfolio-test.js';
const scenes = [
  { id: 'overview', name: 'The working view', image: 'overview', reveal: 'A missing owner:' },
  { id: 'blocked', name: 'From blocker to next step', image: 'blocked', reveal: 'Theo Park' },
  { id: 'mobile', name: 'The same view on mobile', image: 'mobile', reveal: 'Choose the pilot handoff window' },
];

async function openExplorer(page) {
  await page.goto('/#projects');
  await openReference(page);
  await expect(page.locator('[data-mission-tabs]')).toBeVisible();
  await page.locator('[data-mission-explorer]').scrollIntoViewIfNeeded();
}

async function expectScene(page, index, focused = false) {
  for (const [i, scene] of scenes.entries()) {
    const tab = page.locator(`#mission-tab-${scene.id}`);
    const panel = page.locator(`#mission-scene-${scene.id}`);
    await expect(tab).toHaveAttribute('aria-controls', `mission-scene-${scene.id}`);
    await expect(tab).toHaveAttribute('aria-selected', String(i === index));
    await expect(tab).toHaveAttribute('tabindex', i === index ? '0' : '-1');
    await expect(panel).toHaveAttribute('role', 'tabpanel');
    await expect(panel).toHaveAttribute('aria-labelledby', `mission-tab-${scene.id}`);
    if (i === index) await expect(panel).toBeVisible();
    else await expect(panel).toBeHidden();
  }
  await expect(page.locator('[data-mission-status]')).toHaveText(`0${index + 1} / 03 · ${scenes[index].name}`);
  if (focused) await expect(page.locator('[data-mission-tab]').nth(index)).toBeFocused();
}

async function expectScreenshot(page, index) {
  await expect(page.locator('[data-mission-dialog-title]')).toHaveText(scenes[index].name);
  await expect(page.locator('[data-mission-dialog-status]')).toHaveText(`${index + 1} of 3`);
  const image = page.locator('[data-mission-dialog-image]');
  await expect(image).toHaveAttribute('src', new RegExp(`/projects/missionboard-demo-${scenes[index].image}\\.png$`));
  await expect.poll(() => image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(image).toHaveAttribute('alt', await page.locator('[data-mission-scene]').nth(index).locator('img').getAttribute('alt'));
}

async function expectNoHorizontalOverflow(page) {
  expect(await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth })))
    .toEqual({ width: page.viewportSize().width, scroll: page.viewportSize().width });
}

test('three walkthrough tabs expose one correctly labelled panel at a time', async ({ page }) => {
  await openExplorer(page);
  await expect(page.getByRole('tablist', { name: 'MissionBoard walkthrough' })).toBeVisible();
  await expect(page.locator('[data-mission-tab]')).toHaveCount(3);
  await expectScene(page, 0);
  for (const index of [1, 2, 0]) {
    await page.locator('[data-mission-tab]').nth(index).click();
    await expectScene(page, index);
  }
});

test('a direct projects reload restores enhancement and clears transient viewer state', async ({ page }) => {
  await openExplorer(page);
  await page.locator('[data-mission-tab]').nth(2).click();
  await page.locator('#mission-scene-mobile summary').click();
  await page.locator('#mission-scene-mobile [data-mission-image]').click();
  await page.locator('[data-mission-zoom]').click();
  await page.reload();
  await expect(page).toHaveURL(/\/#projects$/);
  await expect(page.locator('[data-mission-reference]')).not.toHaveAttribute('open');
  await openReference(page);
  await expect(page.locator('[data-mission-tabs]')).toBeVisible();
  await expect(page.locator('[data-mission-controls]')).toBeVisible();
  await expectScene(page, 0);
  await expect(page.locator('[data-mission-dialog]')).toBeHidden();
  await expect(page.locator('body')).not.toHaveClass(/mission-viewer-open/);
  await expect(page.locator('#mission-scene-mobile details')).not.toHaveAttribute('open');
  await page.locator('[data-mission-image]').first().click();
  await expectScreenshot(page, 0);
  await expect(page.locator('[data-mission-zoom]')).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.press('Escape');
});

test('arrow keys wrap and Home/End move the single tab stop and focus', async ({ page }) => {
  await openExplorer(page);
  await page.locator('[data-mission-tab]').first().focus();
  for (const [key, index] of [['ArrowLeft', 2], ['ArrowRight', 0], ['ArrowRight', 1], ['End', 2], ['Home', 0]]) {
    await page.keyboard.press(key);
    await expectScene(page, index, true);
  }
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-mission-image]').first()).toBeFocused();
});

test('walkthrough controls go backward and restart after the last view', async ({ page }) => {
  await openExplorer(page);
  const previous = page.locator('[data-mission-prev]');
  const next = page.locator('[data-mission-next]');
  await expect(previous).toBeDisabled();
  await next.click();
  await expectScene(page, 1);
  await expect(previous).toBeEnabled();
  await previous.focus();
  await page.keyboard.press('Enter');
  await expectScene(page, 0);
  await expect(previous).toBeDisabled();
  await expect(next).toBeFocused();
  await next.click();
  await next.click();
  await expectScene(page, 2);
  await expect(next).toHaveText('Back to start ↺');
  await next.click();
  await expectScene(page, 0);
  await expect(next).toHaveText('Next view →');
});

test('each native details reveal works by keyboard and survives scene changes', async ({ page }) => {
  await openExplorer(page);
  for (const [index, scene] of scenes.entries()) {
    await page.locator('[data-mission-tab]').nth(index).click();
    const panel = page.locator(`#mission-scene-${scene.id}`);
    const details = panel.locator('details');
    await expect(details).not.toHaveAttribute('open');
    await details.locator('summary').focus();
    await page.keyboard.press(index === 1 ? 'Space' : 'Enter');
    await expect(details).toHaveAttribute('open', '');
    await expect(details.getByText(scene.reveal, { exact: true })).toBeVisible();
  }
  await page.locator('[data-mission-tab]').first().click();
  const details = page.locator('#mission-scene-overview details');
  await expect(details).toHaveAttribute('open', '');
  await details.locator('summary').click();
  await expect(details).not.toHaveAttribute('open');
});

test('modal viewer keeps background focus inert and Escape restores its opener', async ({ page }) => {
  await openExplorer(page);
  const opener = page.locator('[data-mission-image]').first();
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'The working view' });
  await expect(dialog).toBeVisible();
  await expectScreenshot(page, 0);
  await expect(page.locator('[data-mission-close]')).toBeFocused();
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  await page.locator('[data-mission-tab]').nth(1).evaluate(button => button.focus());
  await expect(page.locator('[data-mission-close]')).toBeFocused();
  for (const key of ['Shift+Tab', ...Array(10).fill('Tab')]) {
    await page.keyboard.press(key);
    const focus = await dialog.evaluate(element => ({
      inside: element.contains(document.activeElement),
      browserChrome: document.activeElement === document.body && !document.hasFocus(),
    }));
    // Native dialogs may let the user reach browser chrome; the page stays inert.
    expect(focus.inside || focus.browserChrome).toBe(true);
    if (focus.browserChrome) {
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
    }
  }
  await expectScene(page, 0);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  await expect(page.locator('body')).not.toHaveClass(/mission-viewer-open/);
});

test('close button restores the clicked scene and can reopen the viewer', async ({ page }) => {
  await openExplorer(page);
  await page.locator('[data-mission-tab]').nth(1).click();
  const opener = page.locator('#mission-scene-blocked [data-mission-image]');
  for (let i = 0; i < 2; i += 1) {
    await opener.click();
    await expectScreenshot(page, 1);
    await page.locator('[data-mission-close]').click();
    await expect(page.locator('[data-mission-dialog]')).toBeHidden();
    await expect(opener).toBeFocused();
  }
  await expectScene(page, 1);
});

test('dialog navigation wraps, resets zoom, and remains consistent under rapid keys', async ({ page }) => {
  await openExplorer(page);
  await page.locator('[data-mission-image]').first().click();
  await page.locator('[data-mission-dialog-prev]').click();
  await expectScreenshot(page, 2);
  await page.locator('[data-mission-dialog-next]').click();
  await expectScreenshot(page, 0);
  await page.locator('[data-mission-zoom]').click();
  await expect(page.locator('[data-mission-zoom]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-mission-dialog-next]').click();
  await expectScreenshot(page, 1);
  await expect(page.locator('[data-mission-zoom]')).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.press('End');
  await expectScreenshot(page, 2);
  await page.keyboard.press('Home');
  await expectScreenshot(page, 0);
  for (let i = 0; i < 17; i += 1) await page.keyboard.press('ArrowRight');
  await expectScreenshot(page, 2);
  await page.keyboard.press('ArrowRight');
  await expectScreenshot(page, 0);
  await page.keyboard.press('ArrowLeft');
  await expectScreenshot(page, 2);
  await page.keyboard.press('Escape');
  await expectScene(page, 0);
});

test('mobile screenshot zoom exposes the full height and keeps arrow keys for scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openExplorer(page);
  await page.locator('[data-mission-tab]').nth(2).click();
  await page.locator('#mission-scene-mobile [data-mission-image]').click();
  await expectScreenshot(page, 2);
  const viewport = page.locator('[data-mission-dialog-viewport]');
  const zoom = page.locator('[data-mission-zoom]');
  await zoom.click();
  await expect(zoom).toHaveText('Fit image');
  await expect(zoom).toHaveAttribute('aria-pressed', 'true');
  const dimensions = await viewport.evaluate(element => ({ height: element.clientHeight, scroll: element.scrollHeight }));
  expect(dimensions.scroll).toBeGreaterThan(dimensions.height * 2);
  await viewport.hover();
  await page.mouse.wheel(0, 1200);
  await expect.poll(() => viewport.evaluate(element => element.scrollTop)).toBeGreaterThan(500);
  await viewport.focus();
  await page.keyboard.press('ArrowRight');
  await expectScreenshot(page, 2);
  await zoom.click();
  await expect(zoom).toHaveText('Zoom in');
  await expect.poll(() => viewport.evaluate(element => element.scrollTop)).toBe(0);
  await expect(page.locator('[data-mission-close]')).toBeInViewport();
  await page.keyboard.press('Escape');
  await expectNoHorizontalOverflow(page);
});

for (const width of [320, 390, 768, 1440]) {
  test(`all three scenes and screenshot controls fit a ${width}px screen`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openExplorer(page);
    for (const [index, scene] of scenes.entries()) {
      await page.locator('[data-mission-tab]').nth(index).click();
      const panel = page.locator(`#mission-scene-${scene.id}`);
      const image = panel.locator('img');
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
      await expectNoHorizontalOverflow(page);
      const frame = await panel.locator('[data-mission-image]').boundingBox();
      expect(frame.x).toBeGreaterThanOrEqual(0);
      expect(frame.x + frame.width).toBeLessThanOrEqual(width);
      await panel.locator('[data-mission-image]').click();
      await expectScreenshot(page, index);
      for (const hook of ['close', 'zoom', 'dialog-prev', 'dialog-next']) {
        await expect(page.locator(`[data-mission-${hook}]`)).toBeInViewport({ ratio: 1 });
      }
      await expectNoHorizontalOverflow(page);
      await page.locator('[data-mission-close]').click();
    }
  });
}

for (const viewport of [{ width: 320, height: 480 }, { width: 844, height: 390 }]) {
  test(`short ${viewport.width}x${viewport.height} viewer keeps controls reachable while zooming`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openExplorer(page);
    await page.locator('[data-mission-image]').first().click();
    await expectScreenshot(page, 0);
    await page.locator('[data-mission-zoom]').click();
    const imageViewport = page.locator('[data-mission-dialog-viewport]');
    const overflow = await imageViewport.evaluate(element => ({ x: element.scrollWidth > element.clientWidth, y: element.scrollHeight > element.clientHeight }));
    expect(overflow).toEqual({ x: true, y: true });
    await imageViewport.hover();
    await page.mouse.wheel(500, 500);
    await expect.poll(() => imageViewport.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
    await expect.poll(() => imageViewport.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
    for (const hook of ['close', 'zoom', 'dialog-prev', 'dialog-next']) {
      await expect(page.locator(`[data-mission-${hook}]`)).toBeInViewport({ ratio: 1 });
    }
    await page.locator('[data-mission-close]').click();
    await expectNoHorizontalOverflow(page);
  });
}

test('demo links are limited to the intended public sample routes', async ({ page }) => {
  await openExplorer(page);
  const links = page.locator('[data-mission-explorer] a[href^="https:"]');
  expect(await links.evaluateAll(elements => elements.map(link => link.href))).toEqual([
    demoURL,
    demoURL,
    `${demoURL}#attention`,
    `${demoURL}#work/service-desk-move`,
    `${demoURL}#work/pilot-window`,
  ]);
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toContainText('(opens in a new tab)');
  }
  await expect(page.locator('.mission-demo-actions .button')).toHaveAttribute('href', '#missionboard-live');
  await expect(page.locator('[data-mission-explorer] form, [data-mission-explorer] input')).toHaveCount(0);
});

test('reduced motion removes walkthrough animations and keeps controls working', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openExplorer(page);
  await page.locator('[data-mission-tab]').nth(1).click();
  await expectScene(page, 1);
  await expect(page.locator('#mission-scene-blocked')).toHaveCSS('animation-name', 'none');
  await expect(page.locator('#mission-scene-blocked img')).toHaveCSS('transition-property', 'none');
  await page.locator('#mission-scene-blocked [data-mission-image]').click();
  await expectScreenshot(page, 1);
  await page.keyboard.press('Escape');
  await expect(page.locator('#mission-scene-blocked [data-mission-image]')).toBeFocused();
});

test('after-hours projects keep their independent navigation and keyboard state', async ({ page }) => {
  await openExplorer(page);
  const stage = page.locator('[data-project-stage]');
  const tabs = stage.getByRole('tab');
  await expect(tabs).toHaveCount(4);
  await expect(stage.locator('[data-project-name-status]')).toHaveText('HomeOS');
  await tabs.nth(1).click();
  await expect(stage.locator('#project-printdeck')).toBeVisible();
  await page.keyboard.press('End');
  await expect(tabs.nth(3)).toBeFocused();
  await expect(stage.locator('#project-offgridiq')).toBeVisible();
  await expect(stage.locator('[data-project-next]')).toBeDisabled();
  await page.locator('[data-mission-tab]').nth(2).click();
  await expectScene(page, 2);
  await expect(stage.locator('[data-project-name-status]')).toHaveText('OffGridIQ');
  await stage.locator('[data-project-prev]').click();
  await expect(stage.locator('#project-bench-path')).toBeVisible();
  await expectScene(page, 2);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('all scenes, native reveals, screenshot originals, and demo links remain available', async ({ page }) => {
    await page.goto('/#projects');
    await expect(page.locator('[data-mission-reference]')).not.toHaveAttribute('open');
    await openReference(page);
    await expect(page.locator('[data-mission-tabs]')).toBeHidden();
    await expect(page.locator('[data-mission-controls]')).toBeHidden();
    await expect(page.locator('[data-mission-dialog]')).toBeHidden();
    for (const scene of scenes) {
      const panel = page.locator(`#mission-scene-${scene.id}`);
      await expect(panel).toBeVisible();
      await panel.locator('img').scrollIntoViewIfNeeded();
      await expect.poll(() => panel.locator('img').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
      const original = panel.locator('[data-mission-image]');
      await expect(original).toHaveAttribute('href', `/projects/missionboard-demo-${scene.image}.png`);
      await expect(original).toHaveAttribute('target', '_blank');
      await panel.locator('summary').click();
      await expect(panel.getByText(scene.reveal, { exact: true })).toBeVisible();
      await expect(panel.locator('.mission-try')).toBeVisible();
    }
  });
});
