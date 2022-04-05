import { withoutTrailingSlash } from 'ufo'
import { NavItem, ParsedContent } from '@nuxt/content/dist/runtime/types'
import { findElement, findChildFromPath, findBottomLinkFromTree } from '../utils/content'

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
  const page = useState<ParsedContent>('content-current-page')

  // Surround ([prev, next])
  const surround = useState<ParsedContent[]>('content-surround')

  // ToC from `page`
  const toc = computed(
    () => page?.value?.body?.toc?.links || []
  )

  // Content type
  const type = computed(() => page.value?.meta?.type)

  // Next page from `surround`
  const next = computed(
    () => surround.value?.[1] || false
  )

  // Previous page from `surround`
  const previous = computed(
    () => surround.value?.[0] || false
  )

  // Local navigation fetching helper
  const fetchNavigation = async () => {
    // @ts-ignore
    navigation.value = await queryContent().findNavigation()
  }

  // Local page fetching helper
  const fetchPage = async () => {
    const currentPath = withoutTrailingSlash(route.path)
    const splitted = currentPath.split('/')
    const directory = splitted.slice(0, splitted.length - 1).join('/')

    // Get navigation node from current path
    const file = findChildFromPath(currentPath, navigation.value)

    if (file && !file.children) {
      // Path queried has a page (and is not a directory)
      await Promise.all([
        queryContent(currentPath).findOne() as Promise<ParsedContent>,
        queryContent(directory).findSurround(currentPath) as Promise<ParsedContent[]>
      ]).then(([_page, _surround]) => {
        page.value = _page
        surround.value = _surround
      })
    } else {
      // Path queried ain't a page, try to find a redirect to closest page
      try {
        const slug = findBottomLinkFromTree(file)

        return slug
      } catch (e) {}
    }
  }

  return {
    fetchPage,
    fetchNavigation,
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
