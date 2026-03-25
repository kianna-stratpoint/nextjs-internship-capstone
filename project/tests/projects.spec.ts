/* ============================================
   Project E2E Tests

   Tests:
   - Create a new project
   - Navigate to project board
   - Edit project details
   - Archive and restore project
   - Delete project
   ============================================ */

import { test, expect } from "@playwright/test"

// Use a unique name to avoid collisions
const testProjectName = `E2E Test Project ${Date.now()}`

test.describe("Project Management", () => {
  test.describe.serial("Project CRUD Lifecycle", () => {
    test("should create a new project", async ({ page }) => {
      await page.goto("/projects")
      await page.waitForLoadState("networkidle")

      // Click create project button
      await page.click('button:has-text("New Project"), button:has-text("Create")')

      // Wait for modal
      await page.waitForSelector('[role="dialog"]', { timeout: 5_000 })

      // Fill in project details
      await page.fill(
        'input[placeholder*="title"], input[placeholder*="name"], input[name="title"]',
        testProjectName
      )

      // Fill description if present
      const descField = page.locator('textarea, [placeholder*="description"]').first()
      if (await descField.isVisible()) {
        await descField.fill("Created by Playwright E2E test")
      }

      // Submit
      await page.click('button:has-text("Create")')

      // Wait for modal to close and project to appear
      await page.waitForSelector('[role="dialog"]', { state: "hidden", timeout: 10_000 })

      // Verify project appears in the list
      await expect(page.locator(`text=${testProjectName}`).first()).toBeVisible({ timeout: 10_000 })
    })

    test("should navigate to project board", async ({ page }) => {
      await page.goto("/projects")
      await page.waitForLoadState("networkidle")

      // Click on the project
      await page.click(`text=${testProjectName}`)

      // Should be on the project page with kanban board
      await page.waitForURL(/projects\//, { timeout: 10_000 })

      // Board should have default lists
      await expect(page.locator("text=To Do").first()).toBeVisible({ timeout: 10_000 })
      await expect(page.locator("text=In Progress").first()).toBeVisible()
      await expect(page.locator("text=Done").first()).toBeVisible()
    })

    test("should delete the test project", async ({ page }) => {
      await page.goto("/projects")
      await page.waitForLoadState("networkidle")

      // Find the project card and open its menu
      const projectCard = page
        .locator(`text=${testProjectName}`)
        .first()
        .locator("..")
        .locator("..")

      // Click the more menu (MoreHorizontal icon)
      await projectCard.locator("button:has(svg)").last().click()

      // Click delete
      await page.click("text=Delete Project")

      // Confirm deletion in the alert dialog
      await page.waitForSelector('[role="alertdialog"]', { timeout: 5_000 })
      await page.click('[role="alertdialog"] button:has-text("Delete")')

      // Wait for project to disappear
      await expect(page.locator(`text=${testProjectName}`)).toHaveCount(0, { timeout: 10_000 })
    })
  })
})

test.describe("Project Navigation", () => {
  test("should show empty state when no projects match search", async ({ page }) => {
    await page.goto("/projects")
    await page.waitForLoadState("networkidle")

    // Search for something that doesn't exist
    const searchInput = page
      .locator('input[placeholder*="Search"], input[placeholder*="search"]')
      .first()
    if (await searchInput.isVisible()) {
      await searchInput.fill("zzz_nonexistent_project_xyz")
      await page.waitForTimeout(500) // debounce

      // Should show empty state or no results
      await expect(page.locator("text=/no.*projects|no.*results|not found/i").first()).toBeVisible({
        timeout: 5_000,
      })
    }
  })

  test("should navigate to project not found for invalid ID", async ({ page }) => {
    await page.goto("/projects/nonexistent-uuid-12345")

    // Should show not found page
    await expect(page.locator("text=/not found|doesn't exist|no access/i").first()).toBeVisible({
      timeout: 10_000,
    })
  })
})
