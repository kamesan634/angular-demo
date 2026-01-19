/**
 * 登入流程 E2E 測試
 */
import { test, expect } from '@playwright/test';

test.describe('登入功能', () => {
  test.beforeEach(async ({ page }) => {
    // 前往登入頁面
    await page.goto('/auth/login');
  });

  test('應該顯示登入表單', async ({ page }) => {
    // 檢查頁面標題
    await expect(page.locator('h1')).toContainText('零售 ERP 系統');

    // 檢查表單元素
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password-input')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('空白表單提交時應該顯示錯誤訊息', async ({ page }) => {
    // 點擊登入按鈕
    await page.click('button[type="submit"]');

    // 檢查錯誤訊息
    await expect(page.locator('.p-error')).toBeVisible();
  });

  test('輸入錯誤密碼時應該顯示錯誤訊息', async ({ page }) => {
    // 填入錯誤的帳號密碼
    await page.fill('#username', 'admin');
    await page.fill('#password-input', 'wrongpassword');

    // 點擊登入按鈕
    await page.click('button[type="submit"]');

    // 等待 API 回應並檢查錯誤訊息
    await expect(page.locator('.p-message-error')).toBeVisible({ timeout: 10000 });
  });

  test('成功登入後應該導向儀表板', async ({ page }) => {
    // 填入正確的帳號密碼 (測試帳號)
    await page.fill('#username', 'admin');
    await page.fill('#password-input', 'password123');

    // 點擊登入按鈕
    await page.click('button[type="submit"]');

    // 等待導向儀表板
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // 檢查是否在儀表板頁面
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('忘記密碼連結應該正常運作', async ({ page }) => {
    // 點擊忘記密碼連結
    await page.click('a[href="/auth/forgot-password"]');

    // 檢查是否導向忘記密碼頁面
    await expect(page).toHaveURL(/.*forgot-password/);
  });
});

test.describe('已登入使用者', () => {
  test.beforeEach(async ({ page, context }) => {
    // 模擬已登入狀態 (設定 token)
    await context.addInitScript(() => {
      localStorage.setItem('access_token', 'mock-token');
      localStorage.setItem('refresh_token', 'mock-refresh-token');
      localStorage.setItem('token_expires_at', String(Date.now() + 3600000));
    });
  });

  test('已登入使用者訪問登入頁應該被導向儀表板', async ({ page }) => {
    await page.goto('/auth/login');

    // 應該被導向儀表板
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
