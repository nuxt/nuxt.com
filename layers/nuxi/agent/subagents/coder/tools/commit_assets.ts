import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { assertCanUseGithubTools, GITHUB_REPOSITORIES } from '../../../lib/github.js'
import { commitAssets } from '../../../lib/github-files.js'
import { withGithubToken } from '../../../lib/github-token.js'

export default defineTool({
  description: [
    'Commit images from the sandbox to a `nuxi/*` branch of a repository, in one commit: a showcase screenshot, a template preview, a blog cover or an illustration someone shared (`receive_attachments`).',
    '`github__editFiles` writes text only, so this is how a png, jpg, gif or webp reaches a repository, 4 MB each at most. Commit an SVG, which is text, with `github__editFiles`.',
    'The branch is created from the default branch when it does not exist, so this can be the first or a later commit of the task; open the pull request with the GitHub tools.',
    'Never use it for evidence of a change (before and after captures): those go through `publish_media`, not onto the branch.'
  ].join(' '),
  inputSchema: z.object({
    repository: z.enum(GITHUB_REPOSITORIES).default(GITHUB_REPOSITORIES[0]).describe('Repository to commit to, as `owner/name`'),
    branch: z.string().min(6).max(120).describe('The task\'s branch, such as `nuxi/showcase-world-triathlon`'),
    message: z.string().trim().min(8).max(1000).describe('A conventional commit message, such as `feat(showcase): add World Triathlon screenshot`'),
    files: z.array(z.object({
      from: z.string().min(1).max(300).describe('Sandbox path, such as /workspace/captures/world-triathlon.webp or /workspace/shared/3f2a9c1e/cover.png'),
      to: z.string().min(1).max(300).describe('Repository path, such as public/assets/websites/world-triathlon.webp')
    })).min(1).max(10)
  }),
  async execute({ repository, branch, message, files }, ctx) {
    await assertCanUseGithubTools(ctx.session.auth.current)

    const sandbox = await ctx.getSandbox()
    const images = await Promise.all(files.map(async ({ from, to }) => {
      const bytes = await sandbox.readBinaryFile({ path: from })
      if (!bytes) throw new Error(`No file at "${from}" in the sandbox.`)
      return { path: to, bytes }
    }))

    return withGithubToken(ctx, repository, token => commitAssets({ repository, token, branch, message, files: images }))
  },
  // After `execute`, so TypeScript infers `output`.
  label: {
    start: ({ branch, files }) => `Commit ${files.length === 1 ? files[0]!.to : `${files.length} images`} to ${branch}`,
    complete: (_input, output) => `Committed ${output.paths.join(', ')} to ${output.branch}`
  }
})
