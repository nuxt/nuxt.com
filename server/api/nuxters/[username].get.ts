import type { NuxterProfilePage } from '#shared/types'
import { createError, defineHandler, getRouterParam } from 'nuxt/server'

export default defineHandler(async (event) => {
  const username = getRouterParam(event, 'username', { decode: true })
  if (!username || !/^[a-z0-9-]{1,39}$/i.test(username)) {
    throw createError({ status: 400, statusText: 'Invalid GitHub username' })
  }

  const nuxter = await nuxters.get(username)
  if (!nuxter) {
    throw createError({ status: 404, statusText: 'Nuxter not found' })
  }

  event.res.headers.set('cache-control', 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600')
  const [modules, blogPosts, translationLocales] = await Promise.all([
    nuxterModules(event, nuxter),
    nuxterBlogPosts(nuxter.username),
    nuxterTranslations(event, nuxter.username)
  ])
  return { ...nuxter, modules, blogPosts, translationLocales } satisfies NuxterProfilePage
})
