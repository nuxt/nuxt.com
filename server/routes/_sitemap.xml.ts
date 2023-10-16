// TODO: Update later
import { SitemapStream, streamToPromise } from 'sitemap'
import { H3Event } from 'h3'
import { serverQueryContent } from '#content/server'

export default defineEventHandler(async (event: H3Event) => {
  const docs = await serverQueryContent(event).find()

  const sitemap = new SitemapStream({
    hostname: 'https://nuxt.com'
  })
  for (const doc of docs) {
    sitemap.write({
      url: doc._path?.replace(/\/_dir$/, ''),
      changefreq: 'weekly'
    })
  }
  sitemap.end()
  return streamToPromise(sitemap)
})
