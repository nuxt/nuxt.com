/**
 * Logging for the search worker (based on the `?debug=search` flag).
 */
import type { ContentFile, Logger, RelationalDatabase } from 'comark-content/runtime'

const PREFIX = '[search:worker]'

let debug = false

/** Called on every `warmup`; once on, it stays on for the life of the worker. */
export function setDebug(value: boolean): void {
  debug = debug || value
}

export function isDebug(): boolean {
  return debug
}

export function log(...args: unknown[]): void {
  if (debug) console.info(PREFIX, ...args)
}

/** Milliseconds since `from`, for log lines. */
export function since(from: number): string {
  return `${(performance.now() - from).toFixed(1)}ms`
}

export const logger: Logger = {
  debug: (tag, ...args) => log(`${tag}:`, ...args),
  info: (tag, ...args) => log(`${tag}:`, ...args),
  warn: (tag, ...args) => console.warn(`${PREFIX} ${tag}:`, ...args),
  error: (tag, ...args) => console.error(`${PREFIX} ${tag}:`, ...args)
}

/**
 * What a decoded artifact holds:
 * - a snapshot decodes to `{ items: ContentFile[] }`
 * - the manifest to `{ items }` keyed by path, without bodies
 *
 * `with nodes` is the number that matters: the FTS plugin only indexes
 * `kind === 'document' && nodes?.length`, so a bodies-less snapshot builds an empty index — which
 * is otherwise indistinguishable from a query that matched nothing.
 */
export function describeArtifact(decoded: unknown): string {
  const items = (decoded as { items?: unknown } | null)?.items

  // A snapshot's items are an array of parsed files; a manifest's are a record keyed by path.
  if (Array.isArray(items)) {
    const files = items as ContentFile[]
    const documents = files.filter(item => item.meta?.kind === 'document')
    const withNodes = documents.filter(item => item.nodes?.length)

    return `${files.length} item(s), ${documents.length} document(s), ${withNodes.length} with nodes`
  }

  return `${items ? Object.keys(items).length : 0} manifest item(s)`
}

/**
 * Rows in the FTS plugin's index
 * Allows to distinguish between "nothing was indexed" and "the query found nothing".
 *
 * Reads the plugin's private table, so it is a diagnostic, not something to build on.
 */
export async function indexedRows(database: RelationalDatabase, source: string): Promise<number | string> {
  try {
    const rows = await database.all<{ n: number }>('SELECT count(*) as n FROM __fts_search WHERE source = ?', [source])
    return rows?.[0]?.n ?? 'unknown'
  } catch (error) {
    return `unknown (${error instanceof Error ? error.message : String(error)})`
  }
}
