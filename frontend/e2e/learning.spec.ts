import { test, expect } from '@playwright/test'
import { TEST_COURSE } from './test-config'

test.describe('Learning Page', () => {
  test('navigate to subtopic via syllabus tree in sidebar', async ({ page }) => {
    await page.goto('/')

    // Select the course to populate sidebar tree
    await page.waitForSelector('button:has-text("בחר")', { timeout: 10000 })
    await page.getByRole('button', { name: 'בחר' }).first().click()

    // Wait for the syllabus tree to appear in sidebar
    await expect(page.getByText('קורס נבחר')).toBeVisible({ timeout: 5000 })

    // Expand the first subject in the tree
    const sidebarTree = page.locator('[class*="space-y-1"]').last()
    const firstSubject = sidebarTree.locator('button').first()
    await firstSubject.click()

    // Expand the first topic
    await page.waitForTimeout(300) // animation delay
    const topicButtons = sidebarTree.locator('button:not(:first-child)')
    if (await topicButtons.count() > 0) {
      await topicButtons.first().click()
      await page.waitForTimeout(300)

      // Click the first subtopic
      const subtopicButtons = sidebarTree.locator('button').filter({ hasText: /.+/ })
      // Find a clickable subtopic (has StatusDot before text)
      const subtopics = page.locator('[class*="hover\\:text-amber"]')
      if (await subtopics.count() > 0) {
        await subtopics.first().click()
        // Should navigate to learning page
        await expect(page).toHaveURL(/\/learn\/\d+/, { timeout: 5000 })
      }
    }
  })

  test('learning page shows phase indicator', async ({ page }) => {
    // Select course and navigate to a subtopic
    await page.goto('/')
    await page.waitForSelector('button:has-text("בחר")', { timeout: 10000 })
    await page.getByRole('button', { name: 'בחר' }).first().click()
    await expect(page.getByText('קורס נבחר')).toBeVisible({ timeout: 5000 })

    // Expand tree and click a subtopic
    const sidebarTree = page.locator('[class*="space-y-1"]').last()
    const firstSubject = sidebarTree.locator('button').first()
    await firstSubject.click()
    await page.waitForTimeout(300)

    const topicButtons = sidebarTree.locator('button:not(:first-child)')
    if (await topicButtons.count() > 0) {
      await topicButtons.first().click()
      await page.waitForTimeout(300)

      const subtopics = page.locator('[class*="hover\\:text-amber"]')
      if (await subtopics.count() > 0) {
        await subtopics.first().click()
        await expect(page).toHaveURL(/\/learn\/\d+/, { timeout: 5000 })

        // Should see Phase 1 content: "אני מלמד"
        await expect(page.getByText('אני מלמד')).toBeVisible({ timeout: 10000 })
      }
    }
  })
})
