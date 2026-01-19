/**
 * Playwright E2E 測試設定
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // 測試目錄
  testDir: './e2e',
  // 測試檔案模式
  testMatch: '**/*.e2e.ts',
  // 完全平行執行
  fullyParallel: true,
  // CI 環境下不允許 test.only
  forbidOnly: !!process.env['CI'],
  // CI 環境下失敗重試次數
  retries: process.env['CI'] ? 2 : 0,
  // 平行工作者數量
  workers: process.env['CI'] ? 1 : undefined,
  // 報告格式
  reporter: 'html',
  // 全域設定
  use: {
    // 基礎 URL
    baseURL: 'http://localhost:4200',
    // 失敗時截圖
    screenshot: 'only-on-failure',
    // 追蹤
    trace: 'on-first-retry',
  },
  // 瀏覽器設定
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // 平板測試
    {
      name: 'tablet',
      use: { ...devices['iPad Pro 11'] },
    },
  ],
  // 開發伺服器
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120000,
  },
});
