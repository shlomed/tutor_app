import { test, expect } from '@playwright/test'

/**
 * Helper: from the lobby, click "בחר" on the first course to navigate to its CoursePage,
 * then expand the first subject and first topic in the course tree.
 * Returns a locator for the subtopic buttons inside the expanded topic.
 */
async function navigateToCourseTree(page: import('@playwright/test').Page) {
  await page.goto('/')

  // Click "בחר" on the first course → navigates to /course/:id
  await page.waitForSelector('button:has-text("בחר")', { timeout: 10000 })
  await page.getByRole('button', { name: 'בחר' }).first().click()
  await expect(page).toHaveURL(/\/course\/\d+/, { timeout: 5000 })

  // Wait for the course tree to load
  const courseTree = page.getByTestId('course-tree')
  await expect(courseTree).toBeVisible({ timeout: 10000 })

  // Expand the first subject
  const firstSubject = courseTree.locator('[data-testid^="subject-"]').first()
  await firstSubject.click()
  await page.waitForTimeout(300)

  // Expand the first topic
  const firstTopic = courseTree.locator('[data-testid^="topic-"]').first()
  await expect(firstTopic).toBeVisible({ timeout: 3000 })
  await firstTopic.click()
  await page.waitForTimeout(300)

  // Return subtopic button locator
  const subtopics = courseTree.locator('[data-testid^="subtopic-"]')
  return { courseTree, subtopics }
}

test.describe('Learning Page', () => {
  test('navigate to subtopic via course page tree', async ({ page }) => {
    const { subtopics } = await navigateToCourseTree(page)

    const count = await subtopics.count()
    if (count === 0) {
      test.skip()
      return
    }

    await subtopics.first().click()
    await expect(page).toHaveURL(/\/learn\/\d+/, { timeout: 5000 })
  })

  test('learning page shows phase indicator', async ({ page }) => {
    const { subtopics } = await navigateToCourseTree(page)

    const count = await subtopics.count()
    if (count === 0) {
      test.skip()
      return
    }

    await subtopics.first().click()
    await expect(page).toHaveURL(/\/learn\/\d+/, { timeout: 5000 })
    await expect(page.getByText('אני מלמד')).toBeVisible({ timeout: 10000 })
  })

  test('each subtopic shows its own name — no stale content cache', async ({ page }) => {
    // Regression test: navigating between subtopics must clear the I-Do content cache.
    // Bug was: setCurrentSubtopic() didn't clear iDoContent in the Zustand store,
    // so the second subtopic always showed the first one's lesson.
    const { subtopics } = await navigateToCourseTree(page)

    const subtopicCount = await subtopics.count()
    if (subtopicCount < 2) {
      test.skip() // need at least 2 subtopics to verify cache clearing
      return
    }

    // Get the names of the first two subtopics from the course tree
    const firstName = (await subtopics.nth(0).locator('span').first().textContent() ?? '').trim()
    const secondName = (await subtopics.nth(1).locator('span').first().textContent() ?? '').trim()

    // If both subtopics have the same name (unlikely but defensive), skip
    if (!firstName || !secondName || secondName === firstName) {
      test.skip()
      return
    }

    // ── Navigate to FIRST subtopic ───────────────────────────────────────
    await subtopics.nth(0).click()
    await expect(page).toHaveURL(/\/learn\/\d+/, { timeout: 5000 })

    // The subtopic name appears in the phase header
    await expect(page.getByText(firstName, { exact: true }).first()).toBeVisible({ timeout: 5000 })

    // ── Navigate back to the course page ─────────────────────────────────
    await page.goBack()
    await expect(page).toHaveURL(/\/course\/\d+/, { timeout: 5000 })

    // Re-expand the tree (local state resets on remount)
    const courseTree2 = page.getByTestId('course-tree')
    await expect(courseTree2).toBeVisible({ timeout: 10000 })
    await courseTree2.locator('[data-testid^="subject-"]').first().click()
    await page.waitForTimeout(300)
    await courseTree2.locator('[data-testid^="topic-"]').first().click()
    await page.waitForTimeout(300)

    // ── Navigate to SECOND subtopic ──────────────────────────────────────
    const subtopicsAfterBack = courseTree2.locator('[data-testid^="subtopic-"]')
    await subtopicsAfterBack.nth(1).click()
    await expect(page).toHaveURL(/\/learn\/\d+/, { timeout: 5000 })

    // MUST show the second subtopic's name — NOT the first one
    await expect(page.getByText(secondName, { exact: true }).first()).toBeVisible({ timeout: 5000 })
  })
})
