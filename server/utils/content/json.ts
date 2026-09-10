import type { ContentListFile } from 'comark-content'

/** Deterministic JSON (sorted object keys) for stable equality checks. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const object = value as Record<string, unknown>

  return `{${Object.keys(object)
    .sort()
    .map(key => `${JSON.stringify(key)}:${stableStringify(object[key])}`)
    .join(',')}}`
}

/** Stable hash of a manifest item's visible metadata (its `data` — identity lives on `meta`). */
export function hashManifestItem(item: ContentListFile | undefined): string {
  if (!item) return ''

  return stableStringify(item.data ?? {})
}
