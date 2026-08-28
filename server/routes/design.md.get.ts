import { renderMarkdown } from 'comark/render'

export default defineCachedEventHandler(async (event) => {
  const domain = getSiteUrl(event)

  const content = await getInstanceAtHead('site')
  const document = await content.get('/design')
  if (!document) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  setResponseHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  setResponseHeader(event, 'Link', [
    `<${domain}/design.md>; rel="canonical"`,
    `<${domain}/design-kit>; rel="alternate"; type="text/html"`
  ].join(', '))

  return renderMarkdown(document)
}, {
  name: 'design-md',
  swr: true,
  maxAge: 60 * 60
})
