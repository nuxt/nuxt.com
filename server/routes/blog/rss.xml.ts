import { Feed } from 'feed'
import { joinURL } from 'ufo'

export default defineEventHandler(async (event) => {
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

  const articles = await queryCollection(event, 'blog')
    .order('date', 'DESC')
    .all()

  for (const article of articles) {
    if (article.draft) {
      continue
    }
    feed.addItem({
      link: joinURL(baseUrl, article.path),
      image: joinURL(baseUrl, article.image),
      title: article.title,
      date: new Date(article.date),
      description: article.description
      // author: article.authors, FIXME: not present in the final rss feed (even in the old one)
      // category: article.category
    })
  }

  appendHeader(event, 'Content-Type', 'application/xml')
  return feed.rss2()
})
