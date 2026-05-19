const { test, expect } = require('@playwright/test');

test.describe('End-to-End User Journeys', () => {
  test('Landing Page to Player Profile to Dashboard', async ({ page }) => {
    // 1. Navigate to Landing Page
    await page.goto('/');
    await expect(page).toHaveTitle(/Deadlock AfterMatch/);

    // 2. Locate the search input and search for a valid Steam ID
    // Note: We use a known public Steam ID or a stubbed test account.
    // Assuming 1743346546 is a valid test ID that returns matches.
    const searchInput = page.getByPlaceholder('Enter Steam URL, ID, or vanity name...');
    await searchInput.fill('1743346546');
    
    // 3. Submit the search
    await page.keyboard.press('Enter');

    // 4. Validate navigation to Player Profile
    await expect(page).toHaveURL(/\/matches\/1743346546/);
    await expect(page.locator('text=Ritual Case Files')).toBeVisible();

    // 5. Wait for matches to load
    const matchRow = page.locator('.card-amber').first();
    await matchRow.waitFor({ state: 'visible', timeout: 10000 });

    // 6. Click the first match to open the Dashboard
    await matchRow.click();

    // 7. Validate Dashboard navigation
    await expect(page).toHaveURL(/\/dashboard\/\d+\/1743346546/);
    
    // 8. Wait for analysis to complete and grade to render
    await expect(page.locator('.text-8xl')).toBeVisible({ timeout: 15000 });
  });

  test('FAQ Page Rendering', async ({ page }) => {
    await page.goto('/faq');
    await expect(page.locator('h1')).toContainText('FAQ');
    // Verify dynamic stats injected by API
    await expect(page.locator('text=Souls Per Minute')).toBeVisible();
  });
});
