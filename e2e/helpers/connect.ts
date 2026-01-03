import {expect, Page} from '@playwright/test';

export async function connectToSSH(page: Page) {
  await page.goto('/');

  const host = process.env.TEST_SSH_HOST || 'localhost';
  const port = process.env.TEST_SSH_PORT || '2222';
  const username = process.env.TEST_SSH_USER || 'testuser';
  const password = process.env.TEST_SSH_PASS || 'testpass';

  await page.getByLabel('Host Address').fill(host);
  await page.getByLabel('Port').fill(port);
  await page.getByRole('textbox', {name: 'Username'}).fill(username);

  // Use more specific selector to avoid ambiguity with Password radio button
  await page.locator('input[type="password"]#password').fill(password);

  await page.getByRole('button', {name: /connect/i}).click();
  await expect(page.getByText('SSH Remote Development')).toBeVisible({
    timeout: 10000,
  });
}
