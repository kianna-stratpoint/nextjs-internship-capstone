import { test as setup, expect } from "@playwright/test"
import path from "path"

const authFile = path.resolve(__dirname, "../.auth/user.json")

setup("authenticate", async ({ page }) => {
  // 1. Navigate to sign-in
  await page.goto("/sign-in")

  // 2. Fill in Email (Identifier)
  // Using getByLabel is more resilient to Clerk UI changes
  const emailInput = page.locator('input[name="identifier"]')
  await emailInput.waitFor({ state: "visible", timeout: 15000 })
  await emailInput.fill(process.env.E2E_USER_EMAIL!)
  await page.getByRole("button", { name: /Continue/i, exact: false }).click()

  // 3. Fill in Password
  const passwordInput = page.locator('input[name="password"]')
  await passwordInput.waitFor({ state: "visible", timeout: 10000 })
  await passwordInput.fill(process.env.E2E_USER_PASSWORD!)
  await page.getByRole("button", { name: /Continue/i, exact: false }).click()

  // 4. Handle "Verify your email" / OTP screen
  // This screen appears when Clerk detects a "New Device" (Playwright)
  const otpInput = page.locator('input[name^="code_"]')

  // Check if the OTP screen is visible (5s timeout is enough)
  const isOtpVisible = await otpInput
    .first()
    .isVisible({ timeout: 5000 })
    .catch(() => false)

  if (isOtpVisible) {
    //console.log("OTP challenge detected. Entering static test code...")
    const testCode = "424242" // Replace with the code shown in your Clerk 'Testing' dashboard

    // Clerk uses segmented inputs; typing into the first one usually fills the rest
    await otpInput.first().type(testCode, { delay: 100 })

    // Sometimes you need a manual click if it doesn't auto-submit
    const continueBtn = page.getByRole("button", { name: /Continue/i, exact: false })
    if (await continueBtn.isVisible()) {
      await continueBtn.click()
    }
  }

  // 5. Wait for redirect to dashboard
  // Clerk might take a moment to process the session
  await page.waitForURL("**/dashboard", { timeout: 30000 })

  // 6. Verify we're logged in
  await expect(page).toHaveURL(/dashboard/)

  // 7. Save auth state for other tests
  await page.context().storageState({ path: authFile })
})
