/*
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
    .where('draft', '=', false)
    .andWhere('_partial', '=', false)
    .order('date', 'DESC')
    .all()
  console.log(articles)

  for (const article of articles) {
    feed.addItem({
      link: joinURL(baseUrl, article.path),
      image: joinURL(baseUrl, article.image),
      title: article.title,
      date: new Date(article.date),
      description: article.description,
      author: article.authors,
      category: article.category
    })
  }

  appendHeader(event, 'Content-Type', 'application/xml')
  return feed.rss2()
})
*/
