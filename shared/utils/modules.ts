import { satisfies } from 'verkit'

export type NuxtMajor = '2' | '3' | '4'

/**
 * Whether a module's `compatibility.nuxt` range covers the given Nuxt major.
 */
export function isCompatibleWith(major: NuxtMajor, range: string) {
  if (satisfies(`${major}.999.999`, range)) {
    return true
  }
  // Nuxt 3 is EOL, so a range still capped at `^3.x` is a stale declaration
  // rather than a real exclusion of Nuxt 4: keep listing those modules under 4.
  return major === '4' && satisfies('3.999.999', range)
}
