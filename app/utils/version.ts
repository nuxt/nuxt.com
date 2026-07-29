import { coerce, getMajor, getMinor, getPatch, isGreaterOrEqual } from 'verkit'

/**
 * Shortcuts for a requirement that has no version number yet, mapped to how they render:
 * `label` where there is room, `short` in tight spots like the sidebar.
 * They stand for something unreleased, so tolerance never filters them out.
 */
export const VERSION_KEYWORDS = {
  unreleased: { label: 'nightly', short: 'soon' }
} as const

export type VersionKeyword = keyof typeof VERSION_KEYWORDS

/** The keyword `version` stands for, if it is one. */
export function versionKeyword(version: string | undefined | null): VersionKeyword | undefined {
  const value = version?.trim().toLowerCase()
  return value && value in VERSION_KEYWORDS ? value as VersionKeyword : undefined
}

/**
 * How a minimum version requirement reads as a badge — a version number as `v<version>`,
 * a keyword as its label qualified by the major it applies to (`unreleased` -> `nightly v4`,
 * `soon` where space is tight). The aria label always spells out the long form.
 * Returns `undefined` when there is nothing to show.
 */
export function versionBadgeLabels(version: string | undefined | null, tag?: string): { label: string, shortLabel: string, ariaLabel: string } | undefined {
  const value = version?.trim()
  if (!value) return undefined

  const keyword = versionKeyword(value)
  const label = keyword ? [VERSION_KEYWORDS[keyword].label, tag].filter(Boolean).join(' ') : `v${value}`
  const shortLabel = keyword ? VERSION_KEYWORDS[keyword].short : label

  return { label, shortLabel, ariaLabel: `Minimum Nuxt Version: ${label}` }
}

/**
 * Where the release announcement for a version lives, e.g. `4.5.2` -> `/blog/v4-5`.
 * A major release drops the minor (`4.0.0` -> `/blog/v4`), matching how the posts are named.
 * The path is derived, not verified — check it against the blog collection before linking.
 */
export function versionBlogPath(version: string | undefined | null): string | undefined {
  const target = coerce(version?.trim() ?? '')
  if (!target) return undefined

  const minor = getMinor(target)

  return `/blog/v${getMajor(target)}${minor ? `-${minor}` : ''}`
}

/** The nightly release channel guide for a docs version, e.g. `/docs/4.x` -> how to install nightly. */
export function nightlyChannelPath(docsPath: string | undefined): string | undefined {
  if (!docsPath?.startsWith('/docs')) return undefined

  return `${docsPath}/guide/going-further/nightly-release-channel`
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
 * - a keyword like `unreleased` -> always `true`, it describes a version that has no number yet
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
