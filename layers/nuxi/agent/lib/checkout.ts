import { quoteShellArg as quote } from '@agent-browser/eve/sandbox'

/**
 * A checkout of a repository in the coder's sandbox, to read, change and run it. The sandbox holds
 * no GitHub credentials, so a change leaves it through the GitHub API, from the app runtime:
 *
 *   checkoutRepository -> /workspace/repos/nuxt/nuxt.com, at a commit GitHub has: the base
 *   the coder edits and runs the files with `bash`, `edit_file` and `write_file`
 *   readChanges        -> what differs from the base, as bytes
 *   commitChanges      -> one commit on a `nuxi/*` branch (`github-files.ts`)
 *   followCommit       -> the base is that commit, so the next commit holds only what changed since
 */

/** Where checkouts live, as `<owner>/<name>`. */
export const CHECKOUTS_DIR = '/workspace/repos'
export const MAX_CHANGED_FILES = 200
export const MAX_CHANGE_BYTES = 10 * 1024 * 1024

/**
 * The commit the working tree is compared with. A ref of its own, not `HEAD`: a `git commit` the
 * coder makes in the sandbox moves `HEAD` to a commit GitHub has never seen.
 */
const BASE_REF = 'refs/nuxi/base'
/** `owner/name`, as GitHub writes it. */
const REPOSITORY = /^[\w.-]+\/[\w.-]+$/
/** A branch, a tag, a commit or `pull/<number>/head`. */
const REF = /^\w[\w./-]*$/
/** Inside `.git`, so git never lists it. */
const STAGED_DIR = '.git/nuxi-staged'
/** Files read at a time, so a commit of many files doesn't open them all at once. */
const READ_BATCH = 16
const IRREGULAR_MODES: Record<string, string> = { 100755: 'an executable file', 120000: 'a symbolic link', 160000: 'a submodule' }

/** The sandbox methods a checkout needs; eve's `SandboxSession` satisfies it. */
export interface CheckoutSandbox {
  run(options: { command: string, workingDirectory?: string, env?: Record<string, string>, signal?: AbortSignal }): PromiseLike<{ exitCode: number, stdout: string, stderr: string }>
  readBinaryFile(options: { path: string }): PromiseLike<Uint8Array | null>
}

interface Checkout {
  readonly sandbox: CheckoutSandbox
  /** `owner/name` */
  readonly repository: string
  readonly signal?: AbortSignal
}

export function checkoutDir(repository: string): string {
  if (!REPOSITORY.test(repository) || repository.split('/').some(part => part === '.' || part === '..')) {
    throw new Error(`"${repository}" is not a GitHub repository, written \`owner/name\`.`)
  }
  return `${CHECKOUTS_DIR}/${repository}`
}

function shell({ sandbox, signal }: Checkout, workingDirectory?: string) {
  return async (command: string): Promise<string> => {
    // Without a terminal to ask on, git fails on a repository that needs a password instead of waiting for one.
    const result = await sandbox.run({ command, workingDirectory, env: { GIT_TERMINAL_PROMPT: '0' }, signal })
    if (result.exitCode !== 0) throw new Error((result.stderr || result.stdout).trim().slice(-600) || `\`${command.split(' ', 2).join(' ')}\` exited ${result.exitCode}`)
    return result.stdout
  }
}

/** Runs `git` in the checkout, each argument quoted. */
function gitIn(checkout: Checkout) {
  const run = shell(checkout, checkoutDir(checkout.repository))
  return (...args: string[]) => run(`git ${args.map(quote).join(' ')}`)
}

async function isCheckedOut(checkout: Checkout): Promise<boolean> {
  const { exitCode } = await checkout.sandbox.run({ command: `test -d ${quote(`${checkoutDir(checkout.repository)}/.git`)}`, signal: checkout.signal })
  return exitCode === 0
}

interface CheckoutInput extends Checkout {
  /** Omit for the default branch. */
  readonly ref?: string
  /** Replace a checkout that exists, with the changes it holds. */
  readonly fresh?: boolean
  /** Where to clone from. GitHub over https by default, without credentials. */
  readonly remote?: string
}

