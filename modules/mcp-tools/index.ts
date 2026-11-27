import { addTemplate, addTypeTemplate, defineNuxtModule, updateTemplates } from '@nuxt/kit'
import { join } from 'pathe'
import { listMcpTools } from './list'

const FILENAME = 'mcp-tools.mjs'

/**
 * Exposes the public MCP tool names and folders as `#build/mcp-tools.mjs`,
 * so `/agents` lists what `/mcp` serves without shipping `server/` to the client.
 */
export default defineNuxtModule({
  meta: { name: 'mcp-tools' },
  setup(_options, nuxt) {
    const serverDir = nuxt.options.serverDir

    addTemplate({
      filename: FILENAME,
      getContents: () => `export default ${JSON.stringify(listMcpTools(serverDir))}`
    })

    addTypeTemplate({
      filename: 'types/mcp-tools.d.ts',
      getContents: () => `declare module '#build/${FILENAME}' {
  const list: import('${join(nuxt.options.rootDir, 'modules/mcp-tools/list')}').McpToolsList
  export default list
}
export {}
`
    })

    nuxt.hook('builder:watch', async (_event, path) => {
      if (path.includes('mcp/')) {
        await updateTemplates({ filter: template => template.filename === FILENAME })
      }
    })
  }
})
