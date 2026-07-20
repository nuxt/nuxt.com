import { describe, expect, it } from 'vitest'
import { getModuleNuxtMajors, moduleSupportsNuxt } from '../../shared/utils/modules'

describe('moduleSupportsNuxt against CDN registry', () => {
  it('finds Nuxt 4 compatible modules in the live modules.json', async () => {
    const modules = await fetch('https://unpkg.com/@nuxt/modules@latest/modules.json')
      .then(res => res.json()) as Array<{ name: string, compatibility?: { nuxt?: string } }>

    const nuxt4 = modules.filter(module => moduleSupportsNuxt(module.compatibility?.nuxt, 4))
    expect(modules.length).toBeGreaterThan(100)
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
