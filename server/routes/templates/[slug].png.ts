import captureWebsite from 'capture-website'
import { serverQueryContent } from '#content/server'

export default cachedEventHandler(async (event) => {
  // Waiting for https://github.com/unjs/nitro/issues/2001 to be fix ro remove `slug.png`
  const slug = event.context.params.slug || (event.context.params['slug.png'] || '').replace('.png', '')

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: 'Slug missing'
    })
  }
  const { templates } = await serverQueryContent(event, '/templates')
    .where({ _partial: false, _draft: false })
    .findOne()

  const template = templates.find(t => t.slug === slug)
  if (!template) {
    throw createError({
      statusCode: 400,
      message: 'Template not found'
    })
  }

  const url = template.screenshotUrl || template.demo
  if (!url) {
    throw createError({
      statusCode: 400,
      message: 'Template has no `demo` or `screenshotUrl` to take a screenshot from'
    })
  }

  setHeader(event, 'content-type', 'image/png')
  console.log(`Generating screenshot for ${template.slug} hitting ${url}...`)
  return captureWebsite.buffer(url, {
    launchOptions: { headless: 'new' }
  })
}, {
  maxAge: 60
})
