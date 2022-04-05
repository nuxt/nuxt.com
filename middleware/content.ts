import type { ParsedContent, NavItem } from '@nuxt/content/dist/runtime/types'
import { fetchContent } from '~/utils/content'

export default defineNuxtRouteMiddleware(async (to) => {
  const navigation = useState<NavItem[]>('navigation')

  const page = useState<ParsedContent>('docs-current-page')

  const surround = useState<ParsedContent[]>('docs-surround')

  const redirect = await fetchContent(to.path, navigation, page, surround)

  if (redirect) { return redirect }
})
