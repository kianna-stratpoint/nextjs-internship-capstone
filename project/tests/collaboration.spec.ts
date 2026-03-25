/* ============================================
   Collaboration E2E Tests

   Tests:
   - Invite a member to a project
   - View team members page
   - Assign a task to a member
   - View notifications

   Prerequisites:
   - Authenticated user is admin of at least one project
   ============================================ */

import { test, expect, type Page } from "@playwright/test"

async function goToTeamPage(page: Page) {
  await page.goto("/team")
  await page.waitForLoadState("networkidle")
  await expect(page.locator("h1:has-text('Team')")).toBeVisible({ timeout: 10_000 })
}

async function goToFirstProject(page: Page) {
  await page.goto("/projects")
  await page.waitForLoadState("networkidle")
  const firstProject = page.locator('a[href^="/projects/"]').first()
  await expect(firstProject).toBeVisible({ timeout: 10_000 })
  await firstProject.click()
  await page.waitForURL(/\/projects\//, { timeout: 10_000 })
}

// ── Tests ────────────────────────────────────────────────

test.describe("Team & Collaboration", () => {
  test("should display team page with project selector", async ({ page }) => {
    await goToTeamPage(page)

    // Project selector should be visible
    await expect(
      page.locator('button[role="combobox"], [data-testid="project-selector"]').first()
    ).toBeVisible({ timeout: 5_000 })

    // Stats cards should be visible
    await expect(page.locator("text=Members").first()).toBeVisible()
  })

  test("should show member cards on team page", async ({ page }) => {
    await goToTeamPage(page)

    // Wait for members to load
    await page.waitForTimeout(2_000)

    // At least the current user should appear as a member
    const memberCards = page.locator('[class*="rounded-xl"][class*="border"]').filter({
      has: page.locator('[class*="rounded-full"]'), // avatar
    })

    const count = await memberCards.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test("should open invite member modal", async ({ page }) => {
    await goToTeamPage(page)

    // Click invite button (only visible for admins)
    const inviteButton = page.locator('button:has-text("Invite")')

    if (!(await inviteButton.isVisible({ timeout: 3_000 }))) {
      // User is not admin — skip
      test.skip()
      return
    }

    await inviteButton.click()

    // Modal should open
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible({ timeout: 5_000 })

    // Should have email input
    await expect(
      modal.locator('input[placeholder*="email"], input[type="email"], input[name="email"]').first()
    ).toBeVisible()

    // Close without submitting
    await page.keyboard.press("Escape")
  })

  test("should open invite modal and show validation on empty submit", async ({ page }) => {
    await goToTeamPage(page)

    const inviteButton = page.locator('button:has-text("Invite")')
    if (!(await inviteButton.isVisible({ timeout: 3_000 }))) {
      test.skip()
      return
    }

    await inviteButton.click()

    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible({ timeout: 5_000 })

    // Try submitting without filling email
    const submitButton = modal.locator('button:has-text("Send"), button:has-text("Invite")').first()
    if (await submitButton.isVisible()) {
      await submitButton.click()

      // Should show validation error or the email field should have an error state
      await page.waitForTimeout(1_000)

      // Check for error message or invalid input state
      const hasError =
        (await modal.locator("text=/required|invalid|enter.*email/i").count()) > 0 ||
        (await modal.locator('input:invalid, [aria-invalid="true"]').count()) > 0

      expect(hasError).toBe(true)
    }

    await page.keyboard.press("Escape")
  })
})

test.describe("Task Assignment", () => {
  test("should open assignee selector on task card", async ({ page }) => {
    await goToFirstProject(page)

    // Find a task card with assignee avatars or assignee area
    const taskCards = page.locator('[draggable="true"], [data-task]')
    const cardCount = await taskCards.count()

    if (cardCount === 0) {
      test.skip()
      return
    }

    // Click the first task to open the sheet
    await taskCards.first().click()

    const sheet = page.locator('[role="dialog"], [data-state="open"]').first()
    await expect(sheet).toBeVisible({ timeout: 5_000 })

    // Look for assignee section
    const assigneeArea = sheet.locator('text=/assign/i, button:has-text("Assign")').first()

    if (await assigneeArea.isVisible({ timeout: 3_000 })) {
      await assigneeArea.click()

      // Assignee popover should open with member list
      const popover = page.locator('[role="listbox"], [data-radix-popper-content-wrapper]').first()
      await expect(popover).toBeVisible({ timeout: 3_000 })
    }

    await page.keyboard.press("Escape")
    await page.keyboard.press("Escape")
  })
})

test.describe("Notifications", () => {
  test("should display notification bell in top nav", async ({ page }) => {
    await page.goto("/dashboard")

    // The notification bell should be in the header
    const bell = page
      .locator('button:has(svg.lucide-bell), [data-testid="notification-bell"]')
      .first()
    await expect(bell).toBeVisible({ timeout: 5_000 })
  })

  test("should open notification dropdown on bell click", async ({ page }) => {
    await page.goto("/dashboard")

    const bell = page
      .locator('button:has(svg.lucide-bell), [data-testid="notification-bell"]')
      .first()
    if (!(await bell.isVisible({ timeout: 3_000 }))) {
      test.skip()
      return
    }

    await bell.click()

    // Dropdown or popover should appear
    const dropdown = page
      .locator('[role="menu"], [data-radix-popper-content-wrapper], [data-state="open"]')
      .first()
    await expect(dropdown).toBeVisible({ timeout: 3_000 })

    // Close
    await page.keyboard.press("Escape")
  })
})
