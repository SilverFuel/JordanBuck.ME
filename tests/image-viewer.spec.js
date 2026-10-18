import { test, expect } from './portfolio-test.js';

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
  test(`case-study viewer zoom, scrolling, Escape and focus return at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/#projects');
    const opener = page.locator('[data-image-preview]');
    const dialog = page.locator('[data-image-viewer]');
    const canvas = dialog.locator('[data-image-canvas]');
    const zoom = dialog.locator('[data-image-zoom]');
    await opener.click();
    await expect(dialog).toBeVisible();
    await expect.poll(() => dialog.locator('img').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
    await zoom.click();
    await expect(zoom).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas).toBeFocused();
    await canvas.press('ArrowDown');
    await expect.poll(() => canvas.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
    await canvas.press('ArrowRight');
    await expect.poll(() => canvas.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
    await canvas.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
    await expect(page.locator('body')).not.toHaveClass(/image-viewer-open/);
    await opener.press('Enter');
    await expect(dialog).toBeVisible();
    await expect(zoom).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(() => canvas.evaluate(element => element.scrollTop + element.scrollLeft)).toBe(0);
    await dialog.getByRole('button', { name: 'Close image', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });
}
