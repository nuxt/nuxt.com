import type { Sandbox } from '@vercel/sandbox'
import { execFileSync } from 'node:child_process'
import { createReadStream, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { unzipSync } from 'fflate'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createError } from 'h3'
import { checkAppPage, devServerLog, readAppFile, RESTARTING_FILES, resolveAppPath, waitForRestart } from '../../server/utils/templates/edit'

describe('resolveAppPath', () => {
  it('resolves paths inside the app', () => {
    expect(resolveAppPath('app/pages/index.vue')).toEqual({ path: 'app/pages/index.vue', absolute: '/vercel/app/app/pages/index.vue' })
    expect(resolveAppPath('./nuxt.config.ts').path).toBe('nuxt.config.ts')
    expect(resolveAppPath('/content/[slug].md').path).toBe('content/[slug].md')
    expect(resolveAppPath('././nuxt.config.ts').path).toBe('nuxt.config.ts')
    expect(resolveAppPath('app/./pages//index.vue').path).toBe('app/pages/index.vue')
  })

  it('rejects paths outside the app, dependencies, build output and shell syntax', () => {
    for (const path of ['', '.', '../etc/passwd', 'app/../../etc', 'node_modules/nuxt/index.js', '././node_modules/nuxt/package.json', 'app/./../../etc', '.nuxt/app.js', '.output/server/index.mjs', '.git/config', '.vercel/project.json', 'app/$(id).vue', 'a\'; rm -rf /; \'.vue', 'app/page`id`.vue']) {
      expect(() => resolveAppPath(path), path).toThrow('Not an editable path')
    }
  })
})

