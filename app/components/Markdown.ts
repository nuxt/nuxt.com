import shiki from '@comark/nuxt/plugins/shiki'

/**
 * Site-wide Markdown renderer with Shiki — used for raw markdown strings
 * (homepage hero tabs, etc.) that are not pre-parsed by comark-content.
 */
export default defineMarkdownComponent({
  name: 'Markdown',
  plugins: [
    shiki()
  ]
})
