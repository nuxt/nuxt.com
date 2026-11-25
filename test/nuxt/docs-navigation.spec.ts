import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { navigationPath } from '#shared/utils/content'

// One root per version, so the rendered paths tell which tree was fetched.
for (const version of ['3.x', '4.x'] as const) {
  registerEndpoint(navigationPath(version), () => [{ title: 'Docs', path: `/docs/${version}` }])
}

// Renders the roots of the tree, as the docs page reads them.
const NavigationRoots = defineComponent(async () => {
  const { data: navigation } = await useDocsNavigation()
  return () => h('p', { id: 'navigation-roots' }, (navigation.value ?? []).map(item => item.path).join(','))
})

describe('useDocsNavigation', () => {
  it('fetches the new version\'s navigation when the route switches version', async () => {
    const wrapper = await mountSuspended(NavigationRoots, {
      route: '/docs/4.x/getting-started/introduction'
    })
    const roots = () => wrapper.find('#navigation-roots').text()
    expect(roots()).toBe('/docs/4.x')

    await useRouter().push('/docs/3.x/getting-started/introduction')

    await vi.waitFor(() => expect(roots()).toBe('/docs/3.x'))
  })
})
