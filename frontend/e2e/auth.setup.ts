import { test as setup, expect } from '@playwright/test'
import { TEST_USER } from './test-config'

const authFile = 'e2e/.auth/user.json'

setup('authenticate', async ({ page }) => {
  await page.goto('/auth')

  // Fill login form
  await page.getByPlaceholder('your_username').fill(TEST_USER.username)
  await page.getByPlaceholder('••••••••').fill(TEST_USER.password)
  await page.locator('form').getByRole('button', { name: 'כניסה' }).click()

  // Wait for redirect to lobby
  await expect(page).toHaveURL('/', { timeout: 10000 })

  // Verify we see the welcome heading
  await expect(page.getByRole('heading', { name: new RegExp(TEST_USER.name) })).toBeVisible()

  // Save auth state
  await page.context().storageState({ path: authFile })
})
