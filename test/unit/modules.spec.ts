import { describe, expect, it } from 'vitest'
import type { Module } from '../../shared/types'
import { supportsNuxt3OrLater } from '../../shared/utils/modules'
import { findModuleProvider, moduleMatchesSearch } from '../../app/composables/useModules'
import { searchTextRegExp } from '../../app/utils'

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

describe('module search', () => {
  const image = {
    name: 'image',
    npm: '@nuxt/image',
    category: 'Images & Media',
    description: 'Add images with progressive processing, lazy-loading, resizing and providers support.',
    repo: 'nuxt/image',
    providers: [
      { name: 'cloudflareimages', label: 'Cloudflare Images' },
      { name: 'cloudinary', label: 'Cloudinary' }
    ]
  } as Module

  it('finds a module through the label of one of its providers', () => {
    const query = searchTextRegExp('cloudinary')
    expect(moduleMatchesSearch(image, query)).toBe(false)
    expect(findModuleProvider(image, query)?.name).toBe('cloudinary')
    // Searching for the module itself still matches it directly
    expect(moduleMatchesSearch(image, searchTextRegExp('image'))).toBe(true)
  })
})
