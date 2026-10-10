const META_TAG_RE = /<meta\b[^>]*>/gi

/**
 * Stable Nuxter card URL for GitHub profile READMEs: redirects to the og:image of the profile page.
 * Same as nuxt-og-image's `/_og/r/` resolver, but owned by us and one hop shorter for GitHub's image proxy.
 */
export default defineEventHandler(async (event) => {
  const username = getRouterParam(event, 'username')
  if (!username || !/^[a-z0-9-]{1,39}$/i.test(username)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid GitHub username' })
  }

  const html = await $fetch<string>(`/nuxters/${username}`, {
    headers: { accept: 'text/html' },
    responseType: 'text'
  }).catch((error) => {
    throw createError({ statusCode: error?.statusCode === 404 ? 404 : 502, statusMessage: 'Nuxter not found' })
  })

  const image = ogImageFromHtml(html)
  if (!image) {
    throw createError({ statusCode: 404, statusMessage: 'Nuxter card not found' })
  }

  setResponseHeader(event, 'cache-control', 'public, max-age=3600, s-maxage=3600')
  return sendRedirect(event, image, 302)
})

function ogImageFromHtml(html: string): string | undefined {
  for (const [tag] of html.matchAll(META_TAG_RE)) {
    if (!/\bproperty=["']og:image["']/i.test(tag)) continue
    const content = tag.match(/\bcontent=["']([^"']+)["']/i)?.[1]
    if (content) return content.replaceAll('&amp;', '&')
  }
}
