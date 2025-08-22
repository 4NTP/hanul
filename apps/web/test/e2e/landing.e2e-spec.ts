import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the main heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should display the badge with status indicator', async ({ page }) => {
    const badge = page
      .locator('span')
      .filter({ hasText: /Now Available|지금 사용 가능/ });
    await expect(badge).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    // Test brand link
    const brandLink = page.getByRole('link', { name: /Hanul/ });
    await expect(brandLink).toBeVisible();
    await expect(brandLink).toHaveAttribute('href', '/');

    // Test home link in navbar
    const homeLink = page.getByRole('link', { name: /Home|홈/ });
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toHaveAttribute('href', '/');
  });

  test('should have working CTA buttons', async ({ page }) => {
    // Primary CTA button should link to sign in
    const primaryCTA = page.getByRole('link', { name: /Get Started|시작하기/ });
    await expect(primaryCTA).toBeVisible();
    await expect(primaryCTA).toHaveAttribute('href', '/signin');

    // Secondary CTA button
    const secondaryCTA = page.getByRole('link', {
      name: /Learn More|자세히 알아보기/,
    });
    await expect(secondaryCTA).toBeVisible();
    await expect(secondaryCTA).toHaveAttribute('href', '/');
  });

  test('should navigate to sign in page when clicking Get Started', async ({
    page,
  }) => {
    const getStartedButton = page.getByRole('link', {
      name: /Get Started|시작하기/,
    });
    await getStartedButton.click();

    await expect(page).toHaveURL('/signin');
    await expect(
      page.getByRole('heading', { name: /Sign In|로그인/ }),
    ).toBeVisible();
  });

  test('should have theme toggle functionality', async ({ page }) => {
    const themeButton = page.getByRole('button', { name: /Theme|테마/ });
    await expect(themeButton).toBeVisible();

    // Click to open theme menu
    await themeButton.click();

    // Check for theme options
    await expect(page.getByText(/System|시스템/)).toBeVisible();
    await expect(page.getByText(/Light|라이트/)).toBeVisible();
    await expect(page.getByText(/Dark|다크/)).toBeVisible();
  });

  test('should have language switcher functionality', async ({ page }) => {
    const languageButton = page.getByRole('button', { name: /Language|언어/ });
    await expect(languageButton).toBeVisible();

    // Click to open language menu
    await languageButton.click();

    // Check for language options
    await expect(page.getByText(/English/)).toBeVisible();
    await expect(page.getByText(/한국어/)).toBeVisible();
  });

  test('should switch language correctly', async ({ page }) => {
    const languageButton = page.getByRole('button', { name: /Language|언어/ });
    await languageButton.click();

    // Switch to Korean
    await page.getByText('한국어').click();

    // Check if URL contains Korean locale
    await expect(page).toHaveURL('/ko');

    // Check if content is in Korean
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check if main elements are still visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Get Started|시작하기/ }),
    ).toBeVisible();

    // Check if navbar is properly displayed
    const navbar = page.getByRole('banner');
    await expect(navbar).toBeVisible();
  });

  test('should have proper meta tags', async ({ page }) => {
    // Check for viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
  });
});
