import { existsSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { defineNuxtModule } from '@nuxt/kit'
import { join } from 'pathe'
import captureWebsite from 'capture-website'
import { kebabCase } from 'scule'
import { parseYAML } from 'confbox/yaml'

interface ScreenshotOptions {
  slug?: string
  name?: string
  url?: string
  demo?: string
  screenshotUrl?: string
  screenshotOptions?: Record<string, any>
}

const CONTENT_DIR = join(process.cwd(), 'content')

/** Every `.yml` directly under `content/<dir>` (`templates/`, `video-courses/`), parsed. */
async function readYamlDir(dir: string): Promise<ScreenshotOptions[]> {
  const path = join(CONTENT_DIR, dir)
  if (!existsSync(path)) return []

  const files = (await readdir(path)).filter(file => file.endsWith('.yml'))

  return Promise.all(files.map(async file => parseYAML<ScreenshotOptions>(await readFile(join(path, file), 'utf8'))))
}

async function capture(url: string, filename: string, label: string, options: Record<string, any> = {}): Promise<void> {
  if (existsSync(filename)) return

  console.log(`Generating screenshot for ${label} hitting ${url}...`)
  await captureWebsite.file(url, filename, {
    ...options,
    launchOptions: { headless: true },
    width: 1280,
    height: 720,
    type: 'webp'
  })
}

/**
 * Screenshots for templates, video courses and showcase sites — build-time only, no runtime
 * impact. Reads `content/` directly (no content hook to plug into any more): skips anything
 * whose `.webp` already exists, so this is a no-op for every entry already committed.
 */
export default defineNuxtModule(async () => {
  const templates = await readYamlDir('templates')
  for (const template of templates) {
    const url = template.screenshotUrl || template.demo
    if (!url) {
      console.error(`Template ${template.slug} has no "demo" or "screenshotUrl" to take a screenshot from`)
      continue
    }
    await capture(url, join(process.cwd(), 'public/assets/templates', `${template.slug}.webp`), `Template ${template.slug}`, template.screenshotOptions)
  }

  const videoCourses = await readYamlDir('video-courses')
  for (const course of videoCourses) {
    const url = course.screenshotUrl || course.url
    if (!url) {
      console.error(`Video Course ${course.slug} has no "url" or "screenshotUrl" to take a screenshot from`)
      continue
    }
    await capture(url, join(process.cwd(), 'public/assets/video-courses', `${course.slug}.webp`), `Video Course ${course.slug}`, course.screenshotOptions)
  }

  const showcasePath = join(CONTENT_DIR, 'showcase.yml')
  if (existsSync(showcasePath)) {
    const showcase = parseYAML<{ websites?: ScreenshotOptions[] }>(await readFile(showcasePath, 'utf8'))
    for (const website of showcase.websites ?? []) {
      if (!website.name) {
        console.error('Showcase entry has no "name" to take a screenshot from')
        continue
      }
      // An explicit `screenshotUrl` already points at a hosted image — nothing to capture.
      if (website.screenshotUrl) continue
      if (!website.url) {
        console.error(`Showcase ${website.name} has no "url" or "screenshotUrl" to take a screenshot from`)
        continue
      }

      const filename = join(process.cwd(), 'public/assets/websites', `${kebabCase(website.name.replace(/ /g, ''))}.webp`)
      await capture(website.url, filename, `Showcase ${website.name}`, website.screenshotOptions).catch((err) => {
        console.warn(`Could not generate screenshot for ${website.url}: ${err.message}`)
      })
    }
  }
})
