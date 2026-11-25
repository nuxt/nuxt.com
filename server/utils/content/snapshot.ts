import type { ContentInstanceKey } from '../../../shared/utils/content'

/**
 * Where the build snapshots live, shared by the writer and the reader.
 *
 * Every instance ships one (`modules/snapshot/` writes them for `CONTENT_INSTANCE_KEYS`):
 * an instance without one downloads every file of its content directory whenever its cache is cold.
 *
 * `modules/snapshot/` imports this file, so it stays free of nitro auto-imports.
 * The readers that use them are in `index.ts`.
 */

/** Server-asset namespace the snapshots are written into and read back through. */
export const SNAPSHOT_ASSET_BASE = 'comark-content'

/**
 * Directory an instance's artifacts live under, relative to `SNAPSHOT_ASSET_BASE`.
 *
 * Keyed by instance, not by name: `docs:3.x`, `docs:4.x` and `docs:5.x` are all named `docs`.
 */
export function instanceSnapshotDir(key: ContentInstanceKey): string {
  return key.replace(':', '/')
}
