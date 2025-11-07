import { test, expect } from '@playwright/test'

test.describe('Company Project Page - Interactivity', () => {
  test.beforeEach(({}, testInfo) => {
    if (!process.env.E2E_PROJECT_ID) {
      testInfo.skip(true, 'E2E_PROJECT_ID not set; skipping project page tests')
    }
  })

  test('shows edit toolbar and allows toggling editor', async ({ page }) => {
    const projectId = process.env.E2E_PROJECT_ID as string
    await page.goto(`/projects/${projectId}`)

    // Edit button exists
    await expect(page.getByTestId('edit-project')).toBeVisible()
    await page.getByTestId('edit-project').click()

    // Editor appears with form fields
    await expect(page.getByTestId('project-title')).toBeVisible()
    await expect(page.getByTestId('project-summary')).toBeVisible()
    await expect(page.getByTestId('project-description')).toBeVisible()

    // Cancel closes editor
    await page.getByTestId('cancel-edit').click()
    await expect(page.getByTestId('edit-project')).toBeVisible()
  })

  test('resource links render as clickable anchors', async ({ page }) => {
    const projectId = process.env.E2E_PROJECT_ID as string
    await page.goto(`/projects/${projectId}`)

    const links = page.getByTestId('resource-link')
    const count = await links.count()
    if (count > 0) {
      await expect(links.nth(0)).toHaveAttribute('href', /https?:\/\//)
    }
  })

  test('resource files preview and download', async ({ page, context }) => {
    const projectId = process.env.E2E_PROJECT_ID as string
    await page.goto(`/projects/${projectId}`)

    const previewBtn = page.getByTestId('preview-file').first()
    const downloadBtn = page.getByTestId('download-file').first()

    if (await previewBtn.isVisible()) {
      await previewBtn.click()
      // Dialog opens
      await expect(page.getByRole('dialog')).toBeVisible()
      // Close dialog via escape
      await page.keyboard.press('Escape')
    }

    if (await downloadBtn.isVisible()) {
      const [ download ] = await Promise.all([
        // Wait for download event
        page.waitForEvent('download'),
        downloadBtn.click(),
      ])
      const path = await download.path()
      expect(path).toBeTruthy()
    }
  })
})


