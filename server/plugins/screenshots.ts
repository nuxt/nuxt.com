import { existsSync } from 'fs'
import { join } from 'pathe'
import captureWebsite from 'capture-website'

export default defineNitroPlugin(async (nitroApp) => {
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
  // const { templates } = await serverQueryContent(event, '/templates')
  //   .where({ _partial: false, _draft: false })
  //   .findOne()

  //   console.log('Generating screenshots for ', templates.map(t => t.slug))
  // const template = templates.find(t => t.slug === slug)
  // if (!template) {
  //   throw createError({
  //     statusCode: 400,
  //     message: 'Template not found'
  //   })
  // }

  // const url = template.screenshotUrl || template.demo
  // if (!url) {
  //   throw createError({
  //     statusCode: 400,
  //     message: 'Template has no `demo` or `screenshotUrl` to take a screenshot from'
  //   })
  // }

  // setHeader(event, 'content-type', 'image/png')
  // console.log(`Generating screenshot for ${template.slug} hitting ${url}...`)
  // return captureWebsite.buffer(url, {
  //   launchOptions: { headless: 'new' }
  // })
})
