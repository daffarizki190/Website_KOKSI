import { test, expect } from '@playwright/test';

test.describe('BelanjaIn Saza - Mobile & PWA Live Chat Verification', () => {

  test('User can open Live Chat via Header, Bottom Nav (Mobile), and Floating Action Button', async ({ page }) => {
    // 1. Set pre-authenticated or onboarding flags
    await page.addInitScript(() => {
      sessionStorage.setItem('hasSeenSplash', 'true');
      localStorage.setItem('hasSeenTourGuide', 'true');
      localStorage.setItem('hasSeenTourGuide_PWA', 'true');
      localStorage.setItem('saza_closed_modal_dismissed', 'true');
    });

    // 2. Buka halaman login
    await page.goto('/login');

    // Tunggu input no_hp muncul (setelah splash screen)
    const phoneInput = page.locator('#no_hp');
    await expect(phoneInput).toBeVisible({ timeout: 10000 });

    // 3. Login menggunakan akun demo user (Karyawan)
    await phoneInput.fill('081222333444');
    await page.locator('#password').fill('user123');
    await page.locator('button[type="submit"]').click();

    // 4. Pastikan berhasil masuk ke Dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(page.locator('text=BelanjaIn Saza').first()).toBeVisible();

    // =========================================================================
    // TEST 1: Klik Chat Admin dari HEADER (Mobile & Desktop)
    // =========================================================================
    console.log('Testing Header Chat button...');
    const headerChatBtn = page.locator('header button[title="Chat Admin"]').first();
    await expect(headerChatBtn).toBeVisible();
    await headerChatBtn.click();

    // Verifikasi Chat Modal Terbuka
    const chatModalHeader = page.locator('h2:has-text("Admin KOKSI")').first();
    await expect(chatModalHeader).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Online • Respon Cepat').first()).toBeVisible();

    // Tutup Chat Modal via tombol Kembali / Tutup
    const backBtn = page.locator('button[aria-label="Kembali"]').or(page.locator('button[title="Kembali"]')).first();
    await backBtn.click();
    await expect(chatModalHeader).not.toBeVisible({ timeout: 3000 });

    // =========================================================================
    // TEST 2: Klik Chat Admin dari BOTTOM NAVIGATION (Khusus Mobile Viewport)
    // =========================================================================
    const isMobile = page.viewportSize() ? page.viewportSize()!.width < 768 : false;
    if (isMobile) {
      console.log('Testing Mobile Bottom Navigation Chat button...');
      const bottomNavChatBtn = page.locator('nav button:has-text("Chat Admin")').first();
      await expect(bottomNavChatBtn).toBeVisible();
      await bottomNavChatBtn.click();

      // Verifikasi Chat Modal Terbuka
      await expect(chatModalHeader).toBeVisible({ timeout: 5000 });

      // Tutup modal
      const closeBtn = page.locator('button[title="Tutup"]').first();
      await closeBtn.click();
      await expect(chatModalHeader).not.toBeVisible({ timeout: 3000 });
    }

    // =========================================================================
    // TEST 3: Klik FLOATING CHAT BUTTON (Mobile & Desktop)
    // =========================================================================
    console.log('Testing Floating Action Chat button...');
    const floatingChatBtn = page.locator('button.tour-chat[title="Chat Admin"]').first();
    await expect(floatingChatBtn).toBeVisible();
    await floatingChatBtn.click();

    // Verifikasi Chat Modal Terbuka dari floating button
    await expect(chatModalHeader).toBeVisible({ timeout: 5000 });

    // Tutup modal
    await backBtn.click();
    await expect(chatModalHeader).not.toBeVisible({ timeout: 3000 });

    console.log('All Live Chat interaction tests passed successfully!');
  });
});
