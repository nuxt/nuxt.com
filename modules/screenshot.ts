import { defineNuxtModule } from '@nuxt/kit'
import { existsSync } from 'node:fs'
import { join } from 'pathe'
import captureWebsite from 'capture-website'

interface ContentFile {
  id?: string
  slug?: string
  screenshotUrl?: string
  demo?: string
  url?: string
  screenshotOptions?: Record<string, any>
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
      const filename = join(process.cwd(), 'public/assets/templates', `${template.slug}.png`)
      if (existsSync(filename)) {
        return
      }
      console.log(`Generating screenshot for Template ${template.slug} hitting ${url}...`)
      await captureWebsite.file(url, filename, {
        ...(template.screenshotOptions || {}),
        launchOptions: { headless: true }
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
      const filename = join(process.cwd(), 'public/assets/video-courses', `${course.slug}.png`)
      if (existsSync(filename)) {
        return
      }
      console.log(`Generating screenshot for Video Course ${course.slug} hitting ${url}...`)
      await captureWebsite.file(url, filename, {
        ...(course.screenshotOptions || {}),
        launchOptions: { headless: true },
        width: 1920,
        height: 960
      })
    }
  })
})
