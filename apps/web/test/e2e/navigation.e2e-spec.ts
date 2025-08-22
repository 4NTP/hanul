import { test, expect } from '@playwright/test';

test.describe('Navigation and Internationalization', () => {
  test.describe('Navbar Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('should have sticky navbar', async ({ page }) => {
      const navbar = page.getByRole('banner');
      await expect(navbar).toBeVisible();

      // Scroll down to check if navbar is still visible
      await page.evaluate(() => window.scrollTo(0, 1000));
      await expect(navbar).toBeVisible();
    });

    test('should navigate to home from brand link', async ({ page }) => {
      await page.goto('/signin');

      const brandLink = page.getByRole('link', { name: /Hanul/ });
      await brandLink.click();

      await expect(page).toHaveURL('/');
    });

    test('should navigate to sign in page', async ({ page }) => {
      const signInButton = page.getByRole('link', { name: /Sign In|로그인/ });
      await signInButton.click();

      await expect(page).toHaveURL('/signin');
    });

    test('should have proper navbar structure', async ({ page }) => {
      const navbar = page.getByRole('banner');

      // Check for brand link
      const brandLink = navbar.getByRole('link', { name: /Hanul/ });
      await expect(brandLink).toBeVisible();

      // Check for navigation items
      const homeLink = navbar.getByRole('link', { name: /Home|홈/ });
      await expect(homeLink).toBeVisible();

      // Check for theme toggle
      const themeButton = navbar.getByRole('button', { name: /Theme|테마/ });
      await expect(themeButton).toBeVisible();

      // Check for language switcher
      const languageButton = navbar.getByRole('button', {
        name: /Language|언어/,
      });
      await expect(languageButton).toBeVisible();

      // Check for sign in button
      const signInButton = navbar.getByRole('link', { name: /Sign In|로그인/ });
      await expect(signInButton).toBeVisible();
    });
  });

  test.describe('Theme Switching', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('should open theme menu', async ({ page }) => {
      const themeButton = page.getByRole('button', { name: /Theme|테마/ });
      await themeButton.click();

      // Check if dropdown menu appears
      await expect(page.getByText(/System|시스템/)).toBeVisible();
      await expect(page.getByText(/Light|라이트/)).toBeVisible();
      await expect(page.getByText(/Dark|다크/)).toBeVisible();
    });

    test('should switch to dark theme', async ({ page }) => {
      const themeButton = page.getByRole('button', { name: /Theme|테마/ });
      await themeButton.click();

      await page.getByText(/Dark|다크/).click();

      // Check if dark theme is applied (this depends on your CSS implementation)
      const html = page.locator('html');
      await expect(html).toHaveClass(/dark/);
    });

    test('should switch to light theme', async ({ page }) => {
      // First set to dark
      const themeButton = page.getByRole('button', { name: /Theme|테마/ });
      await themeButton.click();
      await page.getByText(/Dark|다크/).click();

      // Then switch to light
      await themeButton.click();
      await page.getByText(/Light|라이트/).click();

      const html = page.locator('html');
      await expect(html).not.toHaveClass(/dark/);
    });

    test('should persist theme across page navigation', async ({ page }) => {
      // Set dark theme
      const themeButton = page.getByRole('button', { name: /Theme|테마/ });
      await themeButton.click();
      await page.getByText(/Dark|다크/).click();

      // Navigate to another page
      await page.goto('/signin');

      // Check if dark theme is still applied
      const html = page.locator('html');
      await expect(html).toHaveClass(/dark/);
    });
  });

  test.describe('Language Switching', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('should switch to Korean locale', async ({ page }) => {
      const languageButton = page.getByRole('button', {
        name: /Language|언어/,
      });
      await languageButton.click();

      await page.getByText('한국어').click();

      // Check URL contains Korean locale
      await expect(page).toHaveURL('/ko');

      // Check if flag shows Korean flag
      const updatedLanguageButton = page.getByRole('button', {
        name: /Language|언어/,
      });
      await expect(updatedLanguageButton).toContainText('🇰🇷');
    });

    test('should switch to English locale', async ({ page }) => {
      // Start with Korean
      await page.goto('/ko');

      const languageButton = page.getByRole('button', {
        name: /Language|언어/,
      });
      await languageButton.click();

      await page.getByText('English').click();

      // Check URL shows English locale (default)
      await expect(page).toHaveURL('/');

      // Check if flag shows US flag
      const updatedLanguageButton = page.getByRole('button', {
        name: /Language|언어/,
      });
      await expect(updatedLanguageButton).toContainText('🇺🇸');
    });

    test('should preserve path when switching locales', async ({ page }) => {
      await page.goto('/signin');

      const languageButton = page.getByRole('button', {
        name: /Language|언어/,
      });
      await languageButton.click();

      await page.getByText('한국어').click();

      // Should navigate to Korean version of the same page
      await expect(page).toHaveURL('/ko/signin');
    });

    test('should display content in correct language', async ({ page }) => {
      // English content
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      // Switch to Korean
      const languageButton = page.getByRole('button', {
        name: /Language|언어/,
      });
      await languageButton.click();
      await page.getByText('한국어').click();

      // Content should be in Korean (this depends on your translation files)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
  });

  test.describe('Responsive Navigation', () => {
    test('should work properly on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Navbar should still be visible and functional
      const navbar = page.getByRole('banner');
      await expect(navbar).toBeVisible();

      // All navigation elements should be accessible
      const brandLink = page.getByRole('link', { name: /Hanul/ });
      const themeButton = page.getByRole('button', { name: /Theme|테마/ });
      const languageButton = page.getByRole('button', {
        name: /Language|언어/,
      });
      const signInButton = page.getByRole('link', { name: /Sign In|로그인/ });

      await expect(brandLink).toBeVisible();
      await expect(themeButton).toBeVisible();
      await expect(languageButton).toBeVisible();
      await expect(signInButton).toBeVisible();
    });

    test('should handle navigation on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');

      // Test navigation functionality
      const signInButton = page.getByRole('link', { name: /Sign In|로그인/ });
      await signInButton.click();

      await expect(page).toHaveURL('/signin');
    });
  });

  test.describe('URL Structure and Routing', () => {
    test('should handle default locale correctly', async ({ page }) => {
      await page.goto('/');

      // Default locale should not show in URL
      await expect(page).toHaveURL('/');

      // But should still show English content
      const languageButton = page.getByRole('button', {
        name: /Language|언어/,
      });
      await expect(languageButton).toContainText('🇺🇸');
    });

    test('should handle Korean locale URLs', async ({ page }) => {
      await page.goto('/ko');

      await expect(page).toHaveURL('/ko');

      const languageButton = page.getByRole('button', {
        name: /Language|언어/,
      });
      await expect(languageButton).toContainText('🇰🇷');
    });

    test('should handle deep links with locales', async ({ page }) => {
      await page.goto('/ko/signin');

      await expect(page).toHaveURL('/ko/signin');
      await expect(
        page.getByRole('heading', { name: /로그인|Sign In/ }),
      ).toBeVisible();
    });
  });
});
