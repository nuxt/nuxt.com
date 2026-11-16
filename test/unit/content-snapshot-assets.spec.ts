import { describe, expect, it } from 'vitest'
import { CONTENT_INSTANCE_KEYS } from '../../shared/utils/content'
import { instanceSnapshotDir } from '../../server/utils/content/snapshot'
import { instanceSource } from '../../server/utils/content/instances'

/** Where an instance's artifacts land, the way the build writes them and the runtime reads them. */
const artifactDir = (key: typeof CONTENT_INSTANCE_KEYS[number]) =>
  `${instanceSnapshotDir(key)}/${instanceSource(key).name}`

describe('snapshot asset layout', () => {
  it('gives every instance its own artifact directory', () => {
    // `docs:3.x`, `docs:4.x` and `docs:5.x` are all named `docs`.
    // Keying the directory by name would have the three overwrite each other.
    const dirs = CONTENT_INSTANCE_KEYS.map(artifactDir)

    expect(new Set(dirs).size).toBe(CONTENT_INSTANCE_KEYS.length)
  })

  it('mirrors the instance path, so a key cannot escape its directory', () => {
    for (const key of CONTENT_INSTANCE_KEYS) {
      const dir = instanceSnapshotDir(key)
      expect(dir, key).not.toMatch(/^\/|\.\./)
      expect(dir, key).toBe(key.replace(':', '/'))
    }
  })
})
