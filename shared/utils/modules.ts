import { satisfies } from 'semver'

export type NuxtMajor = 2 | 3 | 4
export type ModuleNuxtBadgeMajor = 3 | 4

/**
 * Whether a module's `compatibility.nuxt` semver range includes the given major.
 * Uses the same probe version pattern as `/api/v1/modules` (`${major}.999.999`).
 */
export function moduleSupportsNuxt(range: string | undefined, major: NuxtMajor): boolean {
  if (!range) {
    return false
  }

  try {
    return satisfies(`${major}.999.999`, range)
  } catch {
    return false
  }
}

/** Majors shown as badges on the modules UI (Nuxt 3 / Nuxt 4). */
export function getModuleNuxtMajors(range: string | undefined): ModuleNuxtBadgeMajor[] {
  const majors: ModuleNuxtBadgeMajor[] = []
  if (moduleSupportsNuxt(range, 3)) {
    majors.push(3)
  }
  if (moduleSupportsNuxt(range, 4)) {
    majors.push(4)
  }
  return majors
}
