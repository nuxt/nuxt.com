import { coerce, getMajor, getMinor, getPatch, isGreaterOrEqual } from 'verkit'

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
 * - newer than `latest` -> always `true`
 * - older than `latest` -> `true` while it is within `tolerance`
 * - unparseable input -> `false`
 */
export function satisfiesVersionTolerance(version: string | undefined | null, latest: string | undefined | null, tolerance: VersionTolerance = {}): boolean {
  const target = coerce(version?.trim() ?? '')
  const threshold = versionThreshold(latest, tolerance)
  if (!target || !threshold) return false

  return isGreaterOrEqual(target, threshold)
}
