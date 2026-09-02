import { intersects, minVersion, Range, validRange } from 'semver'

export const CURRENT_NUXT_MAJOR = 4
export const CURRENT_NUXT_VERSION = '4'
export const MODULE_VERSION_VALUES = ['2', '2-bridge', '3', CURRENT_NUXT_VERSION, '5', 'all'] as const
export type ModuleVersion = typeof MODULE_VERSION_VALUES[number]

interface ModuleWithNuxtCompatibility {
  compatibility: {
    nuxt?: string
    requires?: {
      bridge?: string | boolean
    }
  }
}

export type ModuleCompatibilityStatus = 'current' | 'legacy' | 'future' | 'unknown'

export function moduleSupportsNuxt(range: string | undefined, major: number): boolean {
  const normalizedRange = range && validRange(range)
  if (!normalizedRange) return false

  if (intersects(
    normalizedRange,
    `>=${major}.0.0 <${major + 1}.0.0-0`,
    { includePrerelease: true }
  )) return true

  const minimum = minVersion(normalizedRange)
  return minimum?.major === major && minimum.prerelease.length > 0
}

export function filterModulesByNuxtVersions<T extends ModuleWithNuxtCompatibility>(modules: T[], versions: ModuleVersion[]): T[] {
  if (versions.includes('all')) return modules

  return modules.filter(module => versions.some((version) => {
    if (version === 'all') return true
    if (version === '2-bridge' && !module.compatibility.requires?.bridge) return false

    const major = Number(version === '2-bridge' ? 2 : version)
    return moduleSupportsNuxt(module.compatibility.nuxt, major)
  }))
}

function hasContinuousOpenUpperBound(range: string, startMajor: number): boolean {
  return new Range(range).set.some((comparators) => {
    const hasUpperBound = comparators.some(comparator =>
      comparator.operator === '<'
      || comparator.operator === '<='
      || (comparator.operator === '' && comparator.value !== '')
    )
    if (hasUpperBound) return false

    const branchRange = comparators.map(comparator => comparator.value).filter(Boolean).join(' ') || '*'
    const branchMinimum = minVersion(branchRange)
    if (!branchMinimum) return false

    for (let major = startMajor; major <= branchMinimum.major; major++) {
      if (!moduleSupportsNuxt(range, major)) return false
    }
    return true
  })
}

export function getModuleCompatibility(range: string | undefined): {
  status: ModuleCompatibilityStatus
  label: string
} {
  const normalizedRange = range && validRange(range)
  if (!normalizedRange) return { status: 'unknown', label: 'Unknown' }

  const supports2 = moduleSupportsNuxt(range, 2)
  const supports3 = moduleSupportsNuxt(range, 3)
  const supports4 = moduleSupportsNuxt(range, CURRENT_NUXT_MAJOR)
  const supports5 = moduleSupportsNuxt(range, 5)

  if (supports4) {
    if (supports3 && supports5) return { status: 'current', label: hasContinuousOpenUpperBound(normalizedRange, 3) ? 'Nuxt 3+' : 'Nuxt 3, 4, 5' }
    if (supports3) return { status: 'current', label: 'Nuxt 3, 4' }
    if (supports5) return { status: 'current', label: hasContinuousOpenUpperBound(normalizedRange, 4) ? 'Nuxt 4+' : 'Nuxt 4, 5' }
    return { status: 'current', label: 'Nuxt 4' }
  }

  if (supports5) return { status: 'future', label: hasContinuousOpenUpperBound(normalizedRange, 5) ? 'Nuxt 5+' : 'Nuxt 5' }
  if (supports3) return { status: 'legacy', label: supports2 ? 'Nuxt 2, 3' : 'Nuxt 3' }
  if (supports2) return { status: 'legacy', label: 'Nuxt 2' }

  const minimum = minVersion(normalizedRange)
  if (minimum && minimum.major > CURRENT_NUXT_MAJOR) {
    return { status: 'future', label: `Nuxt ${minimum.major}${hasContinuousOpenUpperBound(normalizedRange, minimum.major) ? '+' : ''}` }
  }
  if (minimum && minimum.major < CURRENT_NUXT_MAJOR) {
    return { status: 'legacy', label: 'Legacy' }
  }
  return { status: 'unknown', label: 'Unknown' }
}
