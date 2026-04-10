import { defineNuxtModule } from 'nuxt/kit'
import { AI_AGENT_UA_PATTERNS } from '@vercel/agent-readability'

function buildAgentUARegex(): string {
  return `(?i).*(${AI_AGENT_UA_PATTERNS.join('|')}).*`
}

function mdRewrite(nitro) {
  if (nitro.options.dev || !nitro.options.preset.includes('vercel')) {
    return
  }
  nitro.hooks.hook('compiled', async () => {
    const { resolve } = process.getBuiltinModule('node:path')
    const { readFile, writeFile }
      = process.getBuiltinModule('node:fs/promises')
    const vcJSON = resolve(nitro.options.output.dir, 'config.json')
    const vcConfig = JSON.parse(await readFile(vcJSON, 'utf8'))

    const agentUA = buildAgentUARegex()
    const agentHas = [{ type: 'header', key: 'user-agent', value: agentUA }]
    const acceptMd = [{ type: 'header', key: 'accept', value: '(.*)text/markdown(.*)' }]

    const skipPattern = '^(?!/api/|/_nuxt/|/__nuxt|/raw/|/agent-md/)(.*)$'

    // --- Catch-all Agent UA detection → rewrite to /agent-md/ ---
    vcConfig.routes.unshift({
      src: skipPattern,
      dest: '/agent-md/$1',
      has: agentHas
    })

    // --- Accept: text/markdown header → rewrite to /agent-md/ ---
    vcConfig.routes.unshift({
      src: skipPattern,
      dest: '/agent-md/$1',
      has: acceptMd
    })

    // --- Explicit .md extension requests → rewrite to /agent-md/ ---
    vcConfig.routes.unshift({
      src: '^/(.*)\\.md$',
      dest: '/agent-md/$1'
    })

    await writeFile(vcJSON, JSON.stringify(vcConfig, null, 2), 'utf8')
  })
}

export default defineNuxtModule((_options, nuxt) => {
  nuxt.hooks.hook('nitro:init', (nitro) => {
    mdRewrite(nitro)
  })
})
