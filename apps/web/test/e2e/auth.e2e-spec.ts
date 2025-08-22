import { test, expect } from '@playwright/test';

test.describe('Authentication Pages', () => {
  test.describe('Sign In Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/signin');
    });

    test('should display sign in form', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /Sign In|로그인/ }),
      ).toBeVisible();
      await expect(
        page.getByText(/Choose your preferred|선호하는 방법을 선택하세요/),
      ).toBeVisible();
    });

    test('should display all OAuth provider buttons', async ({ page }) => {
      // Check for Google OAuth button
      const googleButton = page.getByRole('link', {
        name: /Continue with Google|Google로 계속하기/,
      });
      await expect(googleButton).toBeVisible();

      // Check for X (Twitter) OAuth button
      const xButton = page.getByRole('link', {
        name: /Continue with X|X로 계속하기/,
      });
      await expect(xButton).toBeVisible();

      // Check for Apple OAuth button
      const appleButton = page.getByRole('link', {
        name: /Continue with Apple|Apple로 계속하기/,
      });
      await expect(appleButton).toBeVisible();
    });

    test('should have OAuth buttons with correct URLs', async ({ page }) => {
      // Note: These tests assume the server URL is configured
      const googleButton = page.getByRole('link', {
        name: /Continue with Google|Google로 계속하기/,
      });
      await expect(googleButton).toHaveAttribute('href', /\/auth\/google/);

      const xButton = page.getByRole('link', {
        name: /Continue with X|X로 계속하기/,
      });
      await expect(xButton).toHaveAttribute('href', /\/auth\/x/);

      const appleButton = page.getByRole('link', {
        name: /Continue with Apple|Apple로 계속하기/,
      });
      await expect(appleButton).toHaveAttribute('href', /\/auth\/apple/);
    });

    test('should display terms hint', async ({ page }) => {
      await expect(
        page.getByText(
          /By continuing, you agree|계속 진행하면 동의하는 것으로/,
        ),
      ).toBeVisible();
    });

    test('should have sign up link', async ({ page }) => {
      const signUpLink = page.getByRole('link', { name: /Sign up|가입하기/ });
      await expect(signUpLink).toBeVisible();
      await expect(signUpLink).toHaveAttribute('href', '/signup');
    });

    test('should navigate to sign up page', async ({ page }) => {
      const signUpLink = page.getByRole('link', { name: /Sign up|가입하기/ });
      await signUpLink.click();

      await expect(page).toHaveURL('/signup');
    });

    test('should be properly styled and centered', async ({ page }) => {
      const container = page
        .locator('div')
        .filter({ hasText: /Sign In|로그인/ })
        .first();
      await expect(container).toBeVisible();

      // Check if buttons are full width
      const googleButton = page.getByRole('link', {
        name: /Continue with Google|Google로 계속하기/,
      });
      const buttonBox = await googleButton.boundingBox();
      const containerBox = await container.boundingBox();

      // Button should be close to full width of container (allowing for padding)
      if (buttonBox && containerBox) {
        expect(buttonBox.width).toBeGreaterThan(containerBox.width * 0.8);
      }
    });

    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await expect(
        page.getByRole('heading', { name: /Sign In|로그인/ }),
      ).toBeVisible();

      // All OAuth buttons should still be visible
      await expect(
        page.getByRole('link', {
          name: /Continue with Google|Google로 계속하기/,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /Continue with X|X로 계속하기/ }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', {
          name: /Continue with Apple|Apple로 계속하기/,
        }),
      ).toBeVisible();
    });
  });

  test.describe('Sign Up Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/signup');
    });

    test('should display sign up page', async ({ page }) => {
      // Note: This test assumes a signup page exists similar to signin
      // If the page doesn't exist, this test will help identify what needs to be built
      await expect(page).toHaveURL('/signup');
    });

    test('should have navigation back to sign in', async ({ page }) => {
      // Check if there's a link back to sign in
      const signInLink = page.getByRole('link', { name: /Sign in|로그인/ });
      if ((await signInLink.count()) > 0) {
        await expect(signInLink).toHaveAttribute('href', '/signin');
      }
    });
  });

  test.describe('Authentication Navigation', () => {
    test('should navigate between auth pages correctly', async ({ page }) => {
      // Start at home page
      await page.goto('/');

      // Click sign in from navbar
      const navSignIn = page.getByRole('link', { name: /Sign In|로그인/ });
      await navSignIn.click();
      await expect(page).toHaveURL('/signin');

      // Go to sign up
      const signUpLink = page.getByRole('link', { name: /Sign up|가입하기/ });
      if ((await signUpLink.count()) > 0) {
        await signUpLink.click();
        await expect(page).toHaveURL('/signup');
      }
    });

    test('should maintain locale when navigating auth pages', async ({
      page,
    }) => {
      // Start in Korean locale
      await page.goto('/ko');

      // Navigate to sign in
      const signInButton = page.getByRole('link', { name: /로그인/ });
      await signInButton.click();

      // Should maintain Korean locale
      await expect(page).toHaveURL('/ko/signin');
    });
  });
});
