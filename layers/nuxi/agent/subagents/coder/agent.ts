import { defineAgent, defineDynamic } from 'eve'
import { canUseGithubTools } from '../../lib/github.js'
import { nuxiGatewayOptions, nuxiGatewayTags } from '../../lib/gateway-attribution.js'

// Offered only where the GitHub tools are allowed, so web chat and public Discord channels never
// see it. eve runs this before every parent model call, hence the per-turn memo: on Discord,
// `canUseGithubTools` reads Global Config. The root agent's `approval` and `limits.sessionUsage`
// apply here too, and `tools/` turns off eve's sandbox tools: it changes code through the GitHub API
// only, and keeps `web_search` and `web_fetch` to read docs and issues.
export default defineDynamic(async (ctx) => {
  const auth = ctx.session.auth.current
  if (!(await ctx.memo(ctx.turn?.id ?? null, () => canUseGithubTools(auth)))) return null

  return defineAgent({
    description: 'Nuxi\'s coding agent for nuxt.com, the nuxt/nuxt.com repository. Hand it any coding task there: a fix, a feature, a content or docs change, or a question about how the code works. It reads and searches the repository and the web, makes the change on a new `nuxi/*` branch, and opens a pull request when it is done. It does not see this conversation, so the message must hold the full task, links or excerpts from the thread, and the name of the person asking.',
    model: 'anthropic/claude-opus-5.5',
    modelOptions: {
      providerOptions: {
        gateway: { ...nuxiGatewayOptions(auth, []), tags: [...nuxiGatewayTags(auth, []), 'feature:coder'] },
        anthropic: { thinking: { type: 'adaptive' }, effort: 'medium' }
      }
    }
  })
})
