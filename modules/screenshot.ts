import { defineNuxtModule } from '@nuxt/kit'
import { existsSync } from 'node:fs'
import { join } from 'pathe'
import captureWebsite from 'capture-website'
import { kebabCase } from 'scule'

interface ContentFile {
  path: string
  data: Record<string, any>
  meta: { key: string, source: string }
}

export default defineNuxtModule((_options, nuxt) => {
  // Screenshots only belong in production builds — never during dev or `nuxt prepare`.
  if (nuxt.options.dev || nuxt.options._prepare) {
    return
  }

  nuxt.hooks.hook('nitro:init', (nitro) => {
    nitro.hooks.hook('compiled', async () => {
      const { content } = await import('../server/utils/content')

      await content.init()
      const items = await content.list(['local'])

      for (const item of items as ContentFile[]) {
        if (item.path.startsWith('/templates/')) {
          await captureTemplateScreenshot(item)
        } else if (item.path.startsWith('/video-courses/')) {
          await captureVideoCourseScreenshot(item)
        }
      }

      const showcaseItem = items.find((i: ContentFile) => i.path === '/showcase' || i.meta.key.includes('showcase.yml'))
      if (showcaseItem) {
        const fullFile = await content.get(showcaseItem.path)
        if (fullFile?.data?.websites) {
          await captureShowcaseScreenshots(fullFile.data.websites)
        }
      }
    })
  })
})

async function captureTemplateScreenshot(file: ContentFile) {
  const data = file.data
  const slug = data.slug || file.path.split('/').pop()
  const url = data.screenshotUrl || data.demo
  if (!url) {
    console.error(`Template ${slug} has no "demo" or "screenshotUrl" to take a screenshot from`)
    return
  }
  const filename = join(process.cwd(), 'public/assets/templates', `${slug}.webp`)
  if (existsSync(filename)) return

  console.log(`Generating screenshot for Template ${slug} hitting ${url}...`)
  await captureWebsite.file(url, filename, {
    ...(data.screenshotOptions || {}),
    launchOptions: { headless: true },
    width: 1280,
    height: 720,
    type: 'webp'
  })
}

async function captureVideoCourseScreenshot(file: ContentFile) {
  const data = file.data
  const slug = data.slug || file.path.split('/').pop()
  const url = data.screenshotUrl || data.url
  if (!url) {
    console.error(`Video Course ${slug} has no "url" or "screenshotUrl" to take a screenshot from`)
    return
  }
  const filename = join(process.cwd(), 'public/assets/video-courses', `${slug}.webp`)
  if (existsSync(filename)) return

  console.log(`Generating screenshot for Video Course ${slug} hitting ${url}...`)
  await captureWebsite.file(url, filename, {
    ...(data.screenshotOptions || {}),
    launchOptions: { headless: true },
    width: 1280,
    height: 720,
    type: 'webp'
  })
}

async function captureShowcaseScreenshots(websites: Array<{
  name: string
  url: string
  hostname: string
  screenshotUrl?: string
  screenshotOptions?: Record<string, any>
}>) {
  for (const website of websites) {
    const url = website.screenshotUrl || website.url
    if (!website.name) {
      throw new Error(`Showcase ${website.hostname} has no "name" to take a screenshot from`)
    }
    if (!url) {
      console.error(`Showcase ${website.name} has no "url" or "screenshotUrl" to take a screenshot from`)
      continue
    }
    if (website.screenshotUrl) continue

    const filename = join(process.cwd(), 'public/assets/websites', `${kebabCase(website.name.replace(/ /g, ''))}.webp`)
    if (existsSync(filename)) continue

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
