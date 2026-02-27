import { test, expect } from '@playwright/test'
import { TEST_USER } from './test-config'

test.describe('Lobby Page', () => {
  test('shows welcome message with user name', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(`שלום, ${TEST_USER.name}!`)).toBeVisible()
    await expect(page.getByText('ברוכים הבאים חזרה')).toBeVisible()
  })

  test('displays course cards', async ({ page }) => {
    await page.goto('/')
    // Wait for courses to load
    await page.waitForSelector('[class*="rounded-xl"][class*="border-2"]', { timeout: 10000 })
    // At least one course card should be visible
    const cards = page.locator('[class*="rounded-xl"][class*="border-2"]')
    await expect(cards.first()).toBeVisible()
  })

  test('"בחר" button selects course and shows sidebar tree', async ({ page }) => {
    await page.goto('/')
    // Wait for course cards
    await page.waitForSelector('button:has-text("בחר")', { timeout: 10000 })

    // Click the select button on the first course
    await page.getByRole('button', { name: 'בחר' }).first().click()

    // Sidebar should now show "קורס נבחר" and the syllabus tree
    await expect(page.getByText('קורס נבחר')).toBeVisible({ timeout: 5000 })
  })

  test('"הוספת קורס חדש" button navigates to syllabus input', async ({ page }) => {
    await page.goto('/')
    await page.getByText('הוספת קורס חדש').click()
    await expect(page).toHaveURL('/syllabus/new', { timeout: 5000 })
  })

  test('"ערוך" button navigates to syllabus edit page', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('button:has-text("ערוך")', { timeout: 10000 })
    await page.getByRole('button', { name: 'ערוך' }).first().click()
    await expect(page).toHaveURL(/\/syllabus\/edit\/\d+/, { timeout: 5000 })
  })
})
