import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { NuxtersMap } from '../../shared/types'
import NuxtersWorld from '../../app/components/nuxters/NuxtersWorld.vue'

const map: NuxtersMap = {
  period: '12m',
  total: 20,
  located: 20,
  countries: [
    { code: 'GB', count: 12, top: ['danielroe', 'HugoRCD', 'luc122c'] },
    { code: 'FR', count: 8, top: ['atinux', 'pi0', 'benjamincanac'] }
  ]
}

const wrappers: Awaited<ReturnType<typeof mountSuspended>>[] = []
afterEach(() => wrappers.splice(0).forEach(wrapper => wrapper.unmount()))

describe('world country card', () => {
  it('shows known usernames while the country leaderboard is pending, then fills in ranks without replacing their images', async () => {
    const wrapper = await mountSuspended(NuxtersWorld, {
      props: { map, modelValue: 'GB', people: [] },
      global: {
        stubs: {
          LazyNuxtersGlobe: true,
          UTooltip: { template: '<slot />' },
          UButton: true,
          UIcon: true,
          USkeleton: true
        }
      }
    })
    wrappers.push(wrapper)
    const card = wrapper.find('ul')
    expect(card.findAll('li')).toHaveLength(12)
    expect(card.findAll('img').map(img => img.attributes('alt'))).toEqual(map.countries[0]!.top)
    expect(card.attributes('aria-busy')).toBe('true')
    expect(card.find('a').attributes('aria-label')).toBe('danielroe')
    const image = card.find('img').element

    await wrapper.setProps({ people: map.countries[0]!.top.map((username, index) => ({ githubId: index + 1, username, rank: index + 1, score: 10 })) })
    expect(card.find('a').attributes('aria-label')).toBe('danielroe, #1')
    expect(card.find('img').element).toBe(image)

    await wrapper.setProps({ modelValue: 'FR', people: [] })
    expect(card.findAll('img').map(img => img.attributes('alt'))).toEqual(map.countries[1]!.top)
    expect(card.findAll('li')).toHaveLength(8)
    expect(card.find('a').attributes('aria-label')).toBe('atinux')
    expect(card.text()).not.toContain('danielroe')
  })
})
