import { DEV_MODULES } from './dev-server'

/**
 * A client plugin written into template previews before they are built in a sandbox.
 *
 * Templates don't all install `@nuxtjs/color-mode` or share a Nuxt version, so it only uses what every Nuxt app has and must never throw.
 * It applies the color mode picked on nuxt.com, follows navigation requests, reports the current route, and tells the parent window whether the app mounted or crashed:
 * nuxt.com shows the crash instead of Nuxt's error page, and `checkTemplatesWorkflow` waits for it in a real browser.
 */
export const PREVIEW_BRIDGE_PLUGIN = `export default defineNuxtPlugin({
  name: 'nuxt-com-preview',
  enforce: 'pre',
  setup(nuxtApp) {
    const allowed = /^(https:\\/\\/([a-z0-9-]+\\.)*(nuxt\\.com|vercel\\.app)|http:\\/\\/localhost(:\\d+)?)$/
    const post = (type, message) => window.parent.postMessage({ source: 'nuxt-com-preview', type, message }, '*')
    const describe = error => String(error?.message || error?.statusMessage || error)
    // The router plugin runs after this one, so it is looked up on use.
    const router = () => nuxtApp.$router

    window.addEventListener('message', (event) => {
      if (!allowed.test(event.origin) || event.data?.source !== 'nuxt.com') return
      const { type, value } = event.data
      if (type === 'color-mode' && (value === 'light' || value === 'dark') && nuxtApp.$colorMode) nuxtApp.$colorMode.preference = value
      if (type === 'navigate' && typeof value === 'string' && value.startsWith('/')) router()?.push(value).catch(() => {})
    })

    nuxtApp.hook('app:error', error => post('error', describe(error)))
    nuxtApp.hook('app:mounted', () => setTimeout(() => {
      const error = nuxtApp.payload.error
      post(error ? 'error' : 'ready', error ? describe(error) : undefined)
      const current = router()
      if (!current) return
      post('route', current.currentRoute.value.fullPath)
      current.afterEach(to => post('route', to.fullPath))
    }))
  }
})
`

/**
 * A server plugin written into the dev server only. `nuxt dev` serves each module on its own, and a large app requests a
 * thousand at once through the sandbox proxy, which drops a few: the app then never starts, before the bridge above can run.
 * An inline script reports it, so nuxt.com loads the page again with most modules already cached.
 * It also preloads the modules the warmup found the first page imports, so the browser requests them at once instead of one import level at a time.
 */
export const PREVIEW_BOOT_GUARD = `import { readFileSync, statSync } from 'node:fs'

let preloads = { mtime: 0, links: '' }
function preloadLinks() {
  try {
    const mtime = statSync('${DEV_MODULES}').mtimeMs
    if (mtime !== preloads.mtime) {
      const links = JSON.parse(readFileSync('${DEV_MODULES}', 'utf8')).map(url => '<link rel="modulepreload" href="' + url.replace(/"/g, '&quot;') + '">')
      preloads = { mtime, links: links.join('') }
    }
  } catch {
    return ''
  }
  return preloads.links
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html) => {
    html.head.push(preloadLinks())
    html.head.unshift(\`<script>addEventListener('unhandledrejection', function (event) {
  var message = String(event.reason && event.reason.message || event.reason)
  if (window.parent !== window && /dynamically imported module|Importing a module script failed/i.test(message)) {
    window.parent.postMessage({ source: 'nuxt-com-preview', type: 'boot-failed', message: message.slice(0, 300) }, '*')
  }
})</script>\`)
  })
})
`
