import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  timeout: 30000,
  expect: {
    timeout: 10000
  },
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'ui',
      testDir: '.features-gen/tests',
      use: {
        ...devices['Desktop Chrome']
      }
    }
  ]
});