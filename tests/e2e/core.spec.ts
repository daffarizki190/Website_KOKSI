import { test, expect } from '@playwright/test';

test.describe('Critical User Journeys', () => {
  // Test Happy Path
  test('User can login, add item to cart, and checkout', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByTestId('input-phone').fill('081222333444');
    await page.getByTestId('input-password').fill('user123');
    await page.getByTestId('btn-login').click();

    // Verify Dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Core Action: Add to cart
    await page.getByTestId('btn-add-to-cart-first').click();
    
    // Open Cart & Checkout
    await page.getByTestId('btn-open-cart').click();
    await page.getByTestId('btn-checkout').click();
    
    // Payment / Confirmation
    await expect(page.getByTestId('success-message')).toBeVisible();
    
    // Logout
    await page.getByTestId('btn-profile').click();
    await page.getByTestId('btn-logout').click();
    await expect(page).toHaveURL('/login');
  });

  // Test Failure State
  test('Shows error on invalid login', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('input-phone').fill('081222333444');
    await page.getByTestId('input-password').fill('wrongpassword');
    await page.getByTestId('btn-login').click();
    
    await expect(page.getByTestId('error-message')).toBeVisible();
  });
});
