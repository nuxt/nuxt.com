export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const path = `/docs/${Array.isArray(slug) ? slug.join('/') : slug}`
  const markdown = await fetchContentMarkdown(path)

  if (!markdown) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  }

  const domain = getSiteUrl(event)
  setResponseHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  setResponseHeader(event, 'Link', [
    `<${domain}${path}>; rel="canonical"`,
    `<${domain}${path}>; rel="alternate"; type="text/html"`
  ].join(', '))
  return markdown
})
