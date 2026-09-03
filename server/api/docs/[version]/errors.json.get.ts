import { docsPathPrefix, isDocVersion } from '#shared/utils/docs'
import { docsInstanceKey } from '#shared/utils/content'

/**
 * The error-code reference for one docs version.
 */
export default defineEventHandler(async (event) => {
  const version = getRouterParam(event, 'version')
  if (!version || !isDocVersion(version)) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown docs version' })
  }

  const content = await getInstanceAtHead(docsInstanceKey(version))
  const items = await content.list('docs')
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
