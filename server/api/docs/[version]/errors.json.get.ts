import { docsPathPrefix, isDocVersion } from '#shared/utils/docs'
import { docsInstanceKey } from '#shared/utils/content'
import { createError, defineHandler, getRouterParam } from 'nuxt/server'

/**
 * The error-code reference for one docs version.
 */
export default defineHandler(async (event) => {
  const version = getRouterParam(event, 'version', { decode: true })
  if (!version || !isDocVersion(version)) {
    throw createError({ status: 404, statusText: 'Unknown docs version' })
  }

  const content = await getInstanceAtHead(docsInstanceKey(version))
  const items = await content.list()
  const prefix = `${docsPathPrefix(version)}/errors/`

  return items
    .filter(item => item.meta.extension === '.md' && item.path.startsWith(prefix))
    .map(item => ({
      path: item.path,
      title: (item.data?.title as string) ?? '',
      description: (item.data?.description as string) ?? ''
    }))
    .sort((a, b) => a.path.localeCompare(b.path))
})
