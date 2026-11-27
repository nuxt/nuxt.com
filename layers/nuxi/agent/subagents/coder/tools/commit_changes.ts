import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { followCommit, MAX_CHANGE_BYTES, MAX_CHANGED_FILES, readStagedChanges } from '../../../lib/clone.js'
import { assertCanUseGithubTools, repositoryInput } from '../../../lib/github.js'
import { commitChanges } from '../../../lib/github-files.js'
import { withGithubToken } from '../../../lib/github-token.js'

export default defineTool({
  description: [
    'Commit what you staged in a clone to a branch of its repository on GitHub, in one commit: files you added, modified or deleted, text or binary. This is the only way a change reaches GitHub.',
    'Stage the files of the change with `git add` first, and never run `git commit`: the commit is made on GitHub, and the clone then moves to that branch at that commit. Read `git status` before the call, so the commit holds the whole change and nothing a build generated.',
    'The branch is a new `nuxi/*` branch, which starts at the commit the clone is at, or the branch of an open pull request, never the default branch. A branch that exists must be at the commit the clone is at: fetch it and check it out before you change files for it.',
    'To bring another branch into the branch of a pull request, run `git merge --no-commit --no-ff origin/<branch>` in the clone, resolve the conflicts, stage them and call this: it makes the merge commit.',
    `One commit holds ${MAX_CHANGED_FILES} files of your own and ${MAX_CHANGE_BYTES / 1024 / 1024} MB at most, of regular files only: an executable file or a symbolic link is refused.`,
    'After the commit, `git status` in the clone lists only what you left out or changed since.'
  ].join(' '),
  inputSchema: z.object({
    repository: repositoryInput('The repository of the clone, as `owner/name`'),
    directory: z.string().startsWith('/').max(300).describe('The root of the clone, such as `/workspace/repos/nuxt/nuxt.com`'),
    branch: z.string().min(1).max(120).describe('The task\'s branch, such as `nuxi/fix-header-overflow`, or the branch of the open pull request the task is about'),
    message: z.string().trim().min(8).max(1000).describe('A conventional commit message, such as `fix(header): keep the menu inside the viewport`')
  }),
  async execute({ repository, directory, branch, message }, ctx) {
    await assertCanUseGithubTools(ctx.session.auth.current)

    const clone = { sandbox: await ctx.getSandbox(), directory, signal: ctx.abortSignal }
    const changes = await readStagedChanges({ ...clone, repository })
    // In the app runtime, with the token of the person who asked: the sandbox, which runs the
    // project's code, never holds a GitHub token and no request of its own carries one.
    const commit = await withGithubToken(ctx, repository, token => commitChanges({ repository, token, branch, message, ...changes }))

    // The commit is on GitHub whatever happens next, so a clone that can't follow it is a note on
    // the result, not a failure the model would answer by committing again.
    const stale = await followCommit({ ...clone, branch, commit: commit.commitSha }).then(() => undefined, (error: unknown) => (
      `The clone is still at the commit before this one (${error instanceof Error ? error.message : String(error)}). Before another commit to \`${branch}\`, run \`git fetch origin ${branch}\` and \`git reset --soft FETCH_HEAD\` in it.`
    ))
    return stale ? { ...commit, note: stale } : commit
  },
  // After `execute`, so TypeScript infers `output`.
  label: {
    start: ({ branch }) => `Commit the changes to ${branch}`,
    complete: (_input, output) => `Committed ${output.paths.length + output.deleted.length} ${output.paths.length + output.deleted.length === 1 ? 'file' : 'files'} to ${output.branch}`
  }
})
