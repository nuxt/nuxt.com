import { queryCollection } from '@nuxt/content/server'

// Sitemap source for @nuxtjs/sitemap (see `sitemap.sources` in nuxt.config).
// Content collections are queried at request time: the module's build-time
// precompute emits unprefixed duplicate paths for the multi-source docs
// collections, and its app sources list prerendered 3.x/5.x pages and the
// unversioned /docs/* meta-refresh stubs, so both are bypassed.
export default defineEventHandler(async (event) => {
  const [docs, blog, deploy, landing, agencies, designKit, team] = await Promise.all([
    queryCollection(event, 'docsv4')
      .where('extension', '=', 'md')
      .select('path')
      .all(),
    queryCollection(event, 'blog')
      .where('draft', '=', 0)
      .where('extension', '=', 'md')
      .select('path', 'date')
      .all(),
    queryCollection(event, 'deploy').select('path').all(),
    queryCollection(event, 'landing').select('path').all(),
    queryCollection(event, 'agencies').select('path').all(),
    queryCollection(event, 'designKit').select('path').all(),
    queryCollection(event, 'team').select('path').all()
  ])

  return [
    ...docs.map(page => ({ loc: page.path })),
    ...(blog as Array<{ path: string, date?: string }>).map(post => ({ loc: post.path, ...(post.date ? { lastmod: post.date } : {}) })),
    ...[...deploy, ...landing, ...agencies, ...designKit, ...team].map(page => ({ loc: page.path }))
  ]
})
