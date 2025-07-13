// TODO: Update later
import { SitemapStream, streamToPromise } from 'sitemap'
import type { H3Event } from 'h3'
import type { Collections, CollectionQueryBuilder } from '@nuxt/content'
import { queryCollection } from '#imports'

type queryCollectionWithEvent = <T extends keyof Collections>(event: H3Event, collection: T) => CollectionQueryBuilder<Collections[T]>

export default defineEventHandler(async (event: H3Event) => {
  const docs = await (queryCollection as queryCollectionWithEvent)(event, 'docsv3').all()

  const sitemap = new SitemapStream({
    hostname: 'https://nuxt.com'
  })
  for (const doc of docs) {
    sitemap.write({
      url: doc.path?.replace(/\/_dir$/, ''),
      changefreq: 'weekly'
    })
  }
  sitemap.end()
  return streamToPromise(sitemap)
})
