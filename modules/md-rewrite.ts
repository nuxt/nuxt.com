import { defineNuxtModule } from 'nuxt/kit'
import type { Nitro } from 'nitropack'

const AGENT_UA_PATTERN
  = '.*(ClaudeBot|Claude-Web|anthropic-ai|GPTBot|ChatGPT-User|OAI-SearchBot|Google-Extended|Google-CloudVertexBot|Meta-ExternalAgent|Meta-ExternalFetcher|PerplexityBot|YouBot|DeepSeekBot|Amazonbot|cohere-ai|AI2Bot|Applebot-Extended|Bytespider).*'

const ACCEPT_MD = { type: 'header', key: 'accept', value: '(.*)text/markdown(.*)' }
const AGENT_UA = { type: 'header', key: 'user-agent', value: AGENT_UA_PATTERN }

function mdRewrite(nitro: Nitro) {
  if (nitro.options.dev || !nitro.options.preset.includes('vercel')) {
    return
  }
  nitro.hooks.hook('compiled', async () => {
    const { resolve } = process.getBuiltinModule('node:path')
    const { readFile, writeFile }
      = process.getBuiltinModule('node:fs/promises')
    // We edit .vercel/output/config.json (Vercel Build Output API v3),
    // NOT vercel.json — different schema. The `check: true` flag below
    // is documented on the Source route type here:
    // https://vercel.com/docs/build-output-api/configuration
    const vcJSON = resolve(nitro.options.output.dir, 'config.json')
    const vcConfig = JSON.parse(await readFile(vcJSON, 'utf8'))

    // Static .md aliases — let users hit /docs/foo.md, /blog/foo.md, /deploy/foo.md directly.
    // The /docs source pattern excludes /docs/5.x/* to align with /robots.txt
    // (v5 is nightly and disallowed until Nuxt 5 ships).
    const staticAliases = [
      { src: '^/docs/(?!5\\.x/)(.+)\\.md$', dest: '/raw/docs/$1.md' },
      { src: '^/blog/(.+)\\.md$', dest: '/raw/blog/$1.md' },
      { src: '^/deploy/(.+)\\.md$', dest: '/raw/deploy/$1.md' }
    ]

    // Content-negotiated rewrites — fire on Accept: text/markdown OR known agent UAs.
    const negotiated: Array<{ src: string, dest: string }> = [
      { src: '^/?$', dest: '/raw/index.md' },
      { src: '^/docs/(?!5\\.x/)(.+)$', dest: '/raw/docs/$1.md' },
      { src: '^/blog/(.+)$', dest: '/raw/blog/$1.md' },
      { src: '^/deploy/(.+)$', dest: '/raw/deploy/$1.md' },
      { src: '^/modules/?$', dest: '/modules.md' },
      { src: '^/changelog/?$', dest: '/changelog.md' }
    ]

    const rewrites: any[] = []
    for (const r of staticAliases) {
      rewrites.push({ ...r, check: true })
    }
    for (const r of negotiated) {
      rewrites.push({ ...r, has: [ACCEPT_MD], check: true })
      rewrites.push({ ...r, has: [AGENT_UA], check: true })
    }

    vcConfig.routes.unshift(...rewrites)
    await writeFile(vcJSON, JSON.stringify(vcConfig, null, 2), 'utf8')
  })
}

export default defineNuxtModule((_options, nuxt) => {
  nuxt.hooks.hook('nitro:init', (nitro) => {
    mdRewrite(nitro)
  })
})
