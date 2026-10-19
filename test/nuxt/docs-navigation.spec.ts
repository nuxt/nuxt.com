import type { NavigationItem } from 'comark-content'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, inject, type Ref } from 'vue'
import { navigationPath } from '#shared/utils/content'
import App from '~/app.vue'

// One root per version, so the rendered paths tell which tree was fetched.
for (const version of ['3.x', '4.x'] as const) {
  registerEndpoint(navigationPath(version), () => [{ title: 'Docs', path: `/docs/${version}` }])
}
registerEndpoint('/api/content/heads', () => ({}))

// Stands in for the layout, and renders the roots of the tree `app.vue` provides.
const NavigationRoots = defineComponent(() => {
  const navigation = inject<Ref<NavigationItem[]>>('navigation')!
  return () => h('p', { id: 'navigation-roots' }, navigation.value.map(item => item.path).join(','))
})

describe('app.vue', () => {
  it('fetches the new version\'s navigation when the route switches version', async () => {
    const wrapper = await mountSuspended(App, {
      route: '/docs/4.x/getting-started/introduction',
      global: { stubs: { NuxtLayout: NavigationRoots } }
    })
    const roots = () => wrapper.find('#navigation-roots').text()
    expect(roots()).toBe('/docs/4.x')

    await useRouter().push('/docs/3.x/getting-started/introduction')

    await vi.waitFor(() => expect(roots()).toBe('/docs/3.x'))
  })
})
