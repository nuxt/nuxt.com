/**
 * A hosting provider guide (`content/deploy/*.md`).
 *
 * TODO Hand-written for now: Phase 8 declares the site source's schema and generates these instead.
 */
export interface DeployProvider {
  path: string
  stem: string
  extension?: string
  title: string
  description: string
  category: string
  website: string
  /** Absent on the few providers rendered through a component image instead of a logo file. */
  logoSrc?: string
  logoIcon?: string
  componentImg?: string
  nitroPreset?: string
  sponsor?: boolean
  [key: string]: unknown
}
