// This route will be pre-rendered as /api/navigation.json
import { queryCollectionSearchSections } from '@nuxt/content/server'

export default defineEventHandler(async (event) => {
  return Promise.all([
    queryCollectionSearchSections(event, 'docsv3', { ignoredTags: ['style'] }),
    queryCollectionSearchSections(event, 'docsv4', { ignoredTags: ['style'] }),
    queryCollectionSearchSections(event, 'blog')
  ]).then(data => data.flat())
})
