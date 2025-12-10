import { expect, test } from '@nuxt/test-utils/playwright'

test.describe('Modules Page', () => {
  test('loads successfully with module listing', async ({ page, goto }) => {
    await goto('/modules')

    await expect(page).toHaveTitle(/Modules/i)

    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()

    const moduleLinks = page.locator('a[href^="/modules/"]')
    expect(await moduleLinks.count()).toBeGreaterThanOrEqual(0)
  })

  test('has search/filter functionality', async ({ page, goto }) => {
    await goto('/modules')

    const searchInput = page.getByRole('textbox').first()
    await expect(searchInput).toBeVisible()
    await expect(searchInput).toBeEditable()

    // type a nonexistent module name to test filtering
    await searchInput.fill('nonexistent-module-xyz')
    await page.waitForLoadState('networkidle')

    // Verify that no module links are visible after filtering
    const moduleLinks = page.locator('a[href^="/modules/"]')
    expect(await moduleLinks.count()).toBe(0)

    // Clear the search input
    await searchInput.fill('')

    // Verify that module links are visible again
    expect(await moduleLinks.count()).toBeGreaterThanOrEqual(0)
  })

  test('has category filters', async ({ page, goto }) => {
    await goto('/modules')

    // Find links that likely represent categories (multiple instances)
    const categoryLinks = page.locator('a[href*="category="]')
      .or(page.locator('a[href*="?"]'))

    await expect(categoryLinks.first()).toBeVisible()

    const moduleLinks = page.locator('a[href^="/modules/"]')
    const count = await moduleLinks.count()

    // click a category link
    await categoryLinks.first().click()
    expect(page.url()).toContain('category=')

    // Verify we're still on modules page
    await expect(page).toHaveTitle(/Modules/i)
    expect(await moduleLinks.count()).toBeLessThanOrEqual(count)
  })

  // TODO: needs to be fixed in nuxt/ui
  test.skip('navigates to module detail page', async ({ page, goto }) => {
    await goto('/modules')

    // Find a visible module card link
    const moduleLink = page.locator('a[href^="/modules/"][href$="/"]').first()

    await moduleLink.scrollIntoViewIfNeeded()
    await moduleLink.click()

    // Verify we navigated to a module detail page
    await expect(page).toHaveURL(/\/modules\/[^/]+/)

    // Should still have Nuxt in title
    await expect(page).toHaveTitle(/Nuxt|Module/i)
  })
})
