import { CURRENT_DOCS_VERSION } from '../../../shared/utils/docs'
import { docsInstanceKey, type ContentInstanceKey } from '../../../shared/utils/content'

/**
 * Where the build snapshots live, shared by the writer and the reader.
 *
 * `modules/snapshot/` imports this file, so it stays free of nitro auto-imports.
 * The readers that use them are in `index.ts`.
 */

/** Server-asset namespace the snapshots are written into and read back through. */
export const SNAPSHOT_ASSET_BASE = 'comark-content'

/**
 * Instances shipped with a build-time snapshot.
 *
 * Not every instance earns one: the artifact is inlined into the bundle as a string.
 * - `site` is in the checkout, so the build parses it without touching GitHub.
 * - `docs:4.x` is the current stable docs, the busiest remote instance.
 *
 * The rest keep hydrating from GitHub through the per-commit Runtime Cache.
 */
export const SNAPSHOT_INSTANCE_KEYS: ContentInstanceKey[] = ['site', docsInstanceKey(CURRENT_DOCS_VERSION)]

/** Whether `key` ships a build-time snapshot. */
export function hasBuildSnapshot(key: ContentInstanceKey): boolean {
  return SNAPSHOT_INSTANCE_KEYS.includes(key)
}

/**
 * Directory an instance's artifacts live under, relative to `SNAPSHOT_ASSET_BASE`.
 *
 * Keyed by instance, not by name: `docs:3.x`, `docs:4.x` and `docs:5.x` are all named `docs`.
 */
export function instanceSnapshotDir(key: ContentInstanceKey): string {
  return key.replace(':', '/')
}
