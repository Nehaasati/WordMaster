import { createBdd } from 'playwright-bdd';

const { When, Then } = createBdd();

When('the host leaves the lobby', async () => {
  // implement later or UI click
});

Then('the guest should become the new host', async () => {});

Then('the lobby should allow adding a bot or inviting a new player', async () => {});

When('the guest leaves the lobby', async () => {});

Then('the guest should be removed', async () => {});

Then('the host should remain', async () => {});