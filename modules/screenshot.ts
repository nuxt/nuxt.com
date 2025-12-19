import { defineNuxtModule } from '@nuxt/kit'
import { existsSync } from 'node:fs'
import { join } from 'pathe'
import captureWebsite from 'capture-website'
import { kebabCase } from 'scule'

interface ContentFile {
  id?: string
  slug?: string
  screenshotUrl?: string
  demo?: string
  url?: string
  screenshotOptions?: Record<string, any>
  websites?: Array<{
    name: string
    url: string
    hostname: string
    screenshotUrl?: string
    screenshotOptions?: Record<string, any>
  }>
}

export default defineNuxtModule((options, nuxt) => {
  nuxt.hook('content:file:afterParse', async ({ content: file }: { content: ContentFile }) => {
    // Handle individual template files
    if (file.id?.includes('/templates/')) {
      const template = file
      const url = template.screenshotUrl || template.demo
      if (!url) {
        console.error(`Template ${template.slug} has no "demo" or "screenshotUrl" to take a screenshot from`)
        return
      }
      const filename = join(process.cwd(), 'public/assets/templates', `${template.slug}.webp`)
      if (existsSync(filename)) {
        return
      }
      console.log(`Generating screenshot for Template ${template.slug} hitting ${url}...`)
      await captureWebsite.file(url, filename, {
        ...(template.screenshotOptions || {}),
        launchOptions: { headless: true },
        width: 1280,
        height: 720,
        type: 'webp'
      })
    }

    // Handle individual video course files
    if (file.id?.includes('/video-courses/')) {
      const course = file
      const url = course.screenshotUrl || course.url
      if (!url) {
        console.error(`Video Course ${course.slug} has no "url" or "screenshotUrl" to take a screenshot from`)
        return
      }
      const filename = join(process.cwd(), 'public/assets/video-courses', `${course.slug}.webp`)
      if (existsSync(filename)) {
        return
      }
      console.log(`Generating screenshot for Video Course ${course.slug} hitting ${url}...`)
      await captureWebsite.file(url, filename, {
        ...(course.screenshotOptions || {}),
        launchOptions: { headless: true },
        width: 1280,
        height: 720,
        type: 'webp'
      })
    }

    if (file.id?.includes('showcase.yml') && file.websites) {
      for (const website of file.websites) {
        const url = website.screenshotUrl || website.url
        if (!website.name) {
          throw new Error(`Showcase ${website.hostname} has no "name" to take a screenshot from`)
          continue
        }
        if (!url) {
          console.error(`Showcase ${website.name} has no "url" or "screenshotUrl" to take a screenshot from`)
          continue
        }
        if (website.screenshotUrl) {
          continue
        }

        const filename = join(process.cwd(), 'public/assets/websites', `${kebabCase(website.name.replace(/ /g, ''))}.webp`)
        if (existsSync(filename)) {
          continue
        }

        console.log(`Generating screenshot for Showcase ${website.name} hitting ${url}...`)
        await captureWebsite.file(url, filename, {
          ...(website.screenshotOptions || {}),
          launchOptions: { headless: true },
          width: 1280,
          height: 720,
          type: 'webp',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
        }).catch((err) => {
          console.warn(`Could not generate screenshot for ${url}: ${err.message}`)
        })
      }
    }
  })
})
