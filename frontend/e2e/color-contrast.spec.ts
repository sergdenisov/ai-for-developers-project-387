import { AxeBuilder } from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

/** Waits until the page has rendered its content, so that the audit does not pass on a blank page. */
async function waitForContent(page: Page, path: string) {
  if (path === '/') {
    await expect(page.getByRole('heading', { level: 1, name: 'Календарь звонков' })).toBeVisible();
    await expect(page.getByRole('main').getByRole('link', { name: 'Записаться' })).toBeVisible();
    await expect(page.getByText('Запись открыта на 14 дней вперёд')).toBeVisible();
    return;
  }

  // The list may be empty in a fresh store or hold Event Types created by earlier scenarios in this run.
  await expect(
    page
      .getByRole('main')
      .getByText('Типов событий пока нет')
      .or(page.getByRole('main').getByRole('link').first()),
  ).toBeVisible();
}

test.describe('the text on the pages reaches WCAG AA contrast', () => {
  for (const path of ['/', '/book']) {
    test(`${path} has no color contrast violations`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.ok()).toBe(true);
      await waitForContent(page, path);

      const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
      const violations = results.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.map((node) => ({
          target: node.target,
          summary: node.failureSummary,
        })),
      }));

      expect(violations).toEqual([]);
    });
  }
});
