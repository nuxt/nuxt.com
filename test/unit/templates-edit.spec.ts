import type { Sandbox } from '@vercel/sandbox'
import { execFileSync } from 'node:child_process'
import { createReadStream, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { unzipSync } from 'fflate'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createError } from 'h3'
import { checkAppPage, RESTARTING_FILES, resolveAppPath, waitForRestart } from '../../server/utils/templates/edit'

describe('resolveAppPath', () => {
  it('resolves paths inside the app', () => {
    expect(resolveAppPath('app/pages/index.vue')).toEqual({ path: 'app/pages/index.vue', absolute: '/vercel/app/app/pages/index.vue' })
    expect(resolveAppPath('./nuxt.config.ts').path).toBe('nuxt.config.ts')
    expect(resolveAppPath('/content/[slug].md').path).toBe('content/[slug].md')
  })

  it('rejects paths outside the app, dependencies, build output and shell syntax', () => {
    for (const path of ['', '../etc/passwd', 'app/../../etc', 'node_modules/nuxt/index.js', '.nuxt/app.js', '.output/server/index.mjs', '.git/config', '.vercel/project.json', 'app/$(id).vue', 'a\'; rm -rf /; \'.vue', 'app/page`id`.vue']) {
      expect(() => resolveAppPath(path), path).toThrow('Not an editable path')
    }
  })
})

describe('waiting for an edited app to restart', () => {
  it('reports a failed bundle instead of returning success', async () => {
    const sandbox = {
      runCommand: vi.fn().mockResolvedValue({
        exitCode: 1,
        stdout: async () => '',
        stderr: async () => 'The app could not bundle after the config changed.'
      })
    } as unknown as Sandbox

    await expect(waitForRestart(sandbox, 42)).rejects.toMatchObject({
      statusCode: 504,
      message: 'The dev server did not restart.'
    })
  })
})

describe('checking an edited page', () => {
  it('reports actual errors without treating the public dev server notice as a broken app', async () => {
    const notice = '▲ The dev server is reachable from the network without authentication: anyone who can connect can read the app, build errors and source code.'
    let log = notice
    const sandbox = {
      runCommand: vi.fn().mockImplementation(({ args }) => Promise.resolve({
        exitCode: 0,
        stdout: async () => args[1].startsWith('curl') ? '200' : log,
        stderr: async () => ''
      })),
      readFileToBuffer: vi.fn().mockResolvedValue(Buffer.from('<main>Hello from Nuxi</main>'))
    } as unknown as Sandbox

    await expect(checkAppPage(sandbox, '/')).resolves.toMatchObject({
      status: 200,
      text: 'Hello from Nuxi',
      devServerErrors: undefined
    })

    log += '\nERROR Failed to resolve import "./missing.vue"\nTypeError: Invalid value'
    await expect(checkAppPage(sandbox, '/')).resolves.toMatchObject({
      devServerErrors: ['ERROR Failed to resolve import "./missing.vue"', 'TypeError: Invalid value']
    })
  })
})

let handler: (event: unknown) => Promise<unknown>
const sandbox = { status: 'running' }
const body = { action: 'edit', principalId: 'visitor', sandboxId: 'preview', path: 'app/pages/index.vue' }
const readFile = vi.fn()
const writeFile = vi.fn().mockImplementation((_sandbox, path) => path)
const getSandbox = vi.fn()
const restart = vi.fn()
const requireInternal = vi.fn()

