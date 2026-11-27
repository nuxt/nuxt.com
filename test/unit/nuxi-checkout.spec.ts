import { execFile } from 'node:child_process'
import { chmod, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { checkoutRepository, followCommit, MAX_CHANGE_BYTES, readChanges, type CheckoutSandbox } from '../../layers/nuxi/agent/lib/checkout'

/** No signing, no hooks and no identity from the machine that runs the tests. */
const GIT_ENV = {
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_SYSTEM: '/dev/null',
  GIT_AUTHOR_NAME: 'Test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'Test',
  GIT_COMMITTER_EMAIL: 'test@example.com'
}

function bash(command: string, cwd: string, env: Record<string, string> = {}) {
  return new Promise<{ exitCode: number, stdout: string, stderr: string }>((resolve) => {
    execFile('bash', ['-c', command], { cwd, env: { ...process.env, ...GIT_ENV, ...env }, maxBuffer: 64 * 1024 * 1024 }, (error, stdout, stderr) => {
      resolve({ exitCode: error ? (typeof error.code === 'number' ? error.code : 1) : 0, stdout, stderr })
    })
  })
}

async function sh(command: string, cwd: string): Promise<string> {
  const result = await bash(command, cwd)
  if (result.exitCode !== 0) throw new Error(`${command}: ${result.stderr || result.stdout}`)
  return result.stdout.trim()
}

const BINARY = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x00, 0xFF, 0x0D, 0x0A, 0x00])

