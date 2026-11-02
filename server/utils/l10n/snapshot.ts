import { gunzipSync, gzipSync } from 'node:zlib'
import type { L10nCoverage, L10nLocale } from '../../../shared/utils/l10n'
import { createBundle, type L10nBundle } from './bundle'
import { sourceCoverage, TRANSLATION_SOURCES } from './coverage'
import type { TranslationsTree } from './tree'

/** Bump when the stored layout changes: entries of another version are never read. */
const L10N_SNAPSHOT_VERSION = 'v1'

/** Characters per stored shard of records, below the Runtime Cache's 2 MB item limit. */
const SHARD_LENGTH = 1_000_000

/** What one locale is served from at one translations commit, built once and stored. */
export interface L10nSnapshot {
  bundle: L10nBundle
  /** Coverage of each file of each translated source, by source name, then repository path. */
  coverage: Record<string, Record<string, L10nCoverage>>
}

interface StoredMeta {
  shards: number
  coverage: L10nSnapshot['coverage']
}

/** The subset of an unstorage `Storage` the snapshot reads and writes. */
export interface SnapshotStorage {
  getItem: (key: string) => Promise<unknown>
  setItem: (key: string, value: unknown) => Promise<void>
}

const key = (sha: string, locale: L10nLocale, part: string | number) => `${L10N_SNAPSHOT_VERSION}:${sha}:${locale}:${part}`

/** Build `locale`'s snapshot from the repository at one commit: its records, and the coverage of every source file. */
export function buildL10nSnapshot(tree: TranslationsTree, locale: L10nLocale): L10nSnapshot {
  const bundle = createBundle(tree.records(locale), locale, tree.sha)
  const coverage: L10nSnapshot['coverage'] = {}
  for (const source of TRANSLATION_SOURCES) {
    const manifest = tree.manifests.get(source.name)
    if (manifest) coverage[source.name] = sourceCoverage(manifest, bundle)
  }
  return { bundle, coverage }
}

/**
 * Store a snapshot: the records gzipped in as many shards as the item size limit needs, then the
 * entry pointing at them, so a reader that finds the entry finds every shard.
 */
export async function writeL10nSnapshot(storage: SnapshotStorage, snapshot: L10nSnapshot, records: Record<string, unknown>, { shardLength = SHARD_LENGTH } = {}): Promise<void> {
  const { locale, sha } = snapshot.bundle
  const encoded = gzipSync(JSON.stringify(records)).toString('base64')
  const shards = Math.max(1, Math.ceil(encoded.length / shardLength))
  await Promise.all(Array.from({ length: shards }, (_, index) =>
    storage.setItem(key(sha, locale, index), encoded.slice(index * shardLength, (index + 1) * shardLength))))
  await storage.setItem(key(sha, locale, 'meta'), { shards, coverage: snapshot.coverage } satisfies StoredMeta)
}

/** The stored snapshot of `locale` at `sha`, `undefined` when it is missing or incomplete. */
export async function readL10nSnapshot(storage: SnapshotStorage, sha: string, locale: L10nLocale): Promise<L10nSnapshot | undefined> {
  const meta = await storage.getItem(key(sha, locale, 'meta')) as StoredMeta | null
  if (!meta?.shards || !meta.coverage) return

  const shards = await Promise.all(Array.from({ length: meta.shards }, (_, index) => storage.getItem(key(sha, locale, index))))
  if (shards.some(shard => typeof shard !== 'string')) return

  const records = JSON.parse(gunzipSync(Buffer.from(shards.join(''), 'base64')).toString('utf8')) as Record<string, unknown>
  return { bundle: createBundle(records, locale, sha), coverage: meta.coverage }
}
