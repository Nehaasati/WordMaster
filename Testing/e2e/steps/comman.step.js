import { createBdd } from 'playwright-bdd';

const { Given } = createBdd();

// ONLY PLACE FOR THIS STEP
Given('the backend is running', async () => {
  // backend assumed running (no UI action needed)
});