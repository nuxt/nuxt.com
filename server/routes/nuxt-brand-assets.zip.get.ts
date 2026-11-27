import { readdir, readFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { zipSync } from 'fflate'
import { defineHandler } from 'nuxt/server'

export default defineHandler(async (event) => {
  const dir = resolve(process.cwd(), 'public/assets/design-kit')
  const files = (await readdir(dir)).filter(file => /^(?:logo|icon)-.+\.(?:svg|png)$/.test(file))

  const entries: Record<string, Uint8Array> = {}
  for (const file of files) {
    const type = file.startsWith('logo-') ? 'logo' : 'icon'
    entries[`nuxt-brand-assets/${type}/${extname(file).slice(1)}/${file}`] = await readFile(resolve(dir, file))
  }

  event.res.headers.set('Content-Type', 'application/zip')
  event.res.headers.set('Content-Disposition', 'attachment; filename="nuxt-brand-assets.zip"')

  return zipSync(entries, { level: 9 })
})
