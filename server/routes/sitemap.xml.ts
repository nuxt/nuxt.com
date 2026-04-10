import { SitemapStream, streamToPromise } from 'sitemap'
import type { H3Event } from 'h3'
import type { Collections, CollectionQueryBuilder } from '@nuxt/content'
import { queryCollection } from '@nuxt/content/server'

type queryCollectionWithEvent = <T extends keyof Collections>(event: H3Event, collection: T) => CollectionQueryBuilder<Collections[T]>

export default defineEventHandler(async (event: H3Event) => {
  // TODO: add docsv5 to sitemap when Nuxt 5 is released
  const [docs, blog] = await Promise.all([
    (queryCollection as queryCollectionWithEvent)(event, 'docsv4')
      .where('path', 'NOT LIKE', '%.navigation')
      .all(),
    (queryCollection as queryCollectionWithEvent)(event, 'blog')
      .where('draft', '=', 0)
      .all()
  ])

  const now = new Date().toISOString()

  const reqUrl = getRequestURL(event)
  const hostname = reqUrl.origin.includes('localhost') ? 'https://nuxt.com' : reqUrl.origin

  const sitemap = new SitemapStream({ hostname })
  for (const doc of docs) {
    sitemap.write({
      url: doc.path,
      changefreq: 'weekly',
      lastmod: now
    })
  }
  for (const doc of blog) {
    sitemap.write({
      url: doc.path,
      changefreq: 'monthly',
      lastmod: (doc as any).date || now
    })
  }
  sitemap.end()
  return streamToPromise(sitemap)
})
