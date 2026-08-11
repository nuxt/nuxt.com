import { Feed } from 'feed'
import { joinURL } from 'ufo'
import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  const baseUrl = 'https://nuxt.com'
  const siteUrl = joinURL(baseUrl, 'blog')
  const feed = new Feed({
    title: 'The Nuxt Blog',
    description: 'News and updates about Nuxt.',
    id: siteUrl,
    link: siteUrl,
    language: 'en',
    image: joinURL(baseUrl, 'icon.png'),
    favicon: joinURL(baseUrl, 'favicon.png'),
    copyright: `Copyright © 2016-${new Date().getFullYear()} Nuxt All Rights Reserved`,
    feedLinks: {
      rss: `${siteUrl}/rss.xml`
    }
  })

  const articles = await content.list(['local'])

  const blogPosts = articles
    .filter(a => a.path.startsWith('/blog/') && a.path !== '/blog')
    .sort((a, b) => {
      const dateA = (a.data as { date?: string }).date || ''
      const dateB = (b.data as { date?: string }).date || ''
      return dateB.localeCompare(dateA)
    })

  for (const article of blogPosts) {
    const data = article.data as { draft?: boolean, title?: string, description?: string, date?: string, image?: string, category?: string }
    if (data.draft) {
      continue
    }
    feed.addItem({
      link: joinURL(baseUrl, article.path),
      image: data.image ? joinURL(baseUrl, data.image) : undefined,
      title: data.title || '',
      date: new Date(data.date || ''),
      description: data.description,
      category: data.category ? [{ name: data.category }] : undefined
    })
  }

  appendHeader(event, 'Content-Type', 'application/xml')
  return feed.rss2()
})
