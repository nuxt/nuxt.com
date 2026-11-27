import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { checkoutRepository, CHECKOUTS_DIR } from '../../../lib/checkout.js'
import { assertCanUseGithubTools, DEFAULT_REPOSITORY, GITHUB_REPOSITORIES } from '../../../lib/github.js'

export default defineTool({
  description: [
    `Clone a public GitHub repository into the sandbox, under ${CHECKOUTS_DIR}, to search, change and run its code: \`bash\`, \`read_file\`, \`edit_file\` and \`write_file\` then work on its files.`,
    `Any public repository can be cloned to read or run it, such as a template or a reproduction linked in an issue. Changes are committed to these only: ${GITHUB_REPOSITORIES.join(', ')}.`,
    'Returns the `path` of the checkout and the `commit` it is at. A repository already checked out is returned as it is, with your changes, so call it again whenever you need the path.',
    'The sandbox has no GitHub credentials: `git push` reaches nothing, and what you change leaves the sandbox through `commit_changes`.'
  ].join(' '),
  inputSchema: z.object({
    repository: z.string().min(3).max(140).default(DEFAULT_REPOSITORY).describe('Repository to clone, as `owner/name`'),
    ref: z.string().min(1).max(200).optional().describe('A branch, a tag, a commit, or `pull/<number>/head` for a pull request. Omit for the default branch.'),
    fresh: z.boolean().optional().describe('Delete the existing checkout, with the changes it holds, and clone again. Needed to move to another `ref`.')
  }),
  label: {
    start: ({ repository, ref }) => `Check out ${repository}${ref ? ` at ${ref}` : ''}`
  },
  async execute({ repository, ref, fresh }, ctx) {
    await assertCanUseGithubTools(ctx.session.auth.current)
    return checkoutRepository({ sandbox: await ctx.getSandbox(), repository, ref, fresh, signal: ctx.abortSignal })
  }
})
