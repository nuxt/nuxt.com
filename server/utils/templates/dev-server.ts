/**
 * What `nuxt dev` needs in a template sandbox. `checkTemplatesWorkflow` runs it once before snapshotting: Vite keeps the
 * dependencies it bundled in `node_modules/.cache/vite`, and only bundles them again when its config changes, so a preview that
 * starts `nuxt dev` from the snapshot skips most of its startup.
 */

/** Where `nuxt dev` runs in a template sandbox, next to the production build. Sandboxes only expose the ports they're created with. */
export const DEV_PORT = 3001
export const DEV_LOG = '/tmp/nuxt-dev.log'

/**
 * DevTools' client pulls `@vue/devtools-core` in the browser only, after the warmup: Vite then re-bundles under the first page,
 * which stops receiving hot updates. The global rc turns it off without touching the template's files.
 * Every `nuxt dev` of a sandbox runs with it, so the dependencies the check bundles match the config of the servers that reuse them.
 */
export const DISABLE_DEVTOOLS = 'echo "devtools.enabled=false" > ~/.nuxtrc'

/**
 * Vite only finds the dependencies of lazy modules (`.client.vue` components, async pages) when a browser requests them, then re-bundles and reloads the page.
 * A page that loads mid-way keeps stale copies and can stay half rendered, so this requests the page and follows its module imports until the bundling settles.
 */
export const DEV_WARMUP_SCRIPT = `
const base = 'http://127.0.0.1:${DEV_PORT}'
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
async function page() {
  let html = ''
  for (let i = 0; i < 120 && !html.includes('/_nuxt/'); i++) {
    html = await fetch(base + '/').then(response => response.text()).catch(() => '')
    if (!html.includes('/_nuxt/')) await wait(1000)
  }
  return html
}
// Returns how many modules Vite answered 504 for: imports of a dependency bundle it replaced while the crawl ran.
async function crawl(html) {
  const seen = new Set()
  const queue = [...html.matchAll(/(?:src|href)="(\\/_nuxt\\/[^"]+)"/g)].map(match => match[1])
  let outdated = 0
  while (queue.length && seen.size < 8000) {
    const batch = queue.splice(0, 32).filter(url => !seen.has(url))
    batch.forEach(url => seen.add(url))
    await Promise.all(batch.map(async (url) => {
      const response = await fetch(base + url).catch(() => null)
      if (response?.status === 504) outdated++
      if (!response?.ok || !/javascript/.test(response.headers.get('content-type') || '')) return
      const code = await response.text()
      for (const match of code.matchAll(/(?:from|import)\\s*\\(?\\s*["'](\\/_nuxt\\/[^"'?]+(?:\\?[^"']*)?)["']/g)) {
        if (!seen.has(match[1])) queue.push(match[1])
      }
    }))
  }
  return outdated
}
// Large apps (Docus loads 2000+ modules in dev) only reveal some dependencies deep in the graph: a page loaded before Vite has
// bundled them all imports a bundle it then replaces, and fails to start. Crawling again until no import is outdated prevents it.
for (let pass = 0; pass < 4; pass++) {
  if (await crawl(await page()) === 0) break
  await wait(1000)
}
const { statSync } = await import('node:fs')
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
