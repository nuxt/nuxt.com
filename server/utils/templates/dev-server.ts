/**
 * What `nuxt dev` needs in a template sandbox, shared by the editing tools and `checkTemplatesWorkflow`, which warms it up before
 * snapshotting: Vite keeps the dependencies it bundled in `node_modules/.cache/vite`, and only bundles them again when its config changes.
 */

/** Where `nuxt dev` runs once the visitor edits the preview. Sandboxes only expose the ports they're created with. */
export const DEV_PORT = 3001
export const DEV_LOG = '/tmp/nuxt-dev.log'
/** The modules the app's first page imports before it starts, listed by the warmup and kept in the snapshot. */
export const DEV_MODULES = '/vercel/nuxt-com-dev-modules.json'

/**
 * DevTools' client pulls `@vue/devtools-core` in the browser only, after the warmup: Vite then re-bundles under the first page,
 * which stops receiving hot updates. The global rc turns it off without touching the template's files.
 * The check runs it too, so the dependencies it bundles match the editing server's config.
 */
export const DISABLE_DEVTOOLS = 'echo "devtools.enabled=false" > ~/.nuxtrc'

/**
 * Vite only finds the dependencies of lazy modules (`.client.vue` components, async pages) when a browser requests them, then re-bundles and reloads the page.
 * A page that loads mid-way keeps stale copies and can stay half rendered, so this requests the page and follows its module imports until the bundling settles.
 *
 * The check crawls every module. An editing server (`node warmup.mjs page`) starts from the check's snapshot, whose dependencies are
 * already bundled: it only transforms what the first page needs, and returns as soon as that's done.
 */
export const DEV_WARMUP_SCRIPT = `
const base = 'http://127.0.0.1:${DEV_PORT}'
const scope = process.argv[2]
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
const { readFileSync, statSync, writeFileSync } = await import('node:fs')
async function page() {
  let html = ''
  for (let i = 0; i < 120 && !html.includes('/_nuxt/'); i++) {
    html = await fetch(base + '/').then(response => response.text()).catch(() => '')
    if (!html.includes('/_nuxt/')) await wait(1000)
  }
  if (!html.includes('/_nuxt/')) throw new Error('The dev server did not render the app.')
  return html
}
// The server render waits on its worker for each module it imports, leaving Vite idle a third of the time: requesting the modules
// the check listed as soon as Vite answers gets the client ones transformed in the meantime.
async function prefetch() {
  let known = []
  try {
    known = JSON.parse(readFileSync('${DEV_MODULES}', 'utf8'))
  } catch {
    return
  }
  for (let i = 0; i < 480; i++) {
    const response = await fetch(base + '/_nuxt/@vite/client').catch(() => null)
    if (response?.ok && /javascript/.test(response.headers.get('content-type') || '')) break
    await wait(250)
  }
  await Promise.all(Array.from({ length: 16 }, async () => {
    while (known.length) await fetch(base + known.shift()).then(response => response.arrayBuffer()).catch(() => {})
  }))
}
const prefetched = scope === 'page' ? prefetch() : Promise.resolve()
// Counts the modules Vite answered 504 for: imports of a dependency bundle it replaced while the crawl ran.
async function crawl(html) {
  const seen = new Set()
  // \`PREVIEW_BOOT_GUARD\` adds the last list as preloads: they aren't entries, and following their dynamic imports would grow it each time.
  const entries = [...html.replace(/<link rel="modulepreload"[^>]*>/g, '').matchAll(/(?:src|href)="(\\/_nuxt\\/[^"]+)"/g)].map(match => match[1])
  const queue = [...entries]
  // Static imports: the page needs them all before it starts, while dynamic ones load with the routes and components that use them.
  const imports = new Map()
  let outdated = 0
  while (queue.length && seen.size < 8000) {
    const batch = queue.splice(0, 32).filter(url => !seen.has(url))
    batch.forEach(url => seen.add(url))
    await Promise.all(batch.map(async (url) => {
      const response = await fetch(base + url).catch(() => null)
      if (response?.status === 504) outdated++
      if (!response?.ok || !/javascript/.test(response.headers.get('content-type') || '')) return
      const code = await response.text()
      const all = [...code.matchAll(/(?:from|import)\\s*(\\(?)\\s*["'](\\/_nuxt\\/[^"'?]+(?:\\?[^"']*)?)["']/g)]
      // Nuxt's entry loads the app with a dynamic import, which the page needs too.
      const needed = all.filter(match => !match[1] || entries.includes(url)).map(match => match[2])
      imports.set(url, needed)
      for (const next of scope === 'page' ? needed : all.map(match => match[2])) {
        if (!seen.has(next)) queue.push(next)
      }
    }))
  }
  return { outdated, entries, imports }
}
// Large apps (Docus loads 2000+ modules in dev) only reveal some dependencies deep in the graph: a page loaded before Vite has
// bundled them all imports a bundle it then replaces, and fails to start. Crawling again until no import is outdated prevents it.
let graph
for (let pass = 0; pass < 4; pass++) {
  graph = await crawl(await page())
  if (graph.outdated === 0) break
  await wait(1000)
}
await prefetched
// The browser only finds a module's imports once it has fetched it, and each request through the sandbox proxy takes about 250ms:
// a page 35 imports deep takes 9s to start. Listing them all lets the dev server preload them at once (\`PREVIEW_BOOT_GUARD\`).
const modules = new Set()
const pending = graph.entries.flatMap(url => graph.imports.get(url) || [])
while (pending.length) {
  const url = pending.shift()
  if (modules.has(url) || graph.entries.includes(url)) continue
  modules.add(url)
  pending.push(...(graph.imports.get(url) || []))
}
writeFileSync('${DEV_MODULES}', JSON.stringify([...modules]))
// Without a re-bundle, Vite has nothing left to write and no reload to send.
if (scope === 'page' && graph.outdated === 0 && !/new dependencies|optimized dependencies/.test(readFileSync('${DEV_LOG}', 'utf8'))) process.exit(0)
let size = -1
for (let i = 0; i < 40; i++) {
  await wait(500)
  const next = statSync('${DEV_LOG}').size
  if (next === size) break
  size = next
}
// Vite keeps a full reload requested while no browser is connected (the crawl makes it re-bundle) and sends it to the first page that
// connects: that page reloads half way through its modules, and on large apps the second load can stall. Connecting once takes it instead.
const client = await fetch(base + '/_nuxt/@vite/client').then(response => response.text()).catch(() => '')
const token = client.match(/const wsToken = "([^"]*)"/)?.[1]
if (token !== undefined && typeof WebSocket === 'function') {
  await new Promise((resolve) => {
    const socket = new WebSocket(base.replace('http', 'ws') + '/_nuxt/?token=' + token, 'vite-hmr')
    const done = () => {
      socket.close()
      resolve()
    }
    socket.onmessage = () => setTimeout(done, 500)
    socket.onerror = () => resolve()
    setTimeout(done, 5000)
  })
}
`
