/**
 * A client plugin written into template previews before they are built in a sandbox.
 *
 * Templates don't all install `@nuxtjs/color-mode` or share a Nuxt version, so it only uses what every Nuxt app has and must never throw.
 * It applies the color mode picked on nuxt.com, and tells the parent window whether the app mounted or crashed:
 * nuxt.com shows the crash instead of Nuxt's error page, and `checkTemplatesWorkflow` waits for it in a real browser.
 */
export const PREVIEW_BRIDGE_PLUGIN = `export default defineNuxtPlugin({
  name: 'nuxt-com-preview',
  enforce: 'pre',
  setup(nuxtApp) {
    const allowed = /^(https:\\/\\/([a-z0-9-]+\\.)*(nuxt\\.com|vercel\\.app)|http:\\/\\/localhost(:\\d+)?)$/
    const post = (type, message) => window.parent.postMessage({ source: 'nuxt-com-preview', type, message }, '*')
    const describe = error => String(error?.message || error?.statusMessage || error)

    window.addEventListener('message', (event) => {
      if (!allowed.test(event.origin) || event.data?.source !== 'nuxt.com') return
      const { type, value } = event.data
      if (type === 'color-mode' && (value === 'light' || value === 'dark') && nuxtApp.$colorMode) nuxtApp.$colorMode.preference = value
    })

    nuxtApp.hook('app:error', error => post('error', describe(error)))
    nuxtApp.hook('app:mounted', () => setTimeout(() => {
      const error = nuxtApp.payload.error
      post(error ? 'error' : 'ready', error ? describe(error) : undefined)
    }))
  }
})
`
