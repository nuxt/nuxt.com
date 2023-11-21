import { serverQueryContent } from '#content/server'

import RSS from 'rss'

const feed = new RSS({
  title: 'The Nuxt Blog',
  description:
    'Read the latest news about all Nuxt solutions, from framework announcements to integration tutorials.',
  site_url: 'https://nuxt.com/blog',
  feed_url: 'https://nuxt.com/blog/rss.xml'
})

export default defineEventHandler(async (event) => {
  const docs = await serverQueryContent(event)
    .sort({ date: -1 })
    .where({ _partial: false, _draft: false })
    .find()
  const blogPosts = docs.filter(
    (doc) => doc?._path?.includes('/blog/') && doc.title && doc.date
  )

  blogPosts.forEach((doc) => {
    feed.item({
      url: `https://nuxt.com${doc._path}`,
      title: doc.title,
      date: doc.date,
      description: doc.description,
      author: doc.authors[0]?.name,
      categories: [doc.category]
    })
  })

  const feedString = feed.xml({ indent: true })

  event.node.res.setHeader('content-type', 'text/xml')
  event.node.res.end(feedString)
})
