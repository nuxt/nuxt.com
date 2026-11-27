import type { ContentShas } from '#shared/types'
import { isContentInstanceKey, type ContentInstanceKey } from '#shared/utils/content'
import { createError, defineHandler, getQuery } from 'nuxt/server'

/**
 * The commit each requested instance's search artifacts are pinned to.
 *
 * `null` per key in dev, where content is read live.
 */
export default defineHandler(async (event): Promise<ContentShas> => {
  const raw = getQuery(event).keys
  const keys = (typeof raw === 'string' ? raw.split(',') : []).map(key => key.trim()).filter(Boolean)

  if (!keys.length) {
    throw createError({ status: 400, statusText: 'Missing "keys" query parameter' })
  }

  const unknown = keys.filter(key => !isContentInstanceKey(key))
  if (unknown.length) {
    throw createError({ status: 404, statusText: `Unknown content instance(s): ${unknown.join(', ')}` })
  }

  const shas: ContentShas = {}
  await Promise.all(keys.map(async (key) => {
    const contentKey = key as ContentInstanceKey
    shas[contentKey] = import.meta.dev ? null : await resolveInstanceSha(contentKey)
  }))

  return shas
})
