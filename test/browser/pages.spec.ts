import { expect, test } from '@nuxt/test-utils/playwright'

test.describe('Homepage', () => {
  test('has a visible hero description', async ({ page, goto }) => {
    await goto('/')
    const h1 = page.getByRole('heading', { level: 1 }).first()
    await expect(h1).toBeVisible()
    // The hero tagline rendered below the headline should have meaningful text
    const description = h1.locator('..').locator('[data-slot="description"]')
    await expect(description).toHaveText(/.{10,}/)
  })
})

test.describe('Content Pages', () => {
  test('docs sidebar links update the rendered page', async ({ page, goto }) => {
    await goto('/')
    await page.getByRole('link', { name: 'Docs', exact: true }).first().click()

    const aside = page.locator('aside').first()
    await aside.evaluate(element => element.setAttribute('data-navigation-test', 'persistent'))

    const installationLink = page.locator('aside a').filter({ hasText: 'Installation' }).first()
    const installationPath = await installationLink.getAttribute('href')
    await installationLink.click()

    await expect(page).toHaveURL(installationPath!)
    await expect(page.getByRole('heading', { level: 1, name: 'Installation' })).toBeVisible()
    await expect(aside).toHaveAttribute('data-navigation-test', 'persistent')
  })

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
    const enterprisePages = ['/enterprise', '/enterprise/agencies', '/enterprise/sponsors']

    for (const path of enterprisePages) {
      const response = await goto(path)
      expect(response?.status()).toBeLessThan(400)
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
    }
  })
})
