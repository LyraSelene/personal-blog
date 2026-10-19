import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  globalSetup: './tests/setup.ts',
  timeout: 120000,
  expect: { timeout: 10000 },
  workers: 1,
  reporter: 'list',
  use: { baseURL: `http://127.0.0.1:4323${process.env.SITE_BASE_PATH || '/'}`, headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined },
});
