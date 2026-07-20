import { describe, expect, it } from 'vitest'
import { modulesCacheKey, normalizeModulesQuery } from '../../shared/utils/modules-query'

describe('normalizeModulesQuery', () => {
  it('accepts string version values', () => {
    expect(normalizeModulesQuery({ version: '4' }).version).toBe('4')
    expect(normalizeModulesQuery({ version: '3' }).version).toBe('3')
    expect(normalizeModulesQuery({ version: 'all' }).version).toBe('all')
  })

  it('coerces numeric version values from h3 query parsing', () => {
    expect(normalizeModulesQuery({ version: 4 }).version).toBe('4')
    expect(normalizeModulesQuery({ version: 3 }).version).toBe('3')
  })

  it('defaults missing version to 3', () => {
    expect(normalizeModulesQuery({}).version).toBe('3')
    expect(normalizeModulesQuery({ version: '' }).version).toBe('3')
    expect(normalizeModulesQuery({ version: null }).version).toBe('3')
  })
})

describe('modulesCacheKey', () => {
  it('stringifies numeric version in the cache key', () => {
    expect(modulesCacheKey({ version: 4 })).toBe('4-all')
    expect(modulesCacheKey({ version: '4', category: 'UI' })).toBe('4-UI')
  })
})
