// TODO: Update later
import { SitemapStream, streamToPromise } from 'sitemap'
import type { H3Event } from 'h3'
import { queryCollection } from '@nuxt/content/server'
import { withoutTrailingSlash } from 'ufo'

export default defineEventHandler(async (event: H3Event) => {
  // TODO: add docsv5 to sitemap when Nuxt 5 is released
  const [docs, blog] = await Promise.all([
    queryCollection(event, 'docsv4')
      .where('path', 'NOT LIKE', '%.navigation')
      .all(),
    queryCollection(event, 'blog')
      .where('draft', '=', 0)
      .all()
  ])

  const sitemap = new SitemapStream({
    hostname: withoutTrailingSlash(getSiteConfig(event).url)
  })
  const today = new Date().toISOString().split('T')[0]
  for (const doc of docs) {
    sitemap.write({
      url: doc.path,
      changefreq: 'weekly',
      lastmod: today
    })
  }
  for (const doc of blog as Array<{ path: string, date?: string }>) {
    sitemap.write({
      url: doc.path,
      changefreq: 'monthly',
      lastmod: doc.date || today
    })
  }
  sitemap.end()
  return streamToPromise(sitemap)
})
