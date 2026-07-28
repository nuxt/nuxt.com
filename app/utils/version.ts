import { coerce, getMajor, getMinor, getPatch, isGreaterOrEqual } from 'verkit'

/**
 * Shortcuts for a requirement that has no version number yet. They stand for something
 * unreleased, so tolerance never filters them out and they render as-is instead of `v<version>`.
 */
export const VERSION_KEYWORDS = ['nightly'] as const

export type VersionKeyword = typeof VERSION_KEYWORDS[number]

/** The keyword `version` stands for, if it is one. */
export function versionKeyword(version: string | undefined | null): VersionKeyword | undefined {
  const value = version?.trim().toLowerCase()
  return VERSION_KEYWORDS.find(keyword => keyword === value)
}

/**
 * How a minimum version requirement reads as a badge — a version number as `v<version>`,
 * a keyword as-is, qualified by the major it applies to (`nightly v4`).
 * Returns `undefined` when there is nothing to show.
 */
export function versionBadgeLabels(version: string | undefined | null, tag?: string): { label: string, ariaLabel: string } | undefined {
  const value = version?.trim()
  if (!value) return undefined

  const keyword = versionKeyword(value)
  const label = keyword ? [keyword, tag].filter(Boolean).join(' ') : `v${value}`

  return { label, ariaLabel: `Minimum Nuxt Version: ${label}` }
}

/**
 * How far *behind* the latest release a version may be and still be worth surfacing.
 * Tolerance only ever looks backwards — versions newer than the latest release
 * (unreleased minors, the next major) are always accepted.
 *
 * The finest given level sets the granularity, everything below it is zeroed:
 * - `{ major: 0 }` keeps the whole current major
 * - `{ major: 1 }` keeps the previous major too
 * - `{ minor: 1 }` keeps the current and previous minor only
 * - `{ patch: 2 }` keeps the current minor from two patches back
 */
export interface VersionTolerance {
  major?: number
  minor?: number
  patch?: number
}

/**
 * Lowest version still within `tolerance` of `latest`,
 * e.g. `4.4.0` for latest `4.5.2` with `{ minor: 1 }`.
 */
export function versionThreshold(latest: string | undefined | null, tolerance: VersionTolerance = {}): string | undefined {
  const release = coerce(latest ?? '')
  if (!release) return undefined

  const { major, minor, patch } = tolerance
  const back = (value: number, offset = 0) => Math.max(0, value - offset)

  return [
    back(getMajor(release), major),
    minor !== undefined ? back(getMinor(release), minor) : patch !== undefined ? getMinor(release) : 0,
    patch !== undefined ? back(getPatch(release), patch) : 0
  ].join('.')
}

/**
 * Whether `version` is at or above the tolerated threshold, which means:
 * - a keyword like `nightly` -> always `true`, it describes an unreleased version
 * - newer than `latest` -> always `true`
 * - older than `latest` -> `true` while it is within `tolerance`
 * - unparseable input -> `false`
 */
export function satisfiesVersionTolerance(version: string | undefined | null, latest: string | undefined | null, tolerance: VersionTolerance = {}): boolean {
  if (versionKeyword(version)) return true

  const target = coerce(version?.trim() ?? '')
  const threshold = versionThreshold(latest, tolerance)
  if (!target || !threshold) return false

  return isGreaterOrEqual(target, threshold)
}
