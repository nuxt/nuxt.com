import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterAll, test } from 'vitest'
import { buildSnapshot, compareSnapshots } from './report.mjs'

const temporaryDirectories = []

afterAll(async () => {
  await Promise.all(temporaryDirectories.map(directory => rm(directory, { force: true, recursive: true })))
})

test('builds and compares production bundle snapshots', async () => {
  const root = await mkdtemp(join(tmpdir(), 'nuxt-bundle-size-'))
  temporaryDirectories.push(root)

  const publicDir = join(root, '.output/public')
  const assetDir = join(publicDir, '_nuxt')
  const analyzePath = join(root, '.nuxt/analyze/client.json')
  await mkdir(assetDir, { recursive: true })
  await mkdir(join(root, '.nuxt/analyze'), { recursive: true })
  await writeFile(join(assetDir, 'entry.js'), 'console.log("entry")')
  await writeFile(join(assetDir, 'entry.css'), 'body { color: green }')
  await writeFile(join(assetDir, 'entry.js.map'), '{}')
  await writeFile(join(publicDir, 'index.html'), '<link rel="stylesheet" href="/_nuxt/entry.css"><script src="/_nuxt/entry.js"></script>')
  await writeFile(analyzePath, JSON.stringify({
    nodeParts: {
      part: {
        renderedLength: 100,
        gzipLength: 80,
        brotliLength: 60
      }
    },
    nodeMetas: {
      module: {
        id: join(root, 'node_modules/example/index.js'),
        moduleParts: { 'entry.js': 'part' }
      }
    }
  }))

  const base = await buildSnapshot({ root, analyzePath, label: 'base', sha: 'a'.repeat(40) })
  const head = structuredClone(base)
  head.sha = 'b'.repeat(40)
  head.totals.javascript.brotli += 10
  head.totals.javascript.gzip += 12
  head.totals.all.brotli += 10
  head.totals.all.gzip += 12
  head.modules['node_modules/example/index.js'].brotli += 10

  assert.equal(base.assets['_nuxt/entry.js.map'], undefined)
  assert.equal(base.routes['/'].raw, base.totals.javascript.raw + base.totals.css.raw)
  assert.equal(base.modules['node_modules/example/index.js'].brotli, 60)

  const report = compareSnapshots(base, head)
  assert.match(report, /Client JavaScript/)
  assert.match(report, /Largest module increases/)
  assert.match(report, /report-only/)

  const reportWithoutRoutes = compareSnapshots(
    { ...base, routes: {} },
    { ...head, routes: {} }
  )
  assert.doesNotMatch(reportWithoutRoutes, /Initial route/)
  assert.doesNotMatch(reportWithoutRoutes, /Initial-route values/)
})
