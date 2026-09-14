import { describe, expect, it } from 'vitest'
import { CONTENT_INSTANCE_KEYS, isContentInstanceKey } from '../../shared/utils/content'
import { hasBuildSnapshot, instanceSnapshotDir, SNAPSHOT_INSTANCE_KEYS } from '../../server/utils/content/snapshot'
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

describe('SNAPSHOT_INSTANCE_KEYS', () => {
  it('names only instances the site actually serves', () => {
    expect(SNAPSHOT_INSTANCE_KEYS.length).toBeGreaterThan(0)
    for (const key of SNAPSHOT_INSTANCE_KEYS) {
      expect(isContentInstanceKey(key), key).toBe(true)
      expect(CONTENT_INSTANCE_KEYS, key).toContain(key)
    }
  })

  it('agrees with `hasBuildSnapshot`', () => {
    for (const key of CONTENT_INSTANCE_KEYS) {
      expect(hasBuildSnapshot(key), key).toBe(SNAPSHOT_INSTANCE_KEYS.includes(key))
    }
  })

  it('ships the local site instance, whose content the build already holds', () => {
    expect(SNAPSHOT_INSTANCE_KEYS).toContain('site')
    expect(instanceSource('site').source.local).toBe(true)
  })
})
