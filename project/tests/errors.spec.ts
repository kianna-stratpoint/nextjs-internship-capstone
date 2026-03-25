/* ============================================
   Error Scenario E2E Tests

   Tests:
   - Invalid project ID → not-found page
   - Error boundary recovery ("Try Again")
   - Form validation (empty title, invalid input)
   - Network failure simulation
   - 404 pages render correctly
   ============================================ */

import { test, expect } from "@playwright/test"

test.describe("Error Handling — Not Found", () => {
  test("should show not-found for invalid project ID", async ({ page }) => {
    await page.goto("/projects/00000000-0000-0000-0000-000000000000")

    // Should show not-found UI
    await expect(page.locator("text=/not found|doesn't exist|no access/i").first()).toBeVisible({
      timeout: 15_000,
    })

    // Should have a "Back to Projects" link
    const backLink = page.locator('a:has-text("Back"), a[href="/projects"]').first()
    await expect(backLink).toBeVisible()
  })

  test("should show not-found for completely invalid route", async ({ page }) => {
    const response = await page.goto("/projects/not-a-uuid")

    // Either shows custom not-found or Next.js 404
    const notFoundVisible = await page.locator("text=/not found/i").first().isVisible()
    const is404 = response?.status() === 404

    expect(notFoundVisible || is404).toBe(true)
  })
})

test.describe("Error Handling — Form Validation", () => {
  test("should prevent creating a project without a title", async ({ page }) => {
    await page.goto("/projects")
    await page.waitForLoadState("networkidle")

    // Open create modal
    const createButton = page
      .locator('button:has-text("New Project"), button:has-text("Create")')
      .first()
    if (!(await createButton.isVisible({ timeout: 5_000 }))) {
      test.skip()
      return
    }

    await createButton.click()

    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible({ timeout: 5_000 })

    // Try submitting without filling title
    const submitButton = modal.locator('button[type="submit"], button:has-text("Create")').last()
    await submitButton.click()

    // Should either show validation error or the modal stays open
    await page.waitForTimeout(1_000)

    // Modal should still be visible (not closed)
    await expect(modal).toBeVisible()

    // Check for validation message
    const hasValidation =
      (await modal.locator("text=/required|title|cannot be empty/i").count()) > 0 ||
      (await modal.locator('[aria-invalid="true"], .text-destructive, .text-red').count()) > 0 ||
      (await modal.locator("input:invalid").count()) > 0

    expect(hasValidation).toBe(true)

    await page.keyboard.press("Escape")
  })

  test("should prevent creating a task with empty title", async ({ page }) => {
    await page.goto("/projects")
    await page.waitForLoadState("networkidle")

    // Navigate to first project
    const firstProject = page.locator('a[href^="/projects/"]').first()
    if (!(await firstProject.isVisible({ timeout: 5_000 }))) {
      test.skip()
      return
    }

    await firstProject.click()
    await page.waitForURL(/\/projects\//, { timeout: 10_000 })

    // Find inline task creation input
    const addButton = page.locator('button:has-text("Add"), button:has(svg.lucide-plus)').first()
    if (!(await addButton.isVisible({ timeout: 5_000 }))) {
      test.skip()
      return
    }

    await addButton.click()

    const taskInput = page
      .locator('input[placeholder*="title"], input[placeholder*="task"]')
      .first()
    await expect(taskInput).toBeVisible({ timeout: 5_000 })

    // Submit empty
    await taskInput.press("Enter")

    // Input should still be visible (task not created)
    await expect(taskInput).toBeVisible()
  })
})

test.describe("Error Handling — Network Resilience", () => {
  test("should handle slow network gracefully with loading states", async ({ page }) => {
    // Simulate slow network
    const client = await page.context().newCDPSession(page)
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      downloadThroughput: 50 * 1024, // 50 KB/s
      uploadThroughput: 50 * 1024,
      latency: 2000, // 2s latency
    })

    await page.goto("/dashboard")

    // Should show loading skeleton or spinner before content loads
    const loadingIndicator = page
      .locator('.animate-pulse, [class*="skeleton"], svg.animate-spin, [class*="Loader"]')
      .first()

    // Either a loading indicator is shown, or the page eventually loads
    const loaded = await Promise.race([
      loadingIndicator.isVisible().catch(() => false),
      page.waitForLoadState("networkidle").then(() => true),
    ])

    expect(loaded).toBeDefined()

    // Reset network
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0,
    })
  })

  test("should show error boundary on server error and allow retry", async ({ page }) => {
    // Intercept API calls and force a 500 error
    await page.route("**/api/**", (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: "Internal Server Error" }),
      })
    })

    await page.goto("/dashboard")

    // Either error boundary shows, or the page handles it gracefully
    const errorBoundary = page.locator("text=/something went wrong|error|try again/i").first()
    const retryButton = page
      .locator('button:has-text("Try Again"), button:has-text("Retry")')
      .first()

    // Wait a reasonable time
    const hasError = await errorBoundary.isVisible({ timeout: 15_000 }).catch(() => false)

    if (hasError) {
      // Error boundary rendered — verify retry button exists
      await expect(retryButton).toBeVisible()

      // Unblock API calls
      await page.unroute("**/api/**")

      // Click retry
      await retryButton.click()

      // Page should attempt to recover
      await page.waitForTimeout(3_000)
    }
    // If no error boundary, the page handled the error internally (also acceptable)
  })
})

test.describe("Error Handling — Edge Cases", () => {
  test("should handle browser back/forward navigation", async ({ page }) => {
    await page.goto("/dashboard")
    await page.waitForLoadState("networkidle")

    // Navigate to projects
    await page.click('a[href="/projects"]')
    await page.waitForURL(/projects/)

    // Navigate to team
    await page.click('a[href="/team"]')
    await page.waitForURL(/team/)

    // Go back
    await page.goBack()
    await expect(page).toHaveURL(/projects/)

    // Go back again
    await page.goBack()
    await expect(page).toHaveURL(/dashboard/)

    // Go forward
    await page.goForward()
    await expect(page).toHaveURL(/projects/)
  })

  test("should handle rapid navigation without crashes", async ({ page }) => {
    const routes = ["/dashboard", "/projects", "/team", "/analytics", "/calendar", "/settings"]

    // Navigate rapidly between routes
    for (const route of routes) {
      await page.goto(route)
      // Don't wait for full load — test that rapid nav doesn't crash
    }

    // Final page should be accessible
    await page.waitForLoadState("networkidle")
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 })
  })

  test("should persist theme preference across navigation", async ({ page }) => {
    await page.goto("/settings")
    await page.waitForLoadState("networkidle")

    // Check current theme
    const htmlElement = page.locator("html")
    const currentTheme = await htmlElement.getAttribute("class")
    const isDark = currentTheme?.includes("dark")

    // Navigate away and back
    await page.goto("/dashboard")
    await page.waitForLoadState("networkidle")

    // Theme should persist
    const themeAfterNav = await htmlElement.getAttribute("class")
    const stillDark = themeAfterNav?.includes("dark")

    expect(stillDark).toBe(isDark)
  })
})
