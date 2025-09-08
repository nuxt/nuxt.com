// TODO: Update later
import { SitemapStream, streamToPromise } from 'sitemap'
import type { H3Event } from 'h3'
import type { Collections, CollectionQueryBuilder } from '@nuxt/content'
import { queryCollection } from '#imports'

type queryCollectionWithEvent = <T extends keyof Collections>(event: H3Event, collection: T) => CollectionQueryBuilder<Collections[T]>

export default defineEventHandler(async (event: H3Event) => {
  const docs = await (queryCollection as queryCollectionWithEvent)(event, 'docsv4')
    .where('path', 'NOT LIKE', '%.navigation')
    .all()
  const blog = await (queryCollection as queryCollectionWithEvent)(event, 'blog')
    .where('draft', '=', 0)
    .all()

  const sitemap = new SitemapStream({
    hostname: 'https://nuxt.com'
  })
  for (const doc of docs) {
    sitemap.write({
      url: doc.path,
      changefreq: 'weekly'
    })
  }
  for (const doc of blog) {
    sitemap.write({
      url: doc.path,
      changefreq: 'monthly'
    })
  }
  sitemap.end()
  return streamToPromise(sitemap)
})
