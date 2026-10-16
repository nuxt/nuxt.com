import { describe, expect, it } from 'vitest'
import { blogAuthors, isBlogPostBy } from '../../shared/utils/blog'

describe('blogAuthors', () => {
  it('derives the avatar and the Nuxter profile from the GitHub username', () => {
    expect(blogAuthors([{ username: 'pi0', name: 'Pooya Parsa', twitter: '_pi0_' }])).toEqual([{
      name: 'Pooya Parsa',
      username: 'pi0',
      avatar: { src: '/gh_avatar/pi0', alt: 'Pooya Parsa avatar' },
      to: '/nuxters/pi0',
      twitter: '_pi0_',
      bluesky: undefined
    }])
  })

  it('falls back to the username for the name, and keeps an explicit link', () => {
    const [author] = blogAuthors([{ username: 'guest', to: 'https://github.com/guest' }])
    expect(author).toMatchObject({ name: 'guest', to: 'https://github.com/guest', avatar: { src: '/gh_avatar/guest' } })
  })

  it('still reads authors written before `username`', () => {
    const [author] = blogAuthors([{ name: 'Someone', avatar: { src: 'https://example.com/a.png' }, to: 'https://x.com/someone' }])
    expect(author).toMatchObject({ name: 'Someone', username: undefined, avatar: { src: 'https://example.com/a.png' }, to: 'https://x.com/someone' })
  })

  it('skips invalid usernames and nameless entries', () => {
    expect(blogAuthors([{ username: '../admin' }, {}])).toEqual([])
    expect(blogAuthors(undefined)).toEqual([])
  })
})

describe('isBlogPostBy', () => {
  it('matches the username, case-insensitive', () => {
    const authors = [{ username: 'HugoRCD', name: 'Hugo Richard' }, { name: 'Legacy' }]
    expect(isBlogPostBy(authors, 'hugorcd')).toBe(true)
    expect(isBlogPostBy(authors, 'legacy')).toBe(false)
  })
})
