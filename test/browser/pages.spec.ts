import { expect, test } from '@nuxt/test-utils/playwright'

test.describe('Content Pages', () => {
  test('key pages load successfully', async ({ page, goto }) => {
    const pages = ['/templates', '/blog', '/showcase', '/team']

    for (const path of pages) {
      await goto(path)
      await expect(page).toHaveTitle(/Nuxt|Template|Blog|Showcase|Team/i)
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
    }
  })

  // TODO: https://github.com/nuxt/ui/issues/5635
  test.skip('blog posts are navigable', async ({ page, goto }) => {
    await goto('/blog')

    const firstBlogLink = page.locator('a[href^="/blog/"]:not([href="/blog"]):not([href="/blog/"]):not([href*="rss"])').first()
    await firstBlogLink.click()
    await expect(page).toHaveURL(/\/blog\/[^/]+/)

    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  })
})

test.describe('Enterprise Pages', () => {
  test('all enterprise pages are accessible', async ({ page, goto }) => {
    const enterprisePages = ['/enterprise', '/enterprise/support', '/enterprise/agencies', '/enterprise/sponsors']

    for (const path of enterprisePages) {
      const response = await goto(path)
      expect(response?.status()).toBeLessThan(400)
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
    }
  })
})
