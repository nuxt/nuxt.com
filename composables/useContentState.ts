import type { NavItem, ParsedContent } from '@nuxt/content/dist/runtime/types'

export const useContentState = () => {
  /**
   * Navigation tree from root of app.
   */
  const navigation = useState<NavItem[]>('content-navigation', () => null)

  /**
   * Current page complete data.
   */
  const page = useState<ParsedContent>('content-page', () => null)

  /**
   * Previous and next page data.
   * Format: [prev, next]
   */
  const surround = useState<ParsedContent[]>('content-page-surround', () => null)

  return {
    navigation,
    page,
    surround
  }
}
