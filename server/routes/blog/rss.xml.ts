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

  const articles = (await content.list('blog-list'))
    .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())

  for (const article of articles) {
    feed.addItem({
      link: joinURL(baseUrl, article.path),
      image: joinURL(baseUrl, article.data.image),
      title: article.data.title,
      date: new Date(article.data.date),
      description: article.data.description,
      category: [{
        name: article.data.category
      }]
      // author: article.data.authors, INF0: Cannot work without an email field in the author object https://github.com/jpmonette/feed/issues/141
    })
  }

  appendHeader(event, 'Content-Type', 'application/xml')
  return feed.rss2()
})
