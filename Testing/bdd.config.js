import { defineBddConfig } from 'playwright-bdd';

export default defineBddConfig({
  features: 'e2e/features/**/*.feature',
  steps: ['e2e/steps/**/*.js'],
  outputDir: '.features-gen/tests'
});