describe('a checkout in the coder\'s sandbox', () => {
  let root: string
  /** Stands for GitHub: the repository the sandbox clones, and where a commit made through the API lands. */
  let origin: string
  let sandbox: CheckoutSandbox
  const repository = 'acme/app'
  const inCheckout = (path: string) => join(root, 'repos', repository, path)

  /** Real git and a real directory: `/workspace` in a command or a path is `root`. */
  function localSandbox(): CheckoutSandbox {
    const local = (text: string) => text.replaceAll('/workspace', root)
    return {
      run: ({ command, workingDirectory, env }) => bash(local(command), workingDirectory ? local(workingDirectory) : root, env),
      readBinaryFile: ({ path }) => readFile(local(path)).then(bytes => new Uint8Array(bytes), () => null)
    }
  }

  async function write(path: string, content: string | Uint8Array) {
    await mkdir(dirname(inCheckout(path)), { recursive: true })
    await writeFile(inCheckout(path), content)
  }

  const checkout = (options: { ref?: string, fresh?: boolean } = {}) => checkoutRepository({ sandbox, repository, remote: origin, ...options })
  const changes = (...paths: string[]) => readChanges({ sandbox, repository, paths })
  const text = (bytes: Uint8Array) => Buffer.from(bytes).toString()

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'nuxi-checkout-test-'))
    origin = join(root, 'origin')
    sandbox = localSandbox()
    await mkdir(join(origin, 'app/pages'), { recursive: true })
    await writeFile(join(origin, '.gitignore'), 'node_modules\n.output\n')
    await writeFile(join(origin, 'README.md'), '# App\n')
    await writeFile(join(origin, 'app/pages/index.vue'), '<template>Home</template>\n')
    await writeFile(join(origin, 'app/pages/old.vue'), '<template>Old</template>\n')
    await writeFile(join(origin, 'run.sh'), '#!/bin/sh\n')
    await chmod(join(origin, 'run.sh'), 0o755)
    await sh('git init --quiet --initial-branch=main && git add --all && git commit --quiet -m init && git branch v2', origin)
  })
  afterEach(() => rm(root, { recursive: true, force: true }))

  it('clones the default branch and keeps the checkout, with its changes, on a second call', async () => {
    const head = await sh('git rev-parse main', origin)

    expect(await checkout()).toEqual({ path: '/workspace/repos/acme/app', ref: 'main', commit: head, reused: false })
    await write('README.md', '# Changed\n')

    expect(await checkout()).toEqual({ path: '/workspace/repos/acme/app', ref: 'main', commit: head, reused: true })
    expect(await readFile(inCheckout('README.md'), 'utf8')).toBe('# Changed\n')
  })

  it('moves to another ref only when asked to replace the checkout', async () => {
    await sh('git checkout --quiet v2 && echo v2 > VERSION && git add --all && git commit --quiet -m v2 && git checkout --quiet main', origin)
    await checkout()
    await write('README.md', '# Changed\n')

    await expect(checkout({ ref: 'v2' })).rejects.toThrow('already checked out at `main`')
    expect(await readFile(inCheckout('README.md'), 'utf8')).toBe('# Changed\n')

    expect(await checkout({ ref: 'v2', fresh: true })).toMatchObject({ ref: 'v2', commit: await sh('git rev-parse v2', origin), reused: false })
    expect(await readFile(inCheckout('VERSION'), 'utf8')).toBe('v2\n')
    expect(await readFile(inCheckout('README.md'), 'utf8')).toBe('# App\n')
  })

  it.each([
    ['a repository that climbs out of the checkouts', { repository: '../etc' }],
    ['a repository with a third segment', { repository: 'acme/app/extra' }],
    ['a ref that is an option', { ref: '--upload-pack=touch /tmp/x' }],
    ['a ref that climbs', { ref: 'main..v2' }]
  ])('runs nothing for %s', async (_, override) => {
    const commands: string[] = []
    const recording: CheckoutSandbox = {
      ...sandbox,
      run: (options) => {
        commands.push(options.command)
        return sandbox.run(options)
      }
    }

    await expect(checkoutRepository({ sandbox: recording, repository, remote: origin, ...override })).rejects.toThrow()
    expect(commands).toEqual([])
  })

  it('leaves no half-made checkout when the clone fails', async () => {
    await expect(checkoutRepository({ sandbox, repository, remote: join(root, 'missing') })).rejects.toThrow('Could not check out acme/app')
    await expect(changes('.')).rejects.toThrow('not checked out')
  })

  it('reads what was added, modified and deleted under the named paths, and nothing else', async () => {
    const { commit } = await checkout()
    await write('app/pages/index.vue', '<template>New home</template>\n')
    await write('app/pages/[slug] copy.vue', '<template>Slug</template>\n')
    await write('app/assets/logo.png', BINARY)
    await rm(inCheckout('app/pages/old.vue'))
    await write('README.md', '# Left out\n')
    await write('node_modules/pkg/index.js', 'ignored')

    const read = await changes('app')

    expect(read.base).toBe(commit)
    expect(read.deletions).toEqual(['app/pages/old.vue'])
    expect(Object.fromEntries(read.additions.map(file => [file.path, file.bytes]))).toEqual({
      'app/assets/logo.png': BINARY,
      'app/pages/[slug] copy.vue': new Uint8Array(Buffer.from('<template>Slug</template>\n')),
      'app/pages/index.vue': new Uint8Array(Buffer.from('<template>New home</template>\n'))
    })
  })

  it('reads every change for `.`, except what git ignores', async () => {
    await checkout()
    await write('README.md', '# Changed\n')
    await write('.output/server.mjs', 'built')

    expect((await changes('.')).additions.map(file => [file.path, text(file.bytes)])).toEqual([['README.md', '# Changed\n']])
  })

  it('compares with the commit it cloned, even after a commit made in the sandbox', async () => {
    const { commit } = await checkout()
    await write('README.md', '# Changed\n')
    await sh('git add --all && git commit --quiet -m local', inCheckout(''))

    const read = await changes('.')

    expect(read.base).toBe(commit)
    expect(read.additions.map(file => file.path)).toEqual(['README.md'])
  })

  it('treats a path as a path, never as a pattern', async () => {
    await checkout()
    await write('README.md', '# Changed\n')

    await expect(changes(':(exclude)README.md')).rejects.toThrow()
    await expect(changes('*.md')).rejects.toThrow()
  })

  it.each([
    ['nothing changed', async () => {}, 'Nothing differs'],
    ['an executable file changed', () => write('run.sh', '#!/bin/sh\necho hi\n'), '"run.sh" is an executable file'],
    ['a symbolic link was added', () => symlink('README.md', inCheckout('link.md')), '"link.md" is a symbolic link'],
    ['the files weigh more than a commit holds', () => write('big.bin', new Uint8Array(MAX_CHANGE_BYTES + 1)), 'a commit holds 10 MB at most']
  ])('refuses when %s', async (_, change, message) => {
    await checkout()
    await change()

    await expect(changes('.')).rejects.toThrow(message)
  })

  it('follows a commit made from its changes, so the next one holds only what changed since', async () => {
    await checkout()
    await write('app/pages/index.vue', '<template>New home</template>\n')
    await write('README.md', '# Left out\n')
    const first = await changes('app')

    // What `commitChanges` asks GitHub for: a commit of those files on a new branch at the base.
    const github = join(root, 'github')
    await sh(`git clone --quiet ${origin} ${github} && cd ${github} && git checkout --quiet -b nuxi/home ${first.base}`, root)
    for (const { path, bytes } of first.additions) await writeFile(join(github, path), bytes)
    const commit = await sh(`git add --all && git commit --quiet -m home && git push --quiet origin nuxi/home && git rev-parse HEAD`, github)

    await followCommit({ sandbox, repository, branch: 'nuxi/home', commit })

    expect(await readFile(inCheckout('README.md'), 'utf8')).toBe('# Left out\n')
    // What the coder reads to decide what is left to commit.
    expect(await sh('git status --porcelain', inCheckout(''))).toBe('M README.md')
    await expect(changes('app')).rejects.toThrow('Nothing differs')
    const second = await changes('.')
    expect(second.base).toBe(commit)
    expect(second.additions.map(file => file.path)).toEqual(['README.md'])
    expect(await checkout()).toMatchObject({ commit, reused: true })
  })

  it('does not follow a branch that is not at the new commit', async () => {
    const { commit } = await checkout()
    await sh('git branch nuxi/elsewhere v2', origin)

    await expect(followCommit({ sandbox, repository, branch: 'nuxi/elsewhere', commit: 'f'.repeat(40) })).rejects.toThrow('not at the new commit')
    expect((await checkout()).commit).toBe(commit)
  })
})
