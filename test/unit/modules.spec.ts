import { describe, expect, it } from 'vitest'
import { supportsNuxt3OrLater } from '../../shared/utils/modules'

describe('supportsNuxt3OrLater', () => {
  it.each([
    ['^3.0.0', true],
    ['^2.16.0 || >=3.0.0-rc.9', true],
    ['>=4.1.0', true],
    ['^4.0.0', true],
    ['^5.0.0', true],
    ['^2.0.0', false],
    ['<3.0.0', false],
    ['latest', false],
    [undefined, false]
  ])('%s → %s', (range, expected) => {
    expect(supportsNuxt3OrLater(range)).toBe(expected)
  })
})
