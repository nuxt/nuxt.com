import { createContentClient } from 'comark-content/client'
import { isChildPath } from '#shared/utils/content'

export const clientContent = createContentClient({
  // Nuxt's $fetch so during SSR we have direct function calling
  // Saving additional API call
  fetch: $fetch
})

export async function listChildren(prefix: string) {
  const items = await clientContent.list('content')
  return items.filter(item => isChildPath(item.path, item.meta.stem, prefix))
}
