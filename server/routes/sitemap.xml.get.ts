// TODO: Update later
import { SitemapStream, streamToPromise } from 'sitemap'
import { CURRENT_DOCS_VERSION } from '#shared/utils/docs'
import { docsInstanceKey } from '#shared/utils/content'

export default defineEventHandler(async (event) => {
  // TODO: add docsv5 to sitemap when Nuxt 5 is released
  const [docs, examples, blog] = await Promise.all([
    listInstancePages(docsInstanceKey(CURRENT_DOCS_VERSION)),
    listInstancePages('examples'),
    listInstancePages('site', { dir: '/blog' }).then(items => items.filter(item => !item.data.draft))
  ])

  const sitemap = new SitemapStream({
    hostname: getSiteUrl(event)
  })
  const today = new Date().toISOString().split('T')[0]
  for (const doc of [...docs, ...examples]) {
    sitemap.write({
      url: doc.path,
      changefreq: 'weekly',
      lastmod: today
    })
  }
  for (const doc of blog) {
    sitemap.write({
      url: doc.path,
      changefreq: 'monthly',
      lastmod: (doc.data.date as string) || today
    })
  }
  sitemap.end()
  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return streamToPromise(sitemap)
})
