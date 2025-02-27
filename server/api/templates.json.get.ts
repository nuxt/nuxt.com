/*
import { serverQueryContent } from '#content/server'

export default eventHandler(async (event) => {
  const { templates } = await serverQueryContent(event, '/templates').only('templates').findOne()

  return templates.map(template => ({
    slug: template.slug,
    name: template.name,
    description: template.description,
    screenshot: `https://nuxt.com/assets/templates/${template.slug}.png`,
    repo: template.repo,
    demo: template.demo,
    pricing: template.badge || 'Free'
  }))
})
*/
