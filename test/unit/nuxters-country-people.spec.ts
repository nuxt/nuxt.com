import { afterEach, describe, expect, it } from 'vitest'
import { effectScope, ref } from 'vue'
import type { NuxtersPage } from '../../shared/types'
import { useNuxtersCountryPeople } from '../../app/composables/useNuxtersCountryPeople'

const page = (country: string | null, period = '12m', username = 'danielroe'): NuxtersPage => ({
  country,
  period,
  periods: ['12m', 'all'],
  total: 1,
  totals: { contributions: 1, mergedPullRequests: 1, issues: 0, comments: 0 },
  syncedAt: '2026-10-29T00:00:00.000Z',
  items: [{ githubId: 1, username, rank: 1, score: 1 }]
})

const scopes: ReturnType<typeof effectScope>[] = []
afterEach(() => scopes.splice(0).forEach(scope => scope.stop()))

function setup(initial: NuxtersPage = page('GB')) {
  const leaderboard = ref<NuxtersPage | undefined>(initial)
  const country = ref<string | null>(initial.country)
  const period = ref<string | undefined>(initial.period)
  const scope = effectScope()
  scopes.push(scope)
  const people = scope.run(() => useNuxtersCountryPeople({ leaderboard, country, period }))!
  return { leaderboard, country, period, people }
}

describe('country card people', () => {
  it('reuses the server-rendered leaderboard immediately', () => {
    const { people } = setup()
    expect(people.value.map(person => person.username)).toEqual(['danielroe'])
  })

  it('restores a visited country before its navigation finishes', () => {
    const { leaderboard, country, people } = setup()
    country.value = 'FR'
    expect(people.value).toEqual([])
    leaderboard.value = page('FR', '12m', 'atinux')
    expect(people.value.map(person => person.username)).toEqual(['atinux'])

    country.value = 'GB'
    expect(people.value.map(person => person.username)).toEqual(['danielroe'])
    leaderboard.value = page('GB', '12m', 'updated')
    expect(people.value.map(person => person.username)).toEqual(['updated'])
  })

  it('does not show a late response for a different country', () => {
    const { leaderboard, country, people } = setup()
    country.value = 'DE'
    leaderboard.value = page('FR', '12m', 'atinux')
    expect(people.value).toEqual([])
    country.value = 'FR'
    expect(people.value.map(person => person.username)).toEqual(['atinux'])
  })

  it('keeps periods separate, including the all-time fallback', () => {
    const { leaderboard, period, people } = setup(page('GB', 'all'))
    period.value = '12m'
    expect(people.value).toEqual([])
    leaderboard.value = page('GB', '12m', 'recent')
    expect(people.value.map(person => person.username)).toEqual(['recent'])
    period.value = 'all'
    expect(people.value.map(person => person.username)).toEqual(['danielroe'])
  })

  it('does not assign the worldwide leaderboard to a country', () => {
    const { country, people } = setup(page(null))
    country.value = 'GB'
    expect(people.value).toEqual([])
    country.value = null
    expect(people.value).toEqual([])
  })

  it('keeps the card cache local to the page instance', () => {
    const first = setup()
    const second = setup(page('FR', '12m', 'atinux'))
    second.country.value = 'GB'
    expect(second.people.value).toEqual([])
    expect(first.people.value.map(person => person.username)).toEqual(['danielroe'])
  })
})
