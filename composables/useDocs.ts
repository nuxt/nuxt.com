import { NavItem, ParsedContent } from '@nuxt/content/dist/runtime/types'

export const useDocs = () => {
  // Navigation
  const navigation = useState<NavItem[]>('navigation')

  // Current page
  const page = useState<ParsedContent>('docs-current-page')

  // Surround ([prev, next])
  const surround = useState<ParsedContent[]>('docs-surround')

  // ToC from `page`
  const toc = computed(
    () => page?.value?.body?.toc?.links || []
  )

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
    page,
    surround,
    next,
    previous,
    toc
  }
}
