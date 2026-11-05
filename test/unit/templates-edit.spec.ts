import type { Sandbox } from '@vercel/sandbox'
import { describe, expect, it, vi } from 'vitest'
import { checkAppPage, resolveAppPath, waitForRestart } from '../../server/utils/templates/edit'

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
