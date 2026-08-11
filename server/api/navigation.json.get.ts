import { docsSourceGroups } from '#shared/utils/docs'

export default defineEventHandler(async () => {
  // `?? []` matters: if a source comes back empty (it happens at runtime on
  // Vercel when content isn't fully available), navigation may be undefined.
  // Every consumer iterates these items reading `item.path`, so a single null
  // took down SSR for the whole docs section.
  //
  // Prefer the version root (`/docs/4.x`) so `app.vue` can filter with
  // `item.path === version.path`. When navigation nests under `/docs`, unwrap
  // one level.
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
