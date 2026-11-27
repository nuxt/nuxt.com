import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { followCommit, MAX_CHANGE_BYTES, MAX_CHANGED_FILES, readChanges } from '../../../lib/checkout.js'
import { assertCanUseGithubTools, GITHUB_REPOSITORIES } from '../../../lib/github.js'
import { commitChanges } from '../../../lib/github-files.js'
import { withGithubToken } from '../../../lib/github-token.js'

export default defineTool({
  description: [
    'Commit what you changed in a checkout to a `nuxi/*` branch of its repository, in one commit: files you added, modified or deleted, text or binary.',
    'Read `git status` and `git diff` in the checkout first, and name in `paths` what the task changed: a file, or a directory for every change under it. Files git ignores are never committed.',
    'A new branch starts at the commit you checked out. To add to an existing branch, check that branch out first.',
    `One commit holds ${MAX_CHANGED_FILES} files and ${MAX_CHANGE_BYTES / 1024 / 1024} MB at most, of regular files only: an executable file or a symbolic link is refused.`,
    'After the commit, `git status` in the checkout lists only what you left out or changed since. Open the pull request with the GitHub tools.'
  ].join(' '),
  inputSchema: z.object({
    repository: z.enum(GITHUB_REPOSITORIES).default(GITHUB_REPOSITORIES[0]).describe('The checked-out repository to commit to, as `owner/name`'),
    branch: z.string().min(6).max(120).describe('The task\'s branch, such as `nuxi/fix-header-overflow`'),
    message: z.string().trim().min(8).max(1000).describe('A conventional commit message, such as `fix(header): keep the menu inside the viewport`'),
    paths: z.array(z.string().min(1).max(300)).min(1).max(50).describe('Files or directories, relative to the checkout, such as `app/components/AppHeader.vue` or `content/blog`. `.` is every change in the checkout.')
  }),
  async execute({ repository, branch, message, paths }, ctx) {
    await assertCanUseGithubTools(ctx.session.auth.current)

    const checkout = { sandbox: await ctx.getSandbox(), repository, signal: ctx.abortSignal }
    const changes = await readChanges({ ...checkout, paths })
    const commit = await withGithubToken(ctx, repository, token => commitChanges({ repository, token, branch, message, ...changes }))

    // The commit is on GitHub whatever happens next, so a checkout that can't follow it is a note
    // on the result, not a failure the model would answer by committing again.
    const stale = await followCommit({ ...checkout, branch, commit: commit.commitSha }).then(() => undefined, (error: unknown) => (
      `The checkout still compares with the commit before this one (${error instanceof Error ? error.message : String(error)}). Before another commit, check out \`${branch}\` with \`fresh: true\`.`
    ))
    return stale ? { ...commit, note: stale } : commit
  },
  // After `execute`, so TypeScript infers `output`.
  label: {
    start: ({ branch }) => `Commit the changes to ${branch}`,
    complete: (_input, output) => `Committed ${output.paths.length + output.deleted.length} ${output.paths.length + output.deleted.length === 1 ? 'file' : 'files'} to ${output.branch}`
  }
})
