import { describe, expect, it } from 'vitest'
import { CURRENT_NUXT_VERSION, filterModulesByNuxtVersions, getModuleCompatibility, MODULE_VERSION_VALUES, moduleSupportsNuxt } from '../../shared/utils/modules'

describe('module compatibility', () => {
  it('uses Nuxt 4 as the current API version', () => {
    expect(CURRENT_NUXT_VERSION).toBe('4')
    expect(MODULE_VERSION_VALUES).toEqual(['2', '2-bridge', '3', '4', '5', 'all'])
  })

  it('matches semver ranges against each Nuxt major', () => {
    expect(moduleSupportsNuxt('~4.0.0', 4)).toBe(true)
    expect(moduleSupportsNuxt('^3.15.0 || ^4.0.0', 4)).toBe(true)
    expect(moduleSupportsNuxt('>=3.0.0 <4.0.0', 4)).toBe(false)
    expect(moduleSupportsNuxt('5.0.0-beta.1', 5)).toBe(true)
    expect(moduleSupportsNuxt('not-a-range', 4)).toBe(false)
  })

  it('classifies current, legacy, future, and unknown modules', () => {
    expect(getModuleCompatibility('>=4.0.0')).toEqual({ status: 'current', label: 'Nuxt 4+' })
    expect(getModuleCompatibility('^3.0.0')).toEqual({ status: 'legacy', label: 'Nuxt 3' })
    expect(getModuleCompatibility('^3.0.0 || ^4.0.0 || ^5.0.0')).toEqual({ status: 'current', label: 'Nuxt 3, 4, 5' })
    expect(getModuleCompatibility('3.0.0 || 4.0.0 || 5.0.0')).toEqual({ status: 'current', label: 'Nuxt 3, 4, 5' })
    expect(getModuleCompatibility('^3.0.0 || ^4.0.0 || ^5.0.0 || >=10.0.0')).toEqual({ status: 'current', label: 'Nuxt 3, 4, 5' })
    expect(getModuleCompatibility('^5.0.0')).toEqual({ status: 'future', label: 'Nuxt 5' })
    expect(getModuleCompatibility('5.0.0')).toEqual({ status: 'future', label: 'Nuxt 5' })
    expect(getModuleCompatibility('>=6.0.0')).toEqual({ status: 'future', label: 'Nuxt 6+' })
    expect(getModuleCompatibility('<2.0.0')).toEqual({ status: 'legacy', label: 'Legacy' })
    expect(getModuleCompatibility(undefined)).toEqual({ status: 'unknown', label: 'Unknown' })
  })

  it('filters every supported catalog version', () => {
    const modules = [
      { name: 'nuxt-2', compatibility: { nuxt: '^2.0.0' } },
      { name: 'bridge', compatibility: { nuxt: '^2.0.0', requires: { bridge: true } } },
      { name: 'nuxt-3', compatibility: { nuxt: '^3.0.0' } },
      { name: 'nuxt-4', compatibility: { nuxt: '^4.0.0' } },
      { name: 'nuxt-5', compatibility: { nuxt: '^5.0.0' } }
    ]

    expect(filterModulesByNuxtVersions(modules, ['2']).map(module => module.name)).toEqual(['nuxt-2', 'bridge'])
    expect(filterModulesByNuxtVersions(modules, ['2-bridge']).map(module => module.name)).toEqual(['bridge'])
    expect(filterModulesByNuxtVersions(modules, ['3']).map(module => module.name)).toEqual(['nuxt-3'])
    expect(filterModulesByNuxtVersions(modules, ['4']).map(module => module.name)).toEqual(['nuxt-4'])
    expect(filterModulesByNuxtVersions(modules, ['5']).map(module => module.name)).toEqual(['nuxt-5'])
    expect(filterModulesByNuxtVersions(modules, ['all'])).toHaveLength(5)
    expect(filterModulesByNuxtVersions(modules, ['3', '4']).map(module => module.name)).toEqual(['nuxt-3', 'nuxt-4'])
  })

  it('keeps a Nuxt 4-only Security module in the current catalog', () => {
    const modules = [
      { name: 'better-auth', category: 'Security', compatibility: { nuxt: '>=4.0.0' } },
      { name: 'legacy-auth', category: 'Security', compatibility: { nuxt: '^3.0.0' } }
    ]

    expect(modules.filter(module =>
      module.category === 'Security' && moduleSupportsNuxt(module.compatibility.nuxt, 4)
    ).map(module => module.name)).toEqual(['better-auth'])
  })
})
