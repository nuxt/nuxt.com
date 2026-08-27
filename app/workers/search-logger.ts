/**
 * Logging for the search worker (based on the `?debug=search` flag).
 */
import type { ContentFile, Logger, RelationalDatabase } from 'comark-content'

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
 * - a snapshot decodes to the source's items
 * - the manifest to an object keyed by path
 */
export function describeArtifact(decoded: unknown): string {
  if (Array.isArray(decoded)) {
    const items = decoded as ContentFile[]
    const documents = items.filter(item => item.meta.kind === 'document')
    const withNodes = documents.filter(item => item.nodes?.length)
    return `${items.length} item(s), ${documents.length} document(s), ${withNodes.length} with nodes`
  }
  const items = (decoded as { items?: Record<string, unknown> } | null)?.items
  return `${items ? Object.keys(items).length : 0} manifest item(s)`
}

/**
 * Rows in the FTS plugin's index
 * Allows to distinguish between "nothing was indexed" and "the query found nothing".
 */
export async function indexedRows(database: RelationalDatabase, sources: string[]): Promise<number | string> {
  try {
    const placeholders = sources.map(() => '?').join(', ')
    const rows = await database.all<{ n: number }>(
      `SELECT count(*) as n FROM __fts_search WHERE source IN (${placeholders})`,
      sources
    )
    return rows?.[0]?.n ?? 'unknown'
  } catch (error) {
    return `unknown (${error instanceof Error ? error.message : String(error)})`
  }
}
