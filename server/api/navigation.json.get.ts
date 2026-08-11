import { docsSourceGroups } from '#shared/utils/docs'
import type { ContentNavigationItem } from '#shared/types/content'

export default defineEventHandler(async (): Promise<ContentNavigationItem[]> => {
  // Return [] when a source is empty (e.g. GitHub fetch failed at runtime) and
  // unwrap the `/docs` level so `app.vue` can filter on the version root path.
  async function versionNav(sources: readonly string[]) {
    const data = await content.navigation([...sources])
    if (!data?.length) return []

    if (data[0]?.path === '/docs' && data[0].children?.length) {
      return data[0].children
    }

    return data
  }

  const [docsv3Nav, docsv4Nav, docsv5Nav, blogNav] = await Promise.all([
    versionNav(docsSourceGroups.docsv3),
    versionNav(docsSourceGroups.docsv4),
    versionNav(docsSourceGroups.docsv5),
    content.navigation(['local']).then(items => items.filter(item =>
      item.path === '/blog' || (item.path?.startsWith('/blog/') && !item.path.includes('.navigation'))
    ))
  ])

  return [...docsv3Nav, ...docsv4Nav, ...docsv5Nav, ...blogNav].filter(Boolean)
})
