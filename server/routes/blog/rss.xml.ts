import { serverQueryContent } from '#content/server'
import * as cheerio from 'cheerio'
import { Feed } from 'feed'

const BaseUrl = 'https://nuxt.com'
const SiteUrl = `${BaseUrl}/blog`
const SiteName = 'The Nuxt Blog'
const SiteDescription =
  'Read the latest news about all Nuxt solutions, from framework announcements to integration tutorials.'
const SiteLanguage = 'en'
const Copyright = `Copyright © 2016-${ new Date().getFullYear() } Nuxt - MIT License`

export default defineEventHandler(async (event) => {
  const feed = new Feed({
    title: SiteName,
    description: SiteDescription,
    id: SiteUrl,
    link: SiteUrl,
    language: SiteLanguage,
    image: `${BaseUrl}/icon.png`,
    favicon: `${BaseUrl}/icon.png`,
    copyright: Copyright,
    feedLinks: {
      rss: `${SiteUrl}/rss.xml`
    }
  })

  const docs = await serverQueryContent(event)
    .sort({ date: -1 })
    .where({ _partial: false, _draft: false })
    .find()
  const blogs = docs.filter(
    (doc) => doc?._path?.includes('/blog/') && doc.title && doc.date
  )

  for (const blog of blogs) {
    const content = await $fetch<string>(blog._path)
    const $ = cheerio.load(content)
    const prose = $('.prose')
      .html()
      .replaceAll('<!--[-->', '')
      .replaceAll('<!--]-->', '')
      .replaceAll('<!---->', '')
      .replaceAll(/class="[^"]*"/g, '')

    feed.addItem({
      link: `https://nuxt.com${blog._path}`,
      title: blog.title,
      date: new Date(blog.date),
      description: blog.description,
      author: blog.authors,
      category: blog.category,
      content: prose
    })
  }

  appendHeader(event, 'Content-Type', 'application/xml')
  return feed.rss2()
})
