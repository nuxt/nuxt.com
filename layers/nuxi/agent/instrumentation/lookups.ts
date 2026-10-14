import { defineInstrumentation } from 'eve/instrumentation'
import { initLogger, log } from 'evlog'

/**
 * Tools that only read public nuxt.com data and take identifiers or short
 * filters (paths, slugs, search terms the model picks) as arguments. Tools
 * whose arguments are written from the user's message (`search_github_issues`,
 * `web_search`, `show_prompt`) are left out.
 */
const PUBLIC_TOOLS = new Set([
  // nuxt-mcp
  'get-blog-post',
  'get-changelog',
  'get-deploy-provider',
  'get-documentation-page',
  'get-getting-started-guide',
  'get-module',
  'list-blog-posts',
  'list-deploy-providers',
  'list-documentation-pages',
  'list-modules',
  // Cards
  'show_blog_post',
  'show_hosting',
  'show_module',
  'show_template'
])

export function lookupTool(toolName: string): string | undefined {
  const tool = toolName.replace(/^nuxt-mcp__/, '')
  return PUBLIC_TOOLS.has(tool) ? tool : undefined
}

initLogger({
  env: { service: 'nuxi', environment: process.env.VERCEL_ENV ?? 'development' },
  pretty: process.env.VERCEL ? false : undefined
})

/**
 * What the agent looked up on nuxt.com, one runtime log line per call, so the
 * docs team can see which pages, modules and posts answers lean on. eve keeps
 * these arguments out of Agent Runs for non-public chats.
 */
export default defineInstrumentation({
  tracePolicy: () => ({ emit: true, recordInputs: true, recordOutputs: false }),
  events: {
    'tool.call.started': (event) => {
      const tool = lookupTool(event.toolName)
      if (!tool) return
      log.info({
        action: 'nuxi.lookup',
        tool,
        input: event.input,
        sessionId: event.scope.sessionId
      })
    }
  }
})
