import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'chromium-mobile', use: { ...devices['Pixel 5'] } },
  ],
  webServer: [
    {
      command: 'npm run dev',
      cwd: '..',
      url: 'http://localhost:3000/health',
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'NEXT_PUBLIC_API_URL=http://127.0.0.1:3000/api/v1 npm run dev -- --hostname 127.0.0.1 --port 3001',
      cwd: '.',
      url: 'http://localhost:3001/login',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
