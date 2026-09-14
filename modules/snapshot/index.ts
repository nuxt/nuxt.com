import { mkdir, stat } from 'node:fs/promises'
import { defineNuxtModule, useLogger } from '@nuxt/kit'
import { writeSnapshots } from 'comark-content/build'
import { join } from 'pathe'
import { createInstance, createInstanceSource } from '../../server/utils/content/factory'
import { instanceSource } from '../../server/utils/content/instances'
import { instanceSnapshotDir, SNAPSHOT_ASSET_BASE, SNAPSHOT_INSTANCE_KEYS } from '../../server/utils/content/snapshot'
import type { ContentInstanceKey } from '../../shared/utils/content'
import { resolveSnapshotSha } from './utils'

const logger = useLogger('snapshot')

/**
 * Writes build-time snapshots into the function bundle, stamped with the commit they were parsed at.
 * A cold start at that commit hydrates from one instead of walking the content repository.
 * At a later commit it still supplies every unchanged body.
 *
 * `SNAPSHOT_INSTANCE_KEYS` says which instances get one, and why not all of them.
 */
export default defineNuxtModule({
  meta: { name: 'snapshot' },
  setup(_options, nuxt) {
    // Do not run in dev or prepare.
    if (nuxt.options.dev || nuxt.options._prepare) return

    const dir = join(nuxt.options.buildDir, SNAPSHOT_ASSET_BASE)

    nuxt.hook('modules:done', async () => {
      await mkdir(dir, { recursive: true })
      nuxt.options.nitro.serverAssets = [
        ...(nuxt.options.nitro.serverAssets ?? []),
        { baseName: SNAPSHOT_ASSET_BASE, dir }
      ]
    })

    nuxt.hook('build:before', async () => {
      const token = process.env.NUXT_GITHUB_TOKEN || process.env.GITHUB_TOKEN

      // Sequential: parallel parses compete for the same CPU and make the timings below meaningless.
      for (const key of SNAPSHOT_INSTANCE_KEYS) {
        await writeInstanceSnapshot(key, { dir, rootDir: nuxt.options.rootDir, token })
      }
    })
  }
})

interface WriteOptions {
  /** Server-asset directory each instance writes a subdirectory of. */
  dir: string
  /** Repository root of the checkout being built. */
  rootDir: string
  token?: string
}

/** One instance's snapshot, never throwing: a build-time optimization must not fail a build. */
async function writeInstanceSnapshot(key: ContentInstanceKey, options: WriteOptions): Promise<void> {
  const { name, source } = instanceSource(key)

  const resolveStart = performance.now()
  const sha = await resolveSnapshotSha({
    source,
    repoRoot: options.rootDir,
    token: options.token,
    warn: message => logger.warn(message)
  })
  const resolveMs = Math.round(performance.now() - resolveStart)

  if (!sha) {
    logger.warn(`No commit could be confirmed to hold ${key}'s content, so no snapshot is shipped for it.`)
    return
  }

  const instanceDir = join(options.dir, instanceSnapshotDir(key))

  // `withRef` stamps the artifact with the commit.
  // At runtime, even at a different commit, we can reuse unchanged bodies.
  const content = createInstance(key, createInstanceSource(source, {
    sha,
    token: options.token,
    useLocalDir: source.local,
    rootDir: options.rootDir
  })).withRef(sha)

  try {
    const writeStart = performance.now()
    await writeSnapshots(content, { dir: instanceDir })
    const writeMs = Math.round(performance.now() - writeStart)

    // Size is the number to watch: the snapshot is inlined into the bundle as a string.
    // Every cold start that reads it pays for that.
    const { size } = await stat(join(instanceDir, name, 'snapshot.json'))
    logger.success(`${key} snapshot ${sha.slice(0, 7)}: ${Math.round(size / 1024)} kB parsed and written in ${writeMs}ms (ref resolved in ${resolveMs}ms)`)
  } catch (error) {
    logger.warn(`Could not write ${key}'s content snapshot — its cold starts will walk the content repository.`, error)
  } finally {
    await content.dispose().catch(() => {})
  }
}
