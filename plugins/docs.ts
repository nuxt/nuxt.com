import type { ParsedContent, NavItem } from '@nuxt/content/dist/runtime/types'
import { defineNuxtPlugin } from '#imports'
import { fetchContent } from '~/utils/content'

/**
 * Define a nuxt plugin to hook on the `app:data:refresh` hook.
 *
 * This allows to have same behavior as current content hot refresh,
 * without relying on `useAsyncData` composable.
 */
export default defineNuxtPlugin((nuxtApp) => {
  // Listen on `app:data:refresh` hook, triggered on any save on `nuxt/content` mount points.
  nuxtApp.hooks.hook('app:data:refresh' as any, async () => {
    const navigation = useState<NavItem[]>('navigation')

    const page = useState<ParsedContent>('docs-current-page')

    const surround = useState<ParsedContent[]>('docs-surround')

    const route = useRoute()

    // Fetch the navigation.
    // @ts-ignore - Fix that TS issue upstream (nuxt/content-next)
    navigation.value = await queryContent().findNavigation()

    // Fetch the page and surround content.
    await fetchContent(route.path, navigation, page, surround)
  })
})
