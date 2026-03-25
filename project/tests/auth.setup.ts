import { test as setup, expect } from "@playwright/test"
import path from "path"

const authFile = path.resolve(__dirname, ".auth/user.json")

setup("authenticate", async ({ page }) => {
  // 1. Navigate to sign-in
  await page.goto("/sign-in")

  // 2. Email Step
  const identifierInput = page.locator('input[name="identifier"]')
  await identifierInput.waitFor({ state: "visible", timeout: 15000 })
  await identifierInput.fill(process.env.E2E_USER_EMAIL!)
  await page.getByRole("button", { name: /Continue/i, exact: false }).click()

  // 3. Password Step
  const passwordInput = page.locator('input[name="password"]')
  await passwordInput.waitFor({ state: "visible", timeout: 10000 })
  await passwordInput.fill(process.env.E2E_USER_PASSWORD!)

  // NOTE: After this click, Clerk may redirect to /sign-in/client-trust or /sign-in/verify
  await page.getByRole("button", { name: /Continue/i, exact: false }).click()

  // 4. Handle Clerk's Verification / Client Trust Screen
  try {
    const verifyHeading = page.getByText(/verify/i)

    if (await verifyHeading.first().isVisible({ timeout: 10000 })) {
      //console.log("OTP/Device Verification detected. Using test bypass code...")

      await page.waitForTimeout(1000)

      const otpBox = page.locator('input[autocomplete="one-time-code"]').first()
      if (await otpBox.isVisible()) {
        await otpBox.focus()
      }

      // Type the default Clerk test code globally
      await page.keyboard.type("424242", { delay: 100 })

      // Wait a moment for Clerk's API to verify the code
      await page.waitForTimeout(2000)
    }
  } catch (e) {
    //console.log("No OTP screen handled, proceeding to dashboard wait...")
  }

  // 5. Wait for the redirect to complete
  await page.waitForURL("**/dashboard", { timeout: 30000 })

  // Wait for a specific element that proves the dashboard loaded successfully.
  await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible({ timeout: 15000 })

  // 7. Save the storage state
  await page.context().storageState({ path: authFile })
})
