import { test, expect } from '@playwright/test'
import { TEST_COURSE } from './test-config'

test.describe('Syllabus Edit Page', () => {
  test('loads and shows syllabus table', async ({ page }) => {
    await page.goto(`/syllabus/edit/${TEST_COURSE.id}`)
    // Should see the inline edit tab and table headers
    await expect(page.getByText('עריכת סילבוס')).toBeVisible()
    await expect(page.getByText('עריכה ישירה')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'מקצוע' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'נושא', exact: true })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'תת-נושא' })).toBeVisible()
  })

  test('course name input is visible and editable', async ({ page }) => {
    await page.goto(`/syllabus/edit/${TEST_COURSE.id}`)
    const nameInput = page.getByTestId('course-name-input')
    await expect(nameInput).toBeVisible({ timeout: 10000 })
    // Should have the current course name
    await expect(nameInput).not.toHaveValue('')
  })

  test('rename course and verify', async ({ page }) => {
    await page.goto(`/syllabus/edit/${TEST_COURSE.id}`)
    const nameInput = page.getByTestId('course-name-input')
    await expect(nameInput).toBeVisible({ timeout: 10000 })

    // Clear and type new name
    await nameInput.clear()
    await nameInput.fill(TEST_COURSE.newName)

    // Save button should be enabled
    const saveBtn = page.getByTestId('save-course-name-btn')
    await expect(saveBtn).toBeEnabled()
    await saveBtn.click()

    // Should see success message
    await expect(page.getByText('פרטי הקורס עודכנו בהצלחה')).toBeVisible({ timeout: 5000 })

    // Navigate to lobby and verify the course name changed
    await page.goto('/')
    await expect(page.getByText(TEST_COURSE.newName)).toBeVisible({ timeout: 10000 })
  })

  test('edit subject name inline', async ({ page }) => {
    await page.goto(`/syllabus/edit/${TEST_COURSE.id}`)
    // Wait for table rows
    await page.waitForSelector('table tbody tr', { timeout: 10000 })

    // Get the first subject input and change its value
    const firstSubjectInput = page.locator('table tbody tr:first-child td:first-child input')
    await expect(firstSubjectInput).toBeVisible()

    const originalValue = await firstSubjectInput.inputValue()
    await firstSubjectInput.clear()
    await firstSubjectInput.fill(originalValue + ' (edited)')

    // Save button should appear
    const saveBtn = page.getByRole('button', { name: /שמור שינויים/ })
    await expect(saveBtn).toBeVisible()
    await saveBtn.click()

    // Wait for success
    await expect(page.getByText(/שינויים נשמרו בהצלחה/)).toBeVisible({ timeout: 5000 })

    // Revert: reload and fix the name back
    await page.reload()
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    const inputAfterReload = page.locator('table tbody tr:first-child td:first-child input')
    await inputAfterReload.clear()
    await inputAfterReload.fill(originalValue)
    await page.getByRole('button', { name: /שמור שינויים/ }).click()
    await expect(page.getByText(/שינויים נשמרו בהצלחה/)).toBeVisible({ timeout: 5000 })
  })

  test('reimport tab shows textarea and warning', async ({ page }) => {
    await page.goto(`/syllabus/edit/${TEST_COURSE.id}`)
    await page.getByRole('button', { name: 'ייבוא מחדש' }).click()

    await expect(page.getByText('פעולה זו תמחק את כל הנתונים הקיימים של הקורס')).toBeVisible()
    await expect(page.getByPlaceholder('הדבק כאן את תוכן הסילבוס החדש...')).toBeVisible()
    await expect(page.getByRole('button', { name: 'אשר והחלף' })).toBeVisible()
    // Confirm button should be disabled when textarea is empty
    await expect(page.getByRole('button', { name: 'אשר והחלף' })).toBeDisabled()
  })

  test('back to lobby button works', async ({ page }) => {
    await page.goto(`/syllabus/edit/${TEST_COURSE.id}`)
    await page.getByText('חזרה ללובי').click()
    await expect(page).toHaveURL('/', { timeout: 5000 })
  })
})

test.describe('Syllabus Input Page', () => {
  test('shows course name and syllabus text inputs', async ({ page }) => {
    await page.goto('/syllabus/new')
    await expect(page.getByText('שם הקורס')).toBeVisible()
    await expect(page.getByText('טקסט הסילבוס')).toBeVisible()
    await expect(page.getByRole('button', { name: 'נתח סילבוס' })).toBeVisible()
  })

  test('parse button is disabled when inputs are empty', async ({ page }) => {
    await page.goto('/syllabus/new')
    await expect(page.getByRole('button', { name: 'נתח סילבוס' })).toBeDisabled()
  })
})

// Restore course name at the end
test.describe('Cleanup', () => {
  test('restore course name back to original', async ({ page }) => {
    await page.goto(`/syllabus/edit/${TEST_COURSE.id}`)
    const nameInput = page.getByTestId('course-name-input')
    await expect(nameInput).toBeVisible({ timeout: 10000 })

    const currentValue = await nameInput.inputValue()
    if (currentValue !== TEST_COURSE.originalName) {
      await nameInput.clear()
      await nameInput.fill(TEST_COURSE.originalName)
      await page.getByTestId('save-course-name-btn').click()
      await expect(page.getByText('פרטי הקורס עודכנו בהצלחה')).toBeVisible({ timeout: 5000 })
    }
  })
})
