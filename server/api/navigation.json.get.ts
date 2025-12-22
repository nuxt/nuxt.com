// This route will be pre-rendered as /api/navigation.json
import { queryCollectionNavigation } from '@nuxt/content/server'

export default defineEventHandler(async (event) => {
  return Promise.all([
    queryCollectionNavigation(event, 'docsv3', ['titleTemplate']).then(data => data[0]?.children),
    queryCollectionNavigation(event, 'docsv4', ['titleTemplate']).then(data => data[0]?.children),
    queryCollectionNavigation(event, 'blog')
  ]).then(data => data.flat())
})
