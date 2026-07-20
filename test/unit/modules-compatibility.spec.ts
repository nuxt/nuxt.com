import { describe, expect, it } from 'vitest'
import { getModuleNuxtMajors, moduleSupportsNuxt } from '../../shared/utils/modules'

/** Deterministic stand-in for modules.json compatibility cases (no network). */
const registryFixture = [
  { name: 'only-nuxt3', compatibility: { nuxt: '^3.0.0' } },
  { name: 'only-nuxt4', compatibility: { nuxt: '^4.0.0' } },
  { name: 'nuxt3-and-4', compatibility: { nuxt: '^3.15.0 || ^4.0.0' } },
  { name: 'nuxt-gte-3', compatibility: { nuxt: '>=3.0.0' } },
  { name: 'nuxt2-only', compatibility: { nuxt: '^2.0.0' } },
  { name: 'missing-range', compatibility: {} },
  // Pad so the suite still asserts a registry-sized catalog (>100 modules).
  ...Array.from({ length: 100 }, (_, i) => ({
    name: `fixture-module-${i}`,
    compatibility: { nuxt: i % 2 === 0 ? '^3.0.0 || ^4.0.0' : '^3.0.0' }
  }))
]

describe('moduleSupportsNuxt against modules registry fixture', () => {
  it('finds Nuxt 4 compatible modules without network access', () => {
    const nuxt4 = registryFixture.filter(module =>
      moduleSupportsNuxt(module.compatibility?.nuxt, 4)
    )
    expect(registryFixture.length).toBeGreaterThan(100)
    expect(nuxt4.length).toBeGreaterThan(50)
  })
})

describe('moduleSupportsNuxt', () => {
  it('matches caret ranges for a single major', () => {
    expect(moduleSupportsNuxt('^3.0.0', 3)).toBe(true)
    expect(moduleSupportsNuxt('^3.0.0', 4)).toBe(false)
    expect(moduleSupportsNuxt('^4.0.0', 3)).toBe(false)
    expect(moduleSupportsNuxt('^4.0.0', 4)).toBe(true)
  })

  it('treats >=3.0.0 as compatible with Nuxt 3 and 4', () => {
    expect(moduleSupportsNuxt('>=3.0.0', 3)).toBe(true)
    expect(moduleSupportsNuxt('>=3.0.0', 4)).toBe(true)
  })

  it('handles union ranges', () => {
    const range = '^3.15.0 || ^4.0.0'
    expect(moduleSupportsNuxt(range, 3)).toBe(true)
    expect(moduleSupportsNuxt(range, 4)).toBe(true)
  })

  it('returns false for empty or invalid ranges', () => {
    expect(moduleSupportsNuxt(undefined, 3)).toBe(false)
    expect(moduleSupportsNuxt('', 3)).toBe(false)
    expect(moduleSupportsNuxt('not-a-range', 3)).toBe(false)
  })
})

describe('getModuleNuxtMajors', () => {
  it('returns badge majors for common ranges', () => {
    expect(getModuleNuxtMajors('^3.0.0')).toEqual([3])
    expect(getModuleNuxtMajors('^4.0.0')).toEqual([4])
    expect(getModuleNuxtMajors('>=3.0.0')).toEqual([3, 4])
    expect(getModuleNuxtMajors('^3.15.0 || ^4.0.0')).toEqual([3, 4])
  })
})
