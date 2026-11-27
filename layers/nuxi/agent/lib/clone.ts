import { quoteShellArg as quote } from '@agent-browser/eve/sandbox'

/**
 * A clone the coder made in its sandbox with `git clone`, to read, change and run a repository.
 * The sandbox holds no GitHub credentials, so a change leaves it through the GitHub API, from the
 * app runtime:
 *
 *   the coder edits the files and stages the change with `git add`
 *   readStagedChanges -> what is staged, as bytes, and the commits it applies to
 *   commitChanges     -> one commit on a branch (`github-files.ts`)
 *   followCommit      -> the clone is on that branch at that commit, so nothing is staged any more
 */

export const MAX_CHANGED_FILES = 200
export const MAX_CHANGE_BYTES = 10 * 1024 * 1024

/** Inside `.git`, so git never lists it. */
const STAGED_DIR = '.git/nuxi-staged'
/** Files read at a time, so a commit of many files doesn't open them all at once. */
const READ_BATCH = 16
const IRREGULAR_MODES: Record<string, string> = { 100755: 'an executable file', 120000: 'a symbolic link', 160000: 'a submodule' }

/** The sandbox methods a clone needs; eve's `SandboxSession` satisfies it. */
export interface CloneSandbox {
  run(options: { command: string, workingDirectory?: string, signal?: AbortSignal }): PromiseLike<{ exitCode: number, stdout: string, stderr: string }>
  readBinaryFile(options: { path: string }): PromiseLike<Uint8Array | null>
}

interface Clone {
  readonly sandbox: CloneSandbox
  /** The root of the clone, such as `/workspace/repos/nuxt/nuxt.com`. */
  readonly directory: string
  readonly signal?: AbortSignal
}

function shellIn({ sandbox, directory, signal }: Clone) {
  return async (command: string): Promise<string> => {
    const result = await sandbox.run({ command, workingDirectory: directory, signal })
    if (result.exitCode !== 0) throw new Error((result.stderr || result.stdout).trim().slice(-600) || `\`${command.split(' ', 2).join(' ')}\` exited ${result.exitCode}`)
    return result.stdout
  }
}

/** Runs `git` in the clone, each argument quoted. */
function gitIn(clone: Clone) {
  const run = shellIn(clone)
  return (...args: string[]) => run(`git ${args.map(quote).join(' ')}`)
}

/** What a commit holds. Every `path` is a repository path, as git names it. */
export interface Changes {
  /** The commit the clone is at, then the commit being merged into it, if a merge is in progress. */
  readonly parents: readonly [base: string, merged?: string]
  /** The staged files to send. */
  readonly files: ReadonlyArray<{ readonly path: string, readonly bytes: Uint8Array }>
  /** In a merge, the staged files that are the merged commit's own. GitHub has them, so their id is enough. */
  readonly inherited: ReadonlyArray<{ readonly path: string, readonly mode: string, readonly id: string }>
  readonly deletions: readonly string[]
}

/** What is staged and differs from `commit`, from `git diff --raw -z`: `:<old mode> <new mode> <old id> <new id> <status>`, NUL, the path, NUL. */
async function stagedAgainst(git: ReturnType<typeof gitIn>, commit: string) {
  const fields = (await git('diff', '--cached', '--raw', '-z', '--no-renames', '--no-abbrev', commit)).split('\0')
  const entries: Array<{ path: string, mode: string, id: string, status: string }> = []
  for (let index = 0; index + 1 < fields.length; index += 2) {
    const [, mode = '', , id = '', status = ''] = fields[index]!.split(' ')
    entries.push({ path: fields[index + 1]!, mode, id, status })
  }
  return entries
}

/**
 * What `git add` staged in the clone of `repository`: added, modified and deleted files. Each file
 * is read as git staged it: the bytes `git diff --cached` shows, whatever a process still writing
 * does to the file in the working tree.
 */