/**
 * Clone `repository` at `ref`. A checkout that exists is kept and returned as it is, so a second
 * call in a session costs nothing and loses nothing; only `fresh` replaces it. Blobs come when a
 * command needs them (`--filter=blob:none`): the clone has the whole history for `git log` and
 * `git blame` without downloading every version of every image.
 */
export async function checkoutRepository({ ref, fresh = false, remote, ...checkout }: CheckoutInput) {
  if (ref !== undefined && (!REF.test(ref) || ref.includes('..'))) {
    throw new Error(`"${ref}" is not a branch, a tag, a commit or \`pull/<number>/head\`.`)
  }
  const { repository } = checkout
  const path = checkoutDir(repository)
  const git = gitIn(checkout)
  const run = shell(checkout)

  if (!fresh && await isCheckedOut(checkout)) {
    const current = (await git('config', 'nuxi.ref').catch(() => '')).trim()
    if (!current) throw new Error(`${path} holds a clone this tool did not make. Pass \`fresh: true\` to replace it, which deletes the changes it holds.`)
    if (ref !== undefined && ref !== current) {
      throw new Error(`${repository} is already checked out at \`${current}\`. Pass \`fresh: true\` to replace it with \`${ref}\`, which deletes the changes it holds.`)
    }
    return { path, ref: current, commit: (await git('rev-parse', BASE_REF)).trim(), reused: true }
  }

  await run(`rm -rf ${quote(path)}`)
  try {
    await run(`git clone --quiet --filter=blob:none --no-checkout ${quote(remote ?? `https://github.com/${repository}.git`)} ${quote(path)}`)
    if (ref !== undefined) await git('fetch', '--quiet', 'origin', ref)
    const checkedOut = ref ?? (await git('symbolic-ref', '--short', 'refs/remotes/origin/HEAD')).trim().replace(/^origin\//, '')
    // Detached: commits are made by `commitChanges`, so no local branch has anything to track.
    await git('-c', 'advice.detachedHead=false', 'checkout', '--quiet', '--detach', ref === undefined ? 'origin/HEAD' : 'FETCH_HEAD')
    await git('update-ref', BASE_REF, 'HEAD')
    await git('config', 'nuxi.ref', checkedOut)
    return { path, ref: checkedOut, commit: (await git('rev-parse', BASE_REF)).trim(), reused: false }
  } catch (error) {
    // Half a clone would pass for a checkout on the next call.
    await run(`rm -rf ${quote(path)}`).catch(() => {})
    throw new Error(`Could not check out ${repository}${ref === undefined ? '' : ` at \`${ref}\``}: ${error instanceof Error ? error.message : String(error)}. The sandbox has no GitHub credentials, so it clones public repositories only.`, { cause: error })
  }
}

export interface Changes {
  /** The commit the changes apply to. */
  readonly base: string
  readonly additions: ReadonlyArray<{ readonly path: string, readonly bytes: Uint8Array }>
  readonly deletions: readonly string[]
}

/** `git diff --raw -z` output: `:<old mode> <new mode> <old id> <new id> <status>`, NUL, the path, NUL. */
function parseRawDiff(raw: string) {
  const fields = raw.split('\0')
  const entries: Array<{ path: string, mode: string, id: string, status: string }> = []
  for (let index = 0; index + 1 < fields.length; index += 2) {
    const [, mode = '', , id = '', status = ''] = fields[index]!.split(' ')
    entries.push({ path: fields[index + 1]!, mode, id, status })
  }
  return entries
}

/**
 * What differs from the base under `paths`, which name files or directories of the checkout:
 * added, modified and deleted files, and nothing git ignores. Staging them is how git lists a new
 * file next to a changed one, and each file is read as git staged it: the bytes `git diff` showed,
 * whatever a filter or a process still writing does to the file in the working tree.
 */
export async function readChanges({ paths, ...checkout }: Checkout & { readonly paths: readonly string[] }): Promise<Changes> {
  const { repository } = checkout
  if (!await isCheckedOut(checkout)) throw new Error(`${repository} is not checked out: call \`checkout_repository\` first.`)
  const git = gitIn(checkout)
  const run = shell(checkout, checkoutDir(repository))

  // Literal: a path is a path, never a pattern such as `:(exclude)`.
  await git('--literal-pathspecs', 'add', '--all', '--', ...paths)
  const entries = parseRawDiff(await git('--literal-pathspecs', 'diff', '--cached', '--raw', '-z', '--no-renames', '--no-abbrev', BASE_REF, '--', ...paths))
  if (!entries.length) throw new Error(`Nothing differs from the checked-out commit under ${paths.join(', ')}.`)
  if (entries.length > MAX_CHANGED_FILES) throw new Error(`${entries.length} files changed under ${paths.join(', ')}: a commit holds ${MAX_CHANGED_FILES} at most. Name narrower paths, or leave out what a build generated.`)

  const written = entries.filter(entry => entry.status !== 'D')
  // `createCommitOnBranch` writes every file as a regular one, so anything else would arrive changed.
  const irregular = written.find(entry => entry.mode !== '100644')
  if (irregular) {
    const kind = IRREGULAR_MODES[irregular.mode] ?? `a file of mode ${irregular.mode}`
    throw new Error(`"${irregular.path}" is ${kind}: this tool commits regular, non-executable files only. Leave it out of \`paths\` and say so in your reply.`)
  }

  const additions: Array<{ path: string, bytes: Uint8Array }> = []
  if (written.length) {
    // Sizes from git, before any file is read into the app's memory.
    const sizes = await run(`printf '%s\\n' ${written.map(entry => quote(entry.id)).join(' ')} | git cat-file --batch-check='%(objectsize)'`)
    const total = sizes.trim().split('\n').reduce((sum, size) => sum + Number(size), 0)
    if (total > MAX_CHANGE_BYTES) throw new Error(`The changed files weigh ${(total / 1024 / 1024).toFixed(1)} MB: a commit holds ${MAX_CHANGE_BYTES / 1024 / 1024} MB at most. Commit them in several calls.`)

    // A command's output is text, so each staged file goes through a file of its own to stay bytes.
    await run(`rm -rf ${STAGED_DIR} && mkdir -p ${STAGED_DIR} && ${written.map(({ id }, index) => `git cat-file blob ${quote(id)} > ${STAGED_DIR}/${index}`).join(' && ')}`)
    for (let start = 0; start < written.length; start += READ_BATCH) {
      additions.push(...await Promise.all(written.slice(start, start + READ_BATCH).map(async ({ path }, offset) => {
        const bytes = await checkout.sandbox.readBinaryFile({ path: `${checkoutDir(repository)}/${STAGED_DIR}/${start + offset}` })
        if (!bytes) throw new Error(`"${path}" changed, and could not be read from the checkout.`)
        return { path, bytes }
      })))
    }
    await run(`rm -rf ${STAGED_DIR}`)
  }

  return {
    base: (await git('rev-parse', BASE_REF)).trim(),
    additions,
    deletions: entries.filter(entry => entry.status === 'D').map(entry => entry.path)
  }
}

/**
 * Make `commit`, just made on `branch` from the checkout's changes, the new base. The files stay
 * as they are: what was committed now matches the base, and what was left out still differs.
 */
export async function followCommit({ branch, commit, ...checkout }: Checkout & { readonly branch: string, readonly commit: string }): Promise<void> {
  const git = gitIn(checkout)
  await git('fetch', '--quiet', 'origin', `refs/heads/${branch}`)
  const fetched = (await git('rev-parse', 'FETCH_HEAD')).trim()
  if (fetched !== commit) throw new Error(`\`${branch}\` is at ${fetched.slice(0, 8)}, not at the new commit ${commit.slice(0, 8)}.`)
  await git('update-ref', BASE_REF, commit)
  await git('reset', '--quiet', commit)
}
