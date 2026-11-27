import { defineAgent, defineDynamic } from 'eve'
import { canUseGithubTools, GITHUB_REPOSITORIES } from '../../lib/github.js'
import { nuxiGatewayOptions, nuxiGatewayTags } from '../../lib/gateway-attribution.js'

// Offered only where the GitHub tools are allowed, so web chat and public Discord channels never
// see it. eve runs this before every parent model call, hence the per-turn memo: on Discord,
// `canUseGithubTools` reads Global Config. The root agent's `approval` and `limits.sessionUsage`
// apply here too. `sandbox.ts` gives it a browser, driven by `extensions/browser/` and the capture
// tools in `tools/`, and what it takes to clone a repository of `GITHUB_REPOSITORIES` and run it.
// The sandbox holds no credentials: a change made in a checkout reaches GitHub through
// `commit_changes`, in the app runtime. It keeps `web_search` and `web_fetch` to read docs and issues.
export default defineDynamic(async (ctx) => {
  const auth = ctx.session.auth.current
  if (!(await ctx.memo(ctx.turn?.id ?? null, () => canUseGithubTools(auth)))) return null

  return defineAgent({
    description: `Nuxi's coding agent for these GitHub repositories: ${GITHUB_REPOSITORIES.join(', ')}. Hand it any coding task there: a fix, a feature, a refactor, a performance or content change, a new showcase site or template with its screenshot and logo, or a question about how the code works. It clones the repository into its own sandbox, where it searches and changes the code, installs the project, runs its dev server, tests and checks, and looks at the running app in a browser. It can also clone and run any other public GitHub repository, such as a reproduction linked in an issue, and it reads the web. When the task changes files, it makes the change on a new \`nuxi/*\` branch and opens a pull request, with the screenshots and short clips of the running app that show the change. Hand it any capture task too: it has the only browser, so only it can open a public page, or a page of an app it runs, and say what it sees, take a screenshot (\`capture_screenshot\`) or record a short clip (\`record_video\`), and attach each to the repository, which gives it a link (\`publish_media\`). A task that changes no file opens no pull request, and a capture's link opens for everyone only once a pull request embeds it. It does not see this conversation or its attachments, so the message must hold the full task, links or excerpts from the thread, and the name of the person asking. When the task needs a file attached here, such as an image to put on the site, call \`share_attachments\` first and name the file in the message.`,
    model: 'anthropic/claude-opus-5.5',
    modelOptions: {
      providerOptions: {
        gateway: { ...nuxiGatewayOptions(auth, []), tags: [...nuxiGatewayTags(auth, []), 'feature:coder'] },
        anthropic: { thinking: { type: 'adaptive' }, effort: 'medium' }
      }
    }
  })
})
