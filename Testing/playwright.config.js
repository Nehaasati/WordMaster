import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const uiTestDir = defineBddConfig({
  features: 'e2e/features/**/*.feature',
  steps: ['e2e/steps/**/*.js', 'e2e/pages/**/*.js'],
  outputDir: '.features-gen/ui'
});

export default defineConfig({
  timeout: 30000,
  expect: {
    timeout: 10000
  },
  reporter: [['list']],
  workers: 1, // Run tests sequentially
  use: {
    baseURL: 'http://localhost:5024',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: false
  },
  projects: [
    {
      name: 'ui',
      testDir: uiTestDir,
      use: {
        ...devices['Desktop Chrome']
      }
    }
  ]
});