import { existsSync } from 'fs'
import { join } from 'pathe'
import captureWebsite from 'capture-website'

export default defineNitroPlugin(async (nitroApp) => {
  // only in dev
  if (!process.dev) return
  // @ts-ignore
  nitroApp.hooks.hook('content:file:afterParse', async (file) => {
    if (file._path !== '/templates') return

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
      console.log(`Generating screenshot for ${template.slug} hitting ${url}...`)
      await captureWebsite.file(url, filename, {
        ...(template.screenshotOptions || {}),
        launchOptions: { headless: 'new' }
      })
    }
  })
})
