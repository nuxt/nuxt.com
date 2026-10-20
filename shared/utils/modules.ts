import { isValidRange, rangesIntersect } from 'verkit'

/** Whether a module's `compatibility.nuxt` range allows Nuxt 3 or any later major. */
export function supportsNuxt3OrLater(range: string | undefined) {
  return !!range && isValidRange(range) && rangesIntersect(range, '>=3')
}
