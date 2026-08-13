import { SitemapStream, streamToPromise } from 'sitemap'
import { DOCS_COLLECTION_SOURCES } from '../../shared/utils/docs'

export default defineEventHandler(async (event) => {
  // TODO: add docsv5 to sitemap when Nuxt 5 is released
  const [docs, blog] = await Promise.all([
    content.list([...DOCS_COLLECTION_SOURCES.docsv4]),
    listChildren('/blog')
  ])

  const sitemap = new SitemapStream({
    hostname: getSiteUrl(event)
  })
  const today = new Date().toISOString().split('T')[0]
  for (const doc of docs) {
    if (doc.meta.extension !== '.md' || doc.meta.stem.split('/').pop()?.startsWith('.')) continue
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
      lastmod: doc.data.date
    })
  }
  sitemap.end()
  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return streamToPromise(sitemap)
})
