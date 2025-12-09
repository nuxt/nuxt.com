import { expect, test } from '@nuxt/test-utils/playwright'

test.describe('Docs Page', () => {
  test('loads and has proper documentation structure', async ({ page, goto }) => {
    await goto('/docs')

    await expect(page).toHaveTitle(/Nuxt/i)
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
    await expect(page.getByRole('navigation').first()).toBeVisible()
  })

  test('has sidebar navigation with multiple links', async ({ page, goto }) => {
    await goto('/docs')

    // Find complementary region or aside (typical sidebar)
    const sidebar = page.getByRole('complementary').or(page.locator('aside')).first()

    // Sidebar should have multiple navigation links
    const sidebarLinks = sidebar.getByRole('link')
    await expect(sidebarLinks.first()).toBeVisible()
    expect(await sidebarLinks.count()).toBeGreaterThan(3)
  })

  test('has table of contents for page navigation', async ({ page, goto }) => {
    // Navigate to actual docs content page
    await goto('/docs/getting-started/introduction')

    // Check if TOC has hash links for in-page navigation
    const hashLinks = page.locator('a[href^="#"]')
    // Docs pages should have hash links for navigation
    expect(await hashLinks.count()).toBeGreaterThan(0)
    await expect(hashLinks.first()).toBeVisible()
  })

  test('has GitHub or feedback functionality', async ({ page, goto }) => {
    // Navigate to actual docs content page
    await goto('/docs/getting-started/introduction')

    // Look for GitHub links (edit, contribute, etc.) or feedback mechanisms
    const githubLinks = page.locator('a[href*="github.com"]')
    const feedbackElements = page.getByRole('radiogroup')
      .or(page.getByRole('group').filter({ has: page.getByRole('radio') }))
      .or(githubLinks)

    // At least one feedback/contribution mechanism should exist
    expect(await feedbackElements.count()).toBeGreaterThan(0)
    await expect(feedbackElements.first()).toBeVisible()
  })

  test('hash navigation works within page', async ({ page, goto }) => {
    // Navigate to actual docs content page
    await goto('/docs/getting-started/introduction')

    // Find a hash link
    const hashLink = page.locator('a[href^="#"]').first()

    // Hash links should exist for in-page navigation
    expect(await hashLink.count()).toBeGreaterThan(0)
    const href = await hashLink.getAttribute('href')
    await hashLink.click()

    // Verify URL has hash
    if (href) {
      await expect(page).toHaveURL(new RegExp(href.replace('#', '#')))
    }
  })
})
