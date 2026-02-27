import { test, expect } from '@playwright/test'
import { TEST_USER } from './test-config'

test.describe('Navigation', () => {
  test('sidebar lobby link works', async ({ page }) => {
    await page.goto('/syllabus/new')
    // Click the lobby link in sidebar
    await page.getByText('חזרה ללובי').first().click()
    await expect(page).toHaveURL('/', { timeout: 5000 })
  })

  test('sidebar shows user name', async ({ page }) => {
    await page.goto('/')
    // User name should be visible in sidebar (desktop)
    await expect(page.getByText(TEST_USER.name, { exact: true })).toBeVisible()
  })

  test('sidebar logout button works', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'התנתקות' }).click()
    await expect(page).toHaveURL('/auth', { timeout: 5000 })
  })

  test('protected routes redirect when not authenticated', async ({ browser }) => {
    // Use fresh context without any stored auth state
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    const page = await context.newPage()

    await page.goto('http://localhost:5173/')
    await expect(page).toHaveURL(/\/auth/, { timeout: 10000 })

    await page.goto('http://localhost:5173/syllabus/new')
    await expect(page).toHaveURL(/\/auth/, { timeout: 10000 })

    await page.goto('http://localhost:5173/syllabus/edit/1')
    await expect(page).toHaveURL(/\/auth/, { timeout: 10000 })

    await context.close()
  })
})

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 812 } }) // iPhone X

  test('hamburger menu opens sidebar on mobile', async ({ page }) => {
    await page.goto('/')

    // Sidebar should be hidden initially on mobile
    await expect(page.getByText('מורה חכם').first()).toBeVisible()

    // Click hamburger menu
    const hamburger = page.locator('button').filter({
      has: page.locator('svg path[d*="M4 6h16M4 12h16M4 18h16"]'),
    })
    await hamburger.click()

    // Sidebar content should now be visible
    await expect(page.getByText(TEST_USER.name, { exact: true })).toBeVisible({ timeout: 3000 })
    await expect(page.getByText('חזרה ללובי')).toBeVisible()
  })
})
