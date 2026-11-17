import type { Sandbox } from '@vercel/sandbox'
import { execFileSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { sql } from 'drizzle-orm'
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from 'drizzle-kit/api'
import { createError } from 'h3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as schema from '../../server/db/schema'
import { DEPLOY_DIR, deployPreview, keepPreviewForDeploy, reserveDeploy, shortenDeployCooldown } from '../../server/utils/templates/deploy'
import { PREVIEW_MAX_LIFETIME_MS } from '../../shared/utils/templates'

// Stands in for `npx vercel deploy --temporary`: like the real CLI, it keeps its project in `.vercel/anonymous.json` and prints the URL last.
const FAKE_NPX = `#!/bin/sh
[ "$FAIL" = 1 ] && { echo "Error: build failed" >&2; exit 1; }
ls -A > "$LISTING"
mkdir -p .vercel
[ -f .vercel/anonymous.json ] || echo '{"projectId":"prj_'$(date +%s%N)'","token":"secret-deploy-token","claimUrl":"https://vercel.com/claim-deployment?code=abc","expiresAt":1794914204624}' > .vercel/anonymous.json
mkdir -p node_modules && echo installed > node_modules/marker
echo "Running pnpm run build"
printf 'https://zippy-kazoo.tmp.now'
`

describe('deploying a live preview', () => {
  let app: string, bin: string
  const env = (extra: Record<string, string> = {}) => ({ ...process.env, PATH: `${bin}:${process.env.PATH}`, LISTING: join(bin, 'listing'), ...extra })
  const sandbox = (extra?: Record<string, string>) => ({
    runCommand: vi.fn(async ({ cmd, args }: { cmd: string, args: string[] }) => {
      try {
        const stdout = execFileSync(cmd, args, { cwd: app, env: env(extra), encoding: 'utf8' })
        return { exitCode: 0, stdout: async () => stdout }
      } catch (error: any) {
        return { exitCode: error.status, stdout: async () => error.stdout ?? '' }
      }
    })
  }) as unknown as Sandbox

  beforeEach(() => {
    vi.stubGlobal('createError', createError)
    rmSync(DEPLOY_DIR, { recursive: true, force: true })
    app = mkdtempSync(join(tmpdir(), 'template-app-'))
    bin = mkdtempSync(join(tmpdir(), 'fake-npx-'))
    writeFileSync(join(bin, 'npx'), FAKE_NPX)
    chmodSync(join(bin, 'npx'), 0o755)
    const files = {
      'app/app.vue': '<template><h1>Edited by Nuxi</h1></template>',
      'app/pages/about.vue': '<template>About</template>',
      'package.json': '{}',
      'app/plugins/nuxt-com-preview.client.js': 'bridge',
      'node_modules/nuxt/index.js': 'dependency',
      '.output/server/index.mjs': 'build',
      '.vercel/project.json': '{"projectId":"the-template-authors"}'
    }
    for (const [path, content] of Object.entries(files)) {
      mkdirSync(join(app, path, '..'), { recursive: true })
      writeFileSync(join(app, path), content)
    }
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    for (const dir of [app, bin, DEPLOY_DIR]) rmSync(dir, { recursive: true, force: true })
  })

  it('deploys a clean copy of the edited app and returns its claim link, never its deploy token', async () => {
    const result = await deployPreview(sandbox())
    expect(result).toEqual({ url: 'https://zippy-kazoo.tmp.now', claimUrl: 'https://vercel.com/claim-deployment?code=abc', expiresAt: 1794914204624 })
    expect(JSON.stringify(result)).not.toContain('secret-deploy-token')
    // What the CLI saw: no preview bridge, dependencies, build output or the template's own Vercel project.
    expect(readFileSync(join(bin, 'listing'), 'utf8').split('\n').filter(Boolean).sort()).toEqual(['app', 'package.json'])
    expect(existsSync(join(DEPLOY_DIR, 'app/plugins/nuxt-com-preview.client.js'))).toBe(false)
    expect(readFileSync(join(DEPLOY_DIR, 'app/app.vue'), 'utf8')).toContain('Edited by Nuxi')
    expect(existsSync(join(app, 'node_modules/marker'))).toBe(false)
  })

  it('redeploys the latest edits to the same temporary project', async () => {
    await deployPreview(sandbox())
    const project = () => JSON.parse(readFileSync(join(DEPLOY_DIR, '.vercel/anonymous.json'), 'utf8')).projectId
    const first = project()
    rmSync(join(app, 'app/pages/about.vue'))
    writeFileSync(join(app, 'app/app.vue'), '<template><h1>Edited again</h1></template>')
    await deployPreview(sandbox())
    expect(existsSync(join(DEPLOY_DIR, 'app/pages/about.vue'))).toBe(false)
    expect(readFileSync(join(DEPLOY_DIR, 'app/app.vue'), 'utf8')).toContain('Edited again')
    expect(project()).toBe(first)
  })

  it('reports a failed build without upstream details', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(deployPreview(sandbox({ FAIL: '1' }))).rejects.toMatchObject({ statusCode: 502, message: 'The deploy failed. Vercel could not build this version of the app.' })
  })
})

describe('failed deploys', () => {
  const MINUTE = 60_000
  const created = Date.UTC(2026, 10, 17, 12)

  beforeEach(async () => {
    const db = drizzle(createClient({ url: ':memory:' }), { schema })
    for (const statement of await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(schema))) {
      await db.run(sql.raw(statement))
    }
    await db.insert(schema.templatePreviews).values({ id: 'templates-preview-x', owner: 'owner', reservedAt: new Date(created), expiresAt: new Date(created + 11 * MINUTE) })
    vi.stubGlobal('createError', createError)
    vi.stubGlobal('schema', schema)
    vi.stubGlobal('db', db)
    vi.useFakeTimers({ now: created + MINUTE, toFake: ['Date'] })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('wait between attempts and never keep the preview past its lifetime cap', async () => {
    let expiresAt = created + 10 * MINUTE
    const sandbox = {
      name: 'templates-preview-x',
      createdAt: new Date(created),
      get expiresAt() { return new Date(expiresAt) },
      extendTimeout: vi.fn(async (ms: number) => { expiresAt += ms })
    } as unknown as Sandbox
    // The route's order: keep the preview, take the slot, and on a failed build, shorten the cooldown.
    const failDeploy = async () => {
      await keepPreviewForDeploy('owner', sandbox, PREVIEW_MAX_LIFETIME_MS)
      await shortenDeployCooldown('owner', await reserveDeploy('owner'))
    }

    await failDeploy()
    await expect(failDeploy()).rejects.toMatchObject({ statusCode: 429 })
    let attempts = 1
    while (attempts < 20) {
      vi.setSystemTime(Date.now() + 2 * MINUTE)
      const error = await failDeploy().then(() => null, error => error)
      if (error) {
        expect(error).toMatchObject({ statusCode: 409 })
        break
      }
      attempts++
    }
    expect(expiresAt).toBeLessThanOrEqual(created + PREVIEW_MAX_LIFETIME_MS)
    // A failed build every two minutes, from minute one until the deploy no longer fits in the 30 minutes.
    expect(attempts).toBe(12)
  })
})
