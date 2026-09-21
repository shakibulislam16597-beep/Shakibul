import { test, expect } from '@playwright/test';

test.describe('Storefront & Admin Verification', () => {
  test('Storefront Home renders without crashing', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await expect(page.locator('text=Extrovat')).toBeVisible();
    await page.screenshot({ path: '/home/jules/verification/screenshots/storefront_home_offline.png' });
  });

  test('#/track page renders without crashing', async ({ page }) => {
    await page.goto('http://localhost:3000/#/track');
    await expect(page.locator('text=Track your Extrovat order')).toBeVisible();
    await page.screenshot({ path: '/home/jules/verification/screenshots/track_order_offline.png' });
  });

  test('#/admin/login page renders without crashing', async ({ page }) => {
    await page.goto('http://localhost:3000/#/admin/login');
    await expect(page.locator('text=EXTROVAT ADMIN')).toBeVisible();
    await page.screenshot({ path: '/home/jules/verification/screenshots/admin_login_offline.png' });
  });
});