describe('reading an app file', () => {
  function fileSandbox(chunks: Iterable<Buffer>) {
    const stream = Readable.from(chunks)
    return { stream, sandbox: { readFile: vi.fn(async () => stream) } as unknown as Sandbox }
  }

  it('stops streaming a large file once the excerpt is known to be truncated', async () => {
    let pulled = 0
    const { sandbox } = fileSandbox((function* () {
      for (; pulled < 1600; pulled++) yield Buffer.alloc(64 * 1024, 'a') // 100 MiB
    })())
    const file = await readAppFile(sandbox, 'public/data.json')
    expect(file).toMatchObject({ truncated: true })
    expect(file!.content).toHaveLength(40_000)
    expect(pulled).toBeLessThan(10)
  })

  it('returns a multibyte file whole when it fits, and rejects binary files', async () => {
    const text = '\u00E9'.repeat(40_000)
    const bytes = Buffer.from(text)
    await expect(readAppFile(fileSandbox([bytes.subarray(0, 3), bytes.subarray(3)]).sandbox, 'app/app.vue')).resolves.toEqual({ path: 'app/app.vue', content: text, truncated: false })
    await expect(readAppFile(fileSandbox([Buffer.from([0x89, 0x50, 0, 1])]).sandbox, 'public/logo.png')).rejects.toMatchObject({ statusCode: 400 })
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
      readFile: vi.fn().mockImplementation(async () => Readable.from([Buffer.from('<main>Hello from Nuxi</main>')]))
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

  function pageSandbox(chunks: Buffer[], exitCode = 0) {
    const stream = Readable.from(chunks)
    return {
      stream,
      sandbox: {
        runCommand: vi.fn(async ({ args }) => ({ exitCode, stdout: async () => args[1].startsWith('curl') ? '200' : '', stderr: async () => '' })),
        readFile: vi.fn(async () => stream)
      }
    }
  }

  it('reads visible text without running scripts, retaining comments or exposing nested templates', async () => {
    const html = '<main title="a > b">Hello &amp; caf\u00E9<!-- hidden --><template>secret<template>nested</template>secret</template><style>.secret{}</style><script>throw new Error("must not execute")</script><p>&#x1F680; world</p></main>'
    const bytes = Buffer.from(html)
    const split = bytes.indexOf(Buffer.from('\u00E9')) + 1
    const { sandbox } = pageSandbox([bytes.subarray(0, split), bytes.subarray(split)])
    await expect(checkAppPage(sandbox as unknown as Sandbox, '/')).resolves.toMatchObject({ text: 'Hello & caf\u00E9 \uD83D\uDE80 world' })
  })

  it('keeps unfinished script content out of the text excerpt', async () => {
    const { sandbox } = pageSandbox([Buffer.from('<p>Visible</p><script>' + '<script>'.repeat(8192))])
    await expect(checkAppPage(sandbox as unknown as Sandbox, '/')).resolves.toMatchObject({ text: 'Visible' })
  })

  it.each([
    [Buffer.alloc(1024 * 1024), Buffer.from('x')],
    [Buffer.from('\u00E9'.repeat(512 * 1024 + 1))]
  ])('rejects over-limit bytes while streaming, even after curl reports success', async (...chunks) => {
    const { sandbox, stream } = pageSandbox(chunks)
    await expect(checkAppPage(sandbox as unknown as Sandbox, '/')).rejects.toMatchObject({ statusCode: 413 })
    expect(stream.destroyed).toBe(true)
  })

  it('allows exactly 1 MiB while retaining only the text excerpt', async () => {
    const { sandbox } = pageSandbox([Buffer.alloc(1024 * 1024, 'x')])
    await expect(checkAppPage(sandbox as unknown as Sandbox, '/')).resolves.toMatchObject({ status: 200, text: 'x'.repeat(1500) })
  })

  it.each([[63, 413], [28, 502], [56, 502]])('does not read the response when curl exits with %i', async (exitCode, statusCode) => {
    const { sandbox } = pageSandbox([Buffer.from('<main>partial</main>')], exitCode)
    await expect(checkAppPage(sandbox as unknown as Sandbox, '/')).rejects.toMatchObject({ statusCode })
    expect(sandbox.readFile).not.toHaveBeenCalled()
  })

  it('bounds log output even when one line is very long', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'template-log-'))
    try {
      const path = join(directory, 'dev.log')
      writeFileSync(path, 'x'.repeat(100_000) + '\nERROR missing module')
      const sandbox = { runCommand: async ({ args }) => ({
        exitCode: 0, stdout: async () => execFileSync('bash', ['-c', args[1].replaceAll('/tmp/nuxt-dev.log', path)], { encoding: 'utf8' }), stderr: async () => ''
      }) } as unknown as Sandbox
      const log = await devServerLog(sandbox)
      expect(Buffer.byteLength(log)).toBeLessThanOrEqual(32768)
      expect(log).toContain('ERROR missing module')
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
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

  it('looks up the caller’s preview and refuses missing or stopped previews', async () => {
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

  it('still writes a fix when the dev server has exited, without waiting for a restart', async () => {
    vi.stubGlobal('waitForDevServer', vi.fn().mockRejectedValue(createError({ statusCode: 504, data: { stopped: true } })))
    await expect(request({ path: 'nuxt.config.ts', content: 'export default defineNuxtConfig({})' })).resolves.toEqual({ path: 'nuxt.config.ts', devServerStopped: true })
    expect(writeFile).toHaveBeenCalledWith(sandbox, 'nuxt.config.ts', 'export default defineNuxtConfig({})')
    expect(restart).not.toHaveBeenCalled()
  })

  it('fails without writing while the dev server is still starting', async () => {
    vi.stubGlobal('waitForDevServer', vi.fn().mockRejectedValue(createError({ statusCode: 504, data: { stopped: false } })))
    await expect(request({ content: 'Hello' })).rejects.toMatchObject({ statusCode: 504 })
    expect(writeFile).not.toHaveBeenCalled()
  })
})

describe('starting the preview editor', () => {
  it.each([false, true])('streams startup before the result (failed: %s)', async (failed) => {
    vi.stubGlobal('getRateLimitPrincipalId', vi.fn().mockResolvedValue('visitor'))
    vi.stubGlobal('getRouterParam', vi.fn().mockReturnValue('preview'))
    vi.stubGlobal('setResponseHeaders', vi.fn())
    let finish!: () => void
    const pending = new Promise<void>((resolve) => {
      finish = resolve
    })
    const start = vi.fn(async (_sandbox, onStarted: () => void) => {
      onStarted()
      await pending
      if (failed) throw new Error('Startup failed')
      return 'https://preview.vercel.run'
    })
    vi.stubGlobal('waitForDevServer', start)
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const edit = (await import('../../server/api/templates/preview/[id]/edit.post')).default as any
      const reader = (await edit({})).getReader()
      const next = async () => {
        const { value } = await reader.read()
        return value && JSON.parse(new TextDecoder().decode(value))
      }
      expect(await next()).toEqual({ type: 'started' })
      finish()
      expect(await next()).toEqual(failed ? { type: 'error', message: 'The dev server could not start.' } : { type: 'ready', url: 'https://preview.vercel.run' })
      expect(await reader.read()).toMatchObject({ done: true })
      expect(start).toHaveBeenCalledTimes(1)
      expect(getSandbox).toHaveBeenCalledWith('preview', 'visitor')
    } finally {
      finish()
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

  it('requires an identified visitor and looks up their running preview', async () => {
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

  it('archives edited sources, lockfiles and binary assets, excludes generated files and symlinks, then removes the ZIP', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'template-zip-'))
    const files: Record<string, string | Buffer> = {
      'app/app.vue': '<template><h1>Edited by Nuxi</h1></template>',
      'nuxt.config.ts': 'export default defineNuxtConfig({})',
      'package.json': '{"scripts":{"dev":"nuxt dev"}}',
      'pnpm-lock.yaml': 'lockfileVersion: 9',
      'public/logo.png': Buffer.from([137, 80, 78, 71, 0, 255]),
      'public/dist/brand.svg': '<svg>edited asset</svg>',
      'public/nuxt-com-preview.client.js': 'edited public asset',
      'public/nuxt-com-preview.js': 'another public asset',
      '.gitignore': 'node_modules',
      'node_modules/nuxt/index.js': 'dependency',
      '.output/server/index.mjs': 'build',
      '.nuxt/tsconfig.json': '{}',
      '.git/config': 'git',
      '.vercel/project.json': '{}',
      '.data/cache': 'cache',
      'dist/index.html': 'build',
      'app/plugins/nuxt-com-preview.client.js': 'bridge',
      'plugins/nuxt-com-preview.client.js': 'legacy bridge',
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
      expect(Object.keys(archive).sort()).toEqual(['.gitignore', 'app/app.vue', 'nuxt.config.ts', 'package.json', 'pnpm-lock.yaml', 'public/dist/brand.svg', 'public/logo.png', 'public/nuxt-com-preview.client.js', 'public/nuxt-com-preview.js'])
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
    await expect(download({})).rejects.toMatchObject(failure === 'stream'
      ? { message: 'Connection closed' }
      : { statusCode: 500, message: failure === 'archive' ? 'The project could not be zipped. Please try again.' : 'The project ZIP could not be read.' })
    const path = runCommand.mock.calls[0]![0].args[2]
    expect(runCommand).toHaveBeenLastCalledWith({ cmd: 'rm', args: ['-f', path], signal: expect.any(AbortSignal) })
    if (failure !== 'stream') expect(sendStream).not.toHaveBeenCalled()
  })

  it.each(['open', 'stream'])('aborts a stalled ZIP %s and cleans up', async (stage) => {
    vi.useFakeTimers()
    const stream = new Readable({ read() {} })
    const runCommand = vi.fn().mockResolvedValue({ exitCode: 0 })
    const readFile = vi.fn(async (_file, { signal }: { signal: AbortSignal } = { signal: new AbortController().signal }) => {
      if (stage === 'stream') return stream
      return new Promise<never>((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('Read aborted')), { once: true }))
    })
    getSandbox.mockResolvedValueOnce({ status: 'running', runCommand, readFile })
    vi.stubGlobal('sendStream', async (_event: unknown, input: AsyncIterable<Buffer>) => {
      for await (const _chunk of input) { /* consume the download */ }
    })
    try {
      const download = (await import('../../server/api/templates/preview/[id]/download.get')).default as any
      let failure: Error | undefined
      const result = download({}).catch((error: Error) => {
        failure = error
      })
      await vi.advanceTimersByTimeAsync(30_000)
      expect(failure).toBeInstanceOf(Error)
      await result
      expect(readFile.mock.calls[0]![1].signal.aborted).toBe(true)
      if (stage === 'stream') expect(stream.destroyed).toBe(true)
      expect(runCommand).toHaveBeenLastCalledWith({ cmd: 'rm', args: ['-f', expect.any(String)], signal: expect.any(AbortSignal) })
    } finally {
      stream.destroy()
      vi.useRealTimers()
    }
  })

  it('lets an active ZIP download outlast the inactivity timeout', async () => {
    vi.useFakeTimers()
    const stream = new Readable({ read() {} })
    const chunks: Buffer[] = []
    const readFile = vi.fn(async () => stream)
    getSandbox.mockResolvedValueOnce({ status: 'running', runCommand: vi.fn().mockResolvedValue({ exitCode: 0 }), readFile })
    vi.stubGlobal('sendStream', async (_event: unknown, input: AsyncIterable<Buffer>) => {
      for await (const chunk of input) chunks.push(chunk)
    })
    try {
      const download = (await import('../../server/api/templates/preview/[id]/download.get')).default as any
      const result = download({})
      for (let i = 0; i < 3; i++) {
        await vi.advanceTimersByTimeAsync(20_000)
        stream.push(Buffer.from('zip'))
        await vi.advanceTimersByTimeAsync(0)
      }
      stream.push(null)
      await result
      expect(Buffer.concat(chunks).toString()).toBe('zipzipzip')
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      stream.destroy()
      vi.useRealTimers()
    }
  })
})