export async function readStagedChanges({ repository, ...clone }: Clone & { readonly repository: string }): Promise<Changes> {
  const git = gitIn(clone)
  const run = shellIn(clone)

  const [root = '', base = ''] = (await git('rev-parse', '--show-toplevel', 'HEAD').catch(() => '')).trim().split('\n')
  if (!base || root !== clone.directory.replace(/\/+$/, '')) throw new Error(`${clone.directory} is not the root of a clone. Pass the directory you gave \`git clone\`.`)
  // The staged files are whole files of this repository: on another one they would be someone else's code.
  const origin = (await git('config', '--get', 'remote.origin.url').catch(() => '')).trim()
  if (origin.replace(/\.git$/, '').toLowerCase() !== `https://github.com/${repository}`.toLowerCase()) {
    throw new Error(`${clone.directory} is a clone of ${origin || 'no remote'}, not of ${repository}.`)
  }

  const merged = (await git('rev-parse', '--verify', '--quiet', 'MERGE_HEAD').catch(() => '')).trim()
  const entries = await stagedAgainst(git, 'HEAD')
  if (!entries.length) throw new Error(`Nothing is staged in ${clone.directory}. Stage the files of the change with \`git add\`, then call this again. If you committed them with \`git commit\`, undo that commit with \`git reset --soft HEAD~1\` first: it never reaches GitHub.`)
  const unmerged = entries.find(entry => entry.status === 'U')
  if (unmerged) throw new Error(`"${unmerged.path}" still has a merge conflict. Resolve it, stage the file with \`git add\`, then call this again.`)

  // In a merge, most of what is staged came from the merged commit as it is. Only what differs from
  // that commit too is the coder's own: a resolved conflict, or a change made on top of the merge.
  const own = merged ? new Set((await stagedAgainst(git, merged)).map(entry => entry.path)) : undefined
  const kept = entries.filter(entry => entry.status !== 'D')
  const written = own ? kept.filter(entry => own.has(entry.path)) : kept
  if (written.length > MAX_CHANGED_FILES) throw new Error(`${written.length} files are staged: a commit holds ${MAX_CHANGED_FILES} at most. Unstage what a build generated with \`git restore --staged\`, or commit in several calls.`)

  // GitHub writes every file sent to it as a regular one, so anything else would arrive changed.
  const irregular = written.find(entry => entry.mode !== '100644')
  if (irregular) {
    const kind = IRREGULAR_MODES[irregular.mode] ?? `a file of mode ${irregular.mode}`
    throw new Error(`"${irregular.path}" is ${kind}: this tool commits regular, non-executable files only. Unstage it with \`git restore --staged\` and say so in your reply.`)
  }

  const files: Array<{ path: string, bytes: Uint8Array }> = []
  if (written.length) {
    // Sizes from git, before any file is read into the app's memory.
    const sizes = await run(`printf '%s\\n' ${written.map(entry => quote(entry.id)).join(' ')} | git cat-file --batch-check='%(objectsize)'`)
    const total = sizes.trim().split('\n').reduce((sum, size) => sum + Number(size), 0)
    if (total > MAX_CHANGE_BYTES) throw new Error(`The staged files weigh ${(total / 1024 / 1024).toFixed(1)} MB: a commit holds ${MAX_CHANGE_BYTES / 1024 / 1024} MB at most. Commit them in several calls.`)

    // A command's output is text, so each staged file goes through a file of its own to stay bytes.
    await run(`rm -rf ${STAGED_DIR} && mkdir -p ${STAGED_DIR} && ${written.map(({ id }, index) => `git cat-file blob ${quote(id)} > ${STAGED_DIR}/${index}`).join(' && ')}`)
    for (let start = 0; start < written.length; start += READ_BATCH) {
      files.push(...await Promise.all(written.slice(start, start + READ_BATCH).map(async ({ path }, offset) => {
        const bytes = await clone.sandbox.readBinaryFile({ path: `${root}/${STAGED_DIR}/${start + offset}` })
        if (!bytes) throw new Error(`"${path}" is staged, and could not be read from the clone.`)
        return { path, bytes }
      })))
    }
    await run(`rm -rf ${STAGED_DIR}`)
  }

  return {
    parents: merged ? [base, merged] : [base],
    files,
    inherited: own ? kept.filter(entry => !own.has(entry.path)).map(({ path, mode, id }) => ({ path, mode, id })) : [],
    deletions: entries.filter(entry => entry.status === 'D').map(entry => entry.path)
  }
}

/**
 * Put the clone on `branch` at `commit`, just made there from what was staged. The files and the
 * index stay as they are: what was committed now matches `HEAD`, so `git status` lists only what
 * was left out, and the next commit holds only what is staged after this one.
 */
export async function followCommit({ branch, commit, ...clone }: Clone & { readonly branch: string, readonly commit: string }): Promise<void> {
  const git = gitIn(clone)
  await git('fetch', '--quiet', 'origin', `refs/heads/${branch}`)
  const fetched = (await git('rev-parse', 'FETCH_HEAD')).trim()
  if (fetched !== commit) throw new Error(`\`${branch}\` is at ${fetched.slice(0, 8)}, not at the new commit ${commit.slice(0, 8)}.`)
  await git('update-ref', `refs/heads/${branch}`, commit)
  await git('symbolic-ref', 'HEAD', `refs/heads/${branch}`)
  // A merge that was in progress is that commit now.
  await git('merge', '--quit')
}
