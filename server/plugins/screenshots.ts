import { existsSync } from 'node:fs'
import { join } from 'pathe'
import captureWebsite from 'capture-website'

export default defineNitroPlugin(async (nitroApp) => {
  // only in dev
  if (!import.meta.dev) return
  nitroApp.hooks.hook('content:file:afterParse', async (file) => {
    if (file._path === '/templates') {
      for (const template of file.templates) {
        const url = template.screenshotUrl || template.demo
        if (!url) {
          console.error(`Template ${template.slug} has no "demo" or "screenshotUrl" to take a screenshot from`)
          continue
        }
        const filename = join(process.cwd(), 'public/assets/templates', `${template.slug}.png`)
        if (existsSync(filename)) {
          continue
        }
        console.log(`Generating screenshot for Template ${template.slug} hitting ${url}...`)
        await captureWebsite.file(url, filename, {
          ...(template.screenshotOptions || {}),
          launchOptions: { headless: 'new' }
        })
      }
    }
    if (file._path === '/video-courses') {
      for (const course of file.courses) {
        const url = course.screenshotUrl || course.url
        if (!url) {
          console.error(`Video Course ${course.slug} has no "url" or "screenshotUrl" to take a screenshot from`)
          continue
        }
        const filename = join(process.cwd(), 'public/assets/video-courses', `${course.slug}.png`)
        if (existsSync(filename)) {
          continue
        }
        console.log(`Generating screenshot for Video Course ${course.slug} hitting ${url}...`)
        await captureWebsite.file(url, filename, {
          ...(course.screenshotOptions || {}),
          launchOptions: { headless: 'new' },
          width: 1920,
          height: 960
        })
      }
    }
  })
})
