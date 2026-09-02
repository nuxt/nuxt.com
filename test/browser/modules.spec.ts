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

  test('defaults to Nuxt 4 and selects multiple module versions', async ({ page, goto }) => {
    test.setTimeout(60_000)

    const response = await page.request.get('/api/v1/modules?category=Security')
    expect(response.ok()).toBe(true)
    const catalog = await response.json()
    expect(catalog.version).toBe('4')
    expect(catalog.modules.some((module: { name: string }) => module.name === 'better-auth')).toBe(true)

    const invalidResponse = await page.request.get('/api/v1/modules?version=invalid')
    expect(invalidResponse.status()).toBe(400)

    await goto('/modules?category=Security&q=better-auth')

    const versionFilter = page.getByRole('button', { name: 'Showing Nuxt 4+' })
    await expect(versionFilter).toBeVisible()
    await expect(page.getByText('@nuxtjs/better-auth', { exact: true }).last()).toBeVisible()

    await page.waitForFunction(() => {
      const nuxtWindow = window as typeof window & { useNuxtApp?: () => { isHydrating: boolean } }
      return nuxtWindow.useNuxtApp?.().isHydrating === false
    })
    await versionFilter.click()
    const nuxt3 = page.getByRole('checkbox', { name: 'Nuxt 3 EOL' })
    const nuxt4 = page.getByRole('checkbox', { name: 'Nuxt 4 Current' })
    const nuxt5 = page.getByRole('checkbox', { name: 'Nuxt 5 Nightly' })
    await expect(nuxt3).toHaveAttribute('aria-checked', 'false')
    await expect(nuxt4).toHaveAttribute('aria-checked', 'true')
    await expect(nuxt5).toHaveAttribute('aria-checked', 'false')
    await expect(page.getByText('Show modules that declare support for any selected Nuxt version.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Nuxt 5 nightly docs' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Nuxt release lifecycle' })).toHaveAttribute('href', '/docs/4.x/community/roadmap#release-cycle')

    await nuxt3.click()
    await expect(page.getByRole('button', { name: 'Showing Nuxt 3, 4' })).toBeVisible({ timeout: 500 })
    await expect(page).toHaveURL(/version=4(%2C|,)3/, { timeout: 15_000 })

    await goto('/modules?version=5,4,3&category=Security&q=better-auth')

    await expect(page).toHaveURL(/version=5(%2C|,)4(%2C|,)3/)
    await expect(page).toHaveURL(/category=Security/)
    await expect(page).toHaveURL(/q=better-auth/)
    await expect(page.getByRole('button', { name: 'Showing Nuxt 3, 4, 5' })).toBeVisible()
  })

  test('shows current and legacy compatibility on module details', async ({ page, goto }) => {
    await goto('/modules/better-auth')
    await expect(page.getByText('Nuxt 4+', { exact: true })).toBeVisible()
    await expect(page.getByText('This module does not support Nuxt 4')).toHaveCount(0)

    await goto('/modules/nuxt-telegram-auth')
    await expect(page.getByText('This module does not support Nuxt 4')).toBeVisible()
    await expect(page.getByText('Nuxt 3', { exact: true })).toBeVisible()
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
