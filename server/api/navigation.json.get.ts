// This route will be pre-rendered as /api/navigation.json
import { queryCollectionNavigation } from '@nuxt/content/server'

export default defineEventHandler(async (event) => {
  // `?? []` matters: if a collection comes back empty (it happens at runtime on
  // Vercel when the content DB isn't fully available), `data[0]?.children` is
  // `undefined`, `.flat()` keeps it as an element, and JSON turns it into a
  // `null` entry. Every consumer iterates these items reading `item.path`, so a
  // single null took down SSR for the whole docs section.
  return Promise.all([
    queryCollectionNavigation(event, 'docsv3', ['titleTemplate']).then(data => data[0]?.children ?? []),
    queryCollectionNavigation(event, 'docsv4', ['titleTemplate']).then(data => data[0]?.children ?? []),
    queryCollectionNavigation(event, 'docsv5', ['titleTemplate']).then(data => data[0]?.children ?? []),
    queryCollectionNavigation(event, 'blog')
  ]).then(data => data.flat().filter(Boolean))
})
