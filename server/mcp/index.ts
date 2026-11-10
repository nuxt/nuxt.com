import { defineMcpServer } from '@nuxtjs/mcp-toolkit/server'
import { CURRENT_DOCS_VERSION } from '../../shared/utils/docs'

export default defineMcpServer({
  name: 'Nuxt',
  websiteUrl: `https://nuxt.com/docs/${CURRENT_DOCS_VERSION}/guide/ai/mcp`,
  icons: [
    { src: 'https://nuxt.com/icon.png', mimeType: 'image/png', sizes: ['64x64'] }
  ]
})
