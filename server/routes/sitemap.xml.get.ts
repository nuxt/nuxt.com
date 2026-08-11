// TODO: Update later
import { SitemapStream, streamToPromise } from 'sitemap'
import { docsSourceGroups } from '#shared/utils/docs'

export default defineEventHandler(async (event) => {
  // TODO: add docsv5 to sitemap when Nuxt 5 is released
  const [docsItems, blogItems] = await Promise.all([
    content.list([...docsSourceGroups.docsv4]),
    content.list(['local'])
  ])

  const docs = docsItems.filter(d => d.meta.extension === '.md' && !d.path.endsWith('.navigation'))
  const blog = blogItems
    // `draft` is absent from generated types (no published post carries it)
    .filter(b => b.path.startsWith('/blog/') && b.path !== '/blog' && !(b.data as { draft?: boolean }).draft)

  const sitemap = new SitemapStream({
    hostname: getSiteUrl(event)
  })
  const today = new Date().toISOString().split('T')[0]
  for (const doc of docs) {
    sitemap.write({
      url: doc.path,
      changefreq: 'weekly',
      lastmod: today
    })
  }
  for (const doc of blog) {
    const date = doc.data.date
    sitemap.write({
      url: doc.path,
      changefreq: 'monthly',
      lastmod: date || today
    })
  }
  sitemap.end()
  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return streamToPromise(sitemap)
})
