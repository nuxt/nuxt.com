import { describe, expect, it } from 'vitest'
import { safeRedirectPath } from '../../shared/utils/redirect'

describe('safeRedirectPath', () => {
  it('keeps same-origin paths with their query and hash', () => {
    expect(safeRedirectPath('/nuxters')).toBe('/nuxters')
    expect(safeRedirectPath('/chat/abc?tab=1#top')).toBe('/chat/abc?tab=1#top')
  })

  it('rejects paths the browser resolves to another origin', () => {
    expect(safeRedirectPath('//evil.com')).toBeNull()
    expect(safeRedirectPath('/\\evil.com')).toBeNull()
    expect(safeRedirectPath('/\t/evil.com')).toBeNull()
    expect(safeRedirectPath('/\\\\evil.com/path')).toBeNull()
  })

  it('rejects anything that is not a rooted path', () => {
    expect(safeRedirectPath('https://evil.com')).toBeNull()
    expect(safeRedirectPath('javascript:alert(1)')).toBeNull()
    expect(safeRedirectPath('nuxters')).toBeNull()
    expect(safeRedirectPath(undefined)).toBeNull()
    expect(safeRedirectPath(['/nuxters'])).toBeNull()
  })
})
