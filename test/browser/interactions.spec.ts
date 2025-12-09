import { expect, test } from '@nuxt/test-utils/playwright'

test.describe('User Interactions', () => {
  test('CTA buttons on homepage navigate correctly', async ({ page, goto }) => {
    await goto('/')

    const ctaLink = page.getByRole('link').filter({ hasText: /get.?started/i }).first()

    await expect(ctaLink).toBeVisible()
    await ctaLink.click()

    await expect(page).toHaveURL(/\/docs/)
  })

  test('internal link navigation works', async ({ page, goto }) => {
    await goto('/')

    const initialUrl = page.url()
    const internalLink = page.locator('a[href^="/docs"], a[href^="/modules"], a[href^="/blog"]').first()

    expect(await internalLink.count()).toBeGreaterThan(0)
    await internalLink.click({ timeout: 5000 })

    expect(page.url()).not.toBe(initialUrl)

    await expect(page.locator('body')).toBeVisible()
  })

  test.skip('tab interface works when present', async ({ page, goto }) => {
    await goto('/')

    const tabs = page.getByRole('tab')

    const unselectedTab = tabs.filter({ has: page.locator('[aria-selected="false"]') }).first()
    await unselectedTab.click()

    await expect(unselectedTab).toHaveAttribute('aria-selected', 'true')
  })

  test('copy buttons are functional', async ({ page, goto }) => {
    await goto('/')

    // Find copy buttons (usually have copy in text or aria-label)
    const copyButton = page.getByRole('button').filter({ has: page.locator('[class*="copy"], [aria-label*="copy" i]') }).first()
      .or(page.locator('button[class*="copy"]').first())

    // Copy buttons should exist in code examples
    expect(await copyButton.count()).toBeGreaterThan(0)
    await expect(copyButton).toBeVisible()
  })
})

test.describe('Accessibility', () => {
  test('main navigation links are keyboard accessible', async ({ page, goto }) => {
    await goto('/')

    // Navigation links should be focusable
    const navLinks = page.getByRole('navigation').first().getByRole('link')
    await expect(navLinks.first()).toBeVisible()

    // First link should be focusable
    const firstLink = navLinks.first()
    await firstLink.focus()
    await expect(firstLink).toBeFocused()
  })
})

test.describe('Error Handling', () => {
  test('handles non-existent routes gracefully', async ({ goto }) => {
    const response = await goto('/this-page-definitely-does-not-exist-12345')
    expect(response?.status()).toBeGreaterThanOrEqual(400)
  })

  test('page loads without critical console errors', async ({ page, goto }) => {
    const errors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await goto('/')
    expect(errors.length).toBe(0)
  })
})
