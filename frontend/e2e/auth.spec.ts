import { test, expect } from '@playwright/test'
import { TEST_USER } from './test-config'

test.describe('Auth Page', () => {
  test.use({ storageState: { cookies: [], origins: [] } }) // unauthenticated

  test('shows login form by default', async ({ page }) => {
    await page.goto('/auth')
    await expect(page.getByText('מורה חכם')).toBeVisible()
    await expect(page.getByPlaceholder('your_username')).toBeVisible()
    await expect(page.getByPlaceholder('••••••••')).toBeVisible()
    await expect(page.locator('form').getByRole('button', { name: 'כניסה' })).toBeVisible()
  })

  test('switches to register tab', async ({ page }) => {
    await page.goto('/auth')
    // Click the "הרשמה" tab (not form submit)
    await page.locator('button').filter({ hasText: 'הרשמה' }).first().click()
    // Register form has a "שם מלא" field
    await expect(page.getByText('שם מלא')).toBeVisible()
    await expect(page.locator('form').getByRole('button', { name: 'הרשמה' })).toBeVisible()
  })

  test('login with valid credentials redirects to lobby', async ({ page }) => {
    await page.goto('/auth')
    await page.getByPlaceholder('your_username').fill(TEST_USER.username)
    await page.getByPlaceholder('••••••••').fill(TEST_USER.password)
    await page.locator('form').getByRole('button', { name: 'כניסה' }).click()

    await expect(page).toHaveURL('/', { timeout: 10000 })
    await expect(page.getByRole('heading', { name: new RegExp(TEST_USER.name) })).toBeVisible()
  })

  test('login with wrong password shows error', async ({ page }) => {
    await page.goto('/auth')
    // Ensure login tab is active
    await page.locator('button').filter({ hasText: 'כניסה' }).first().click()
    await page.getByPlaceholder('your_username').fill(TEST_USER.username)
    await page.getByPlaceholder('••••••••').fill('wrongpassword')
    await page.locator('form').getByRole('button', { name: 'כניסה' }).click()

    await expect(page.getByText('שם משתמש או סיסמה שגויים')).toBeVisible({ timeout: 10000 })
  })

  test('unauthenticated user is redirected to /auth', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/auth', { timeout: 5000 })
  })
})
