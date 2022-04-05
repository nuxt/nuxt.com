import { NavItem, ParsedContent } from '@nuxt/content/dist/runtime/types'
import { findElement } from '../utils/content'

export const useContentPage = () => {
  const route = useRoute()

  // Navigation
  const navigation = useState<NavItem[]>('navigation')

  // Navigation from current
  const currentNavigation = computed(
    () => {
      if (!navigation.value) { return [] }

      // Get first level of navigation
      const splitted = route.path.split('/')
      // Scoped to dir:
      // splitted.splice(0, splitted.length - 1).join('/')
      // Scoped to first level dir:
      // `/${splitted[1]}`
      const level = `/${splitted[1]}`

      // Find current level of navigation
      const { found } = findElement(navigation.value, level)

      return found?.children || []
    }
  )

  // Current page
  const page = useState<ParsedContent>('docs-current-page')

  // Surround ([prev, next])
  const surround = useState<ParsedContent[]>('docs-surround')

  // ToC from `page`
  const toc = computed(
    () => page?.value?.body?.toc?.links || []
  )

  // Content type
  const type = computed(() => page.value?.meta?.type)

  // Next page from `surround`
  const next = computed(
    () => surround.value[1] || false
  )

  // Previous page from `surround`
  const previous = computed(
    () => surround.value[0] || false
  )

  return {
    navigation,
    currentNavigation,
    page,
    surround,
    next,
    previous,
    type,
    toc
  }
}
