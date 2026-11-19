import { expect, test } from '@playwright/test';

const description =
  'Календарь звонков: выберите тип события и свободное время и запишитесь на звонок без регистрации. Время московское.';

test.describe('the head of the pages', () => {
  for (const path of ['/', '/book']) {
    test(`${path} describes the app for search engines and keeps the existing tags`, async ({
      page,
    }) => {
      const response = await page.goto(path);
      expect(response?.ok()).toBe(true);

      // The static template: a crawler that does not run JavaScript still sees the tag.
      const html = (await response?.text()) ?? '';
      expect(html.match(/name="description"/g) ?? []).toHaveLength(1);

      const descriptionTag = page.locator('head meta[name="description"]');
      await expect(descriptionTag).toHaveCount(1);
      await expect(descriptionTag).toHaveAttribute('content', description);

      // The neighbouring tags stay as they are.
      await expect(page.locator('head meta[charset]')).toHaveAttribute('charset', 'UTF-8');
      await expect(page).toHaveTitle('Календарь звонков');
      const viewport = page.locator('head meta[name="viewport"]');
      await expect(viewport).toHaveCount(1);
      await expect(viewport).toHaveAttribute('content', 'width=device-width, initial-scale=1.0');
      const favicon = page.locator('head link[rel="icon"]');
      await expect(favicon).toHaveCount(1);
      await expect(favicon).toHaveAttribute('href', '/favicon.svg');
    });
  }
});