beforeEach(async () => {
  vi.stubGlobal('defineEventHandler', (value: unknown) => value)
  vi.stubGlobal('createError', createError)
  vi.stubGlobal('requireInternalRequest', requireInternal)
  vi.stubGlobal('readValidatedBody', (_event: unknown, parse: (value: unknown) => unknown) => parse(body))
  vi.stubGlobal('getPreviewSandbox', getSandbox.mockResolvedValue(sandbox))
  vi.stubGlobal('waitForDevServer', vi.fn())
  vi.stubGlobal('resolveAppPath', resolveAppPath)
  vi.stubGlobal('RESTARTING_FILES', RESTARTING_FILES)
  vi.stubGlobal('readAppFile', readFile)
  vi.stubGlobal('writeAppFile', writeFile)
  vi.stubGlobal('devLogSize', vi.fn().mockResolvedValue(42))
  vi.stubGlobal('waitForRestart', restart)
  handler = (await import('../../server/api/internal/templates/preview.post')).default as any
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

function request(value: Record<string, unknown>) {
  vi.stubGlobal('readValidatedBody', (_event: unknown, parse: (value: unknown) => unknown) => parse({ ...body, ...value }))
  return handler({})
}

describe('editing a template preview', () => {
  it('refuses requests without internal authentication', async () => {
    requireInternal.mockImplementationOnce(() => {
      throw createError({ statusCode: 401 })
    })
    await expect(request({ content: 'Hello' })).rejects.toMatchObject({ statusCode: 401 })
    expect(getSandbox).not.toHaveBeenCalled()
  })

  it('refuses missing, stopped or differently owned previews', async () => {
    for (const value of [null, { status: 'stopped' }]) {
      getSandbox.mockResolvedValueOnce(value)
      await expect(request({ content: 'Hello' })).rejects.toMatchObject({ statusCode: 404 })
    }
    expect(getSandbox).toHaveBeenCalledWith('preview', 'visitor')
    expect(writeFile).not.toHaveBeenCalled()
  })

  it('applies an exact edit to the existing file', async () => {
    readFile.mockResolvedValue({ path: body.path, content: '<h1>Welcome</h1>', truncated: false })
    await expect(request({ edits: [{ find: 'Welcome', replace: 'Hello world' }] })).resolves.toEqual({ path: body.path })
    expect(writeFile).toHaveBeenCalledWith(sandbox, body.path, '<h1>Hello world</h1>')
    expect(restart).not.toHaveBeenCalled()
  })

  it.each(['Welcome Welcome', 'Something else'])('rejects an ambiguous or missing match without writing', async (content) => {
    readFile.mockResolvedValue({ path: body.path, content, truncated: false })
    await expect(request({ edits: [{ find: 'Welcome', replace: 'Hello' }] })).rejects.toMatchObject({ statusCode: 422 })
    expect(writeFile).not.toHaveBeenCalled()
  })

  it('rejects edits to truncated files', async () => {
    readFile.mockResolvedValue({ path: body.path, content: 'Welcome', truncated: true })
    await expect(request({ edits: [{ find: 'Welcome', replace: 'Hello' }] })).rejects.toMatchObject({ statusCode: 422 })
    expect(writeFile).not.toHaveBeenCalled()
  })

  it('waits for config changes to restart before reporting success', async () => {
    await expect(request({ path: 'nuxt.config.ts', content: 'export default defineNuxtConfig({})' })).resolves.toEqual({ path: 'nuxt.config.ts', restarted: true })
    expect(restart).toHaveBeenCalledWith(sandbox, 42)
  })
})

describe('starting the preview editor', () => {
  it.each([false, true])('streams startup before the result (failed: %s)', async (failed) => {
    vi.stubGlobal('getRateLimitPrincipalId', vi.fn().mockResolvedValue('visitor'))
    vi.stubGlobal('getRouterParam', vi.fn().mockReturnValue('preview'))
    vi.stubGlobal('setResponseHeaders', vi.fn())
    const start = vi.fn(async (_sandbox, onStarted: () => void) => {
      onStarted()
      if (failed) throw new Error('Startup failed')
      return 'https://preview.vercel.run'
    })
    vi.stubGlobal('waitForDevServer', start)
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const edit = (await import('../../server/api/templates/preview/[id]/edit.post')).default as any
      const stream = await edit({})
      const events = (await new Response(stream).text()).trim().split('\n').map(line => JSON.parse(line))
      expect(events).toEqual([
        { type: 'started' },
        failed ? { type: 'error', message: 'The dev server could not start.' } : { type: 'ready', url: 'https://preview.vercel.run' }
      ])
      expect(start).toHaveBeenCalledTimes(1)
      expect(getSandbox).toHaveBeenCalledWith('preview', 'visitor')
    } finally {
      log.mockRestore()
    }
  })
})

describe('downloading an edited project', () => {
  beforeEach(() => {
    vi.stubGlobal('getRateLimitPrincipalId', vi.fn().mockResolvedValue('visitor'))
    vi.stubGlobal('getRouterParam', vi.fn().mockReturnValue('preview'))
    vi.stubGlobal('setResponseHeaders', vi.fn())
  })

  it('refuses missing, stopped or differently owned previews and unidentified visitors', async () => {
    const download = (await import('../../server/api/templates/preview/[id]/download.get')).default as any
    for (const value of [null, { status: 'stopped' }]) {
      getSandbox.mockResolvedValueOnce(value)
      await expect(download({})).rejects.toMatchObject({ statusCode: 404 })
    }
    expect(getSandbox).toHaveBeenCalledWith('preview', 'visitor')
    getSandbox.mockClear()
    vi.stubGlobal('getRateLimitPrincipalId', vi.fn().mockResolvedValue(undefined))
    await expect(download({})).rejects.toMatchObject({ statusCode: 404 })
    expect(getSandbox).not.toHaveBeenCalled()
  })

  it('streams edited sources, lockfiles and binary assets, excludes generated files and symlinks, then removes the ZIP', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'template-zip-'))
    const files: Record<string, string | Buffer> = {
      'app/app.vue': '<template><h1>Edited by Nuxi</h1></template>',
      'nuxt.config.ts': 'export default defineNuxtConfig({})',
      'package.json': '{"scripts":{"dev":"nuxt dev"}}',
      'pnpm-lock.yaml': 'lockfileVersion: 9',
      'public/logo.png': Buffer.from([137, 80, 78, 71, 0, 255]),
      '.gitignore': 'node_modules',
      'node_modules/nuxt/index.js': 'dependency',
      '.output/server/index.mjs': 'build',
      '.nuxt/tsconfig.json': '{}',
      '.git/config': 'git',
      '.vercel/project.json': '{}',
      '.data/cache': 'cache',
      'app/plugins/nuxt-com-preview.client.js': 'bridge',
      'server/plugins/nuxt-com-preview.js': 'guard',
      'nested/node_modules/dependency.js': 'nested dependency'
    }
    let archivePath = ''
    try {
      for (const [path, content] of Object.entries(files)) {
        mkdirSync(join(directory, path, '..'), { recursive: true })
        writeFileSync(join(directory, path), content)
      }
      symlinkSync('/etc/passwd', join(directory, 'outside.txt'))
      symlinkSync('/etc', join(directory, 'outside-directory'))
      const runCommand = vi.fn(async ({ cmd, args }) => {
        if (cmd === 'python3') archivePath = args[2]
        execFileSync(cmd, args, { cwd: directory })
        return { exitCode: 0 }
      })
      getSandbox.mockResolvedValueOnce({ status: 'running', runCommand, readFile: ({ path }: { path: string }) => createReadStream(path) })
      vi.stubGlobal('sendStream', async (_event: unknown, stream: AsyncIterable<Buffer>) => {
        const chunks = []
        for await (const chunk of stream) chunks.push(chunk)
        return Buffer.concat(chunks)
      })
      const download = (await import('../../server/api/templates/preview/[id]/download.get')).default as any
      const archive = unzipSync(await download({}))
      expect(Object.keys(archive).sort()).toEqual(['.gitignore', 'app/app.vue', 'nuxt.config.ts', 'package.json', 'pnpm-lock.yaml', 'public/logo.png'])
      expect(Buffer.from(archive['app/app.vue']!).toString()).toBe(files['app/app.vue'])
      expect(Buffer.from(archive['public/logo.png']!)).toEqual(files['public/logo.png'])
      expect(setResponseHeaders).toHaveBeenCalledWith({}, expect.objectContaining({ 'content-type': 'application/zip', 'cache-control': 'no-store' }))
      expect(existsSync(archivePath)).toBe(false)
    } finally {
      rmSync(directory, { recursive: true, force: true })
      if (archivePath) rmSync(archivePath, { force: true })
    }
  })

  it.each(['archive', 'read', 'stream'])('cleans up and reports a failed %s without returning a broken download', async (failure) => {
    const runCommand = vi.fn().mockResolvedValue({ exitCode: 0 })
    if (failure === 'archive') runCommand.mockResolvedValueOnce({ exitCode: 1 })
    const stream = Readable.from([Buffer.from('zip')])
    getSandbox.mockResolvedValueOnce({ status: 'running', runCommand, readFile: async () => failure === 'read' ? null : stream })
    vi.stubGlobal('sendStream', vi.fn().mockRejectedValue(new Error('Connection closed')))
    const download = (await import('../../server/api/templates/preview/[id]/download.get')).default as any
    await expect(download({})).rejects.toThrow()
    const path = runCommand.mock.calls[0]![0].args[2]
    expect(runCommand).toHaveBeenLastCalledWith({ cmd: 'rm', args: ['-f', path] })
    if (failure !== 'stream') expect(sendStream).not.toHaveBeenCalled()
  })
})
