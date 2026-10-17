import { defineConfig } from '@playwright/test';

const defaultBaseURL = 'http://127.0.0.1:4176';
const baseURL = process.env.PORTFOLIO_BASE_URL || defaultBaseURL;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 7_500 },
  reporter: 'list',
  use: {
    baseURL,
    browserName: 'chromium',
    viewport: { width: 1440, height: 1000 },
    serviceWorkers: 'block',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    launchOptions: executablePath ? { executablePath } : {},
  },
  webServer: baseURL === defaultBaseURL ? {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4176',
    url: defaultBaseURL,
    reuseExistingServer: !process.env.CI,
  } : undefined,
});
