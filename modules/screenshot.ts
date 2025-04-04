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
  groups?: Array<{
    name: string
    icon: string
    showcases: Array<{
      name: string
      url: string
      hostname: string
      screenshotUrl?: string
    }>
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

    if (file.id?.includes('showcase.yml') && file.groups) {
      for (const group of file.groups) {
        for (const showcase of group.showcases) {
          const url = showcase.screenshotUrl || showcase.url
          const name = showcase.name?.toLowerCase() || showcase.hostname
          if (!url) {
            console.error(`Showcase ${name} has no "url" or "screenshotUrl" to take a screenshot from`)
            continue
          }
          if (showcase.screenshotUrl) {
            continue
          }

          const filename = join(process.cwd(), 'public/assets/showcase', `${name}.png`)
          if (existsSync(filename)) {
            continue
          }

          console.log(`Generating screenshot for Showcase ${name} hitting ${url}...`)
          await captureWebsite.file(url, filename, {
            launchOptions: { headless: true },
            width: 1920,
            height: 960
          })
        }
      }
    }
  })
})
