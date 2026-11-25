import * as zlib from 'node:zlib'
import { restorePolicy, snapshotPolicy, type Glossary, type PolicySnapshot } from '@diglot/core'
import { decodeRecordsView, encodeRecords } from '@diglot/store/runtime'
import type { L10nCoverage, L10nLocale } from '../../../shared/utils/l10n'
import { createBundle, emptyBundle, type L10nBundle } from './bundle'
import { sourceCoverage, TRANSLATION_SOURCES } from './coverage'
import type { TranslationsTree } from './tree'

/** Bump when the stored layout changes: entries of another version are never read. */
const L10N_SNAPSHOT_VERSION = 'v4'

/** `decodeRecordsView` reads either; zstd is faster where `node:zlib` has it. */
const COMPRESSION = 'zstdCompressSync' in zlib ? 'zstd' : 'gzip'

/** Bytes per stored item, below the Runtime Cache's 2 MB item limit. */
const ITEM_SIZE = 1_900_000

/** What one locale is served from at one translations commit, built once and stored. */
export interface L10nSnapshot {
  bundle: L10nBundle
  /** Coverage of each file of each translated source, by source name, then repository path. */
  coverage: Record<string, Record<string, L10nCoverage>>
  glossary: Glossary
}

interface StoredMeta {
  /** The encoded records, when they fit in this item. */
  records?: string
  /** Otherwise, how many shards hold them. */
  shards?: number
  reviewed: boolean
  coverage: L10nSnapshot['coverage']
  glossary: Glossary
  policy: PolicySnapshot
}

/** The subset of an unstorage `Storage` the snapshot reads and writes. */
export interface SnapshotStorage {
  getItem: (key: string) => Promise<unknown>
  setItem: (key: string, value: unknown) => Promise<void>
}

/** A snapshot without records: every segment shows its English source. */
export function emptySnapshot(locale: L10nLocale): L10nSnapshot {
  return { bundle: emptyBundle(locale), coverage: {}, glossary: { terms: [] } }
}

const key = (sha: string, locale: L10nLocale, part: string | number) => `${L10N_SNAPSHOT_VERSION}:${sha}:${locale}:${part}`

/** Build `locale`'s snapshot from the repository at one commit: its records, and the coverage of every source file. */
export function buildL10nSnapshot(tree: TranslationsTree, locale: L10nLocale): L10nSnapshot {
  const bundle = createBundle(tree.records(locale), locale, tree.sha, { policy: tree.policy })
  const coverage: L10nSnapshot['coverage'] = {}
  for (const source of TRANSLATION_SOURCES) {
    const manifest = tree.manifests.get(source.name)
    if (manifest) coverage[source.name] = sourceCoverage(manifest, bundle)
  }
  return { bundle, coverage, glossary: tree.glossary(locale) }
}

/**
 * Store a snapshot in one item when it fits the item size limit. Otherwise the encoded records go in
 * as many shards as the limit needs, then the entry pointing at them, so a reader that finds the
 * entry finds every shard.
 */
export async function writeL10nSnapshot(storage: SnapshotStorage, snapshot: L10nSnapshot, records: ReadonlyMap<string, unknown>, { itemSize = ITEM_SIZE } = {}): Promise<void> {
  const { locale, sha } = snapshot.bundle
  const encoded = await encodeRecords(records, { compression: COMPRESSION })
  const meta: StoredMeta = { reviewed: snapshot.bundle.reviewed, coverage: snapshot.coverage, glossary: snapshot.glossary, policy: snapshotPolicy(snapshot.bundle.policy) }
  if (encoded.length + Buffer.byteLength(JSON.stringify(meta)) < itemSize) {
    await storage.setItem(key(sha, locale, 'meta'), { ...meta, records: encoded })
    return
  }

  const shards = Math.ceil(encoded.length / itemSize)
  await Promise.all(Array.from({ length: shards }, (_, index) =>
    storage.setItem(key(sha, locale, index), encoded.slice(index * itemSize, (index + 1) * itemSize))))
  await storage.setItem(key(sha, locale, 'meta'), { ...meta, shards })
}

/** The stored snapshot of `locale` at `sha`, `undefined` when it is missing or incomplete. */
export async function readL10nSnapshot(storage: SnapshotStorage, sha: string, locale: L10nLocale): Promise<L10nSnapshot | undefined> {
  const meta = await storage.getItem(key(sha, locale, 'meta')) as StoredMeta | null
  if (!meta || typeof meta.reviewed !== 'boolean' || !meta.coverage || !meta.glossary || !meta.policy) return

  let data = meta.records
  if (typeof data !== 'string') {
    if (!meta.shards) return
    const shards = await Promise.all(Array.from({ length: meta.shards }, (_, index) => storage.getItem(key(sha, locale, index))))
    if (shards.some(shard => typeof shard !== 'string')) return
    data = shards.join('')
  }

  const records = await decodeRecordsView(data)
  return { bundle: createBundle(records, locale, sha, { reviewed: meta.reviewed, policy: restorePolicy(meta.policy) }), coverage: meta.coverage, glossary: meta.glossary }
}
