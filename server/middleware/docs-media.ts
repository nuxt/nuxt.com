import { DEFAULT_MEDIA_EXTENSIONS, type MediaMethods } from 'comark-content/plugins/media'
import { hasModuleDocs, moduleDocsPathPrefix } from '#shared/utils/module-docs'
import { moduleInstanceKey } from '#shared/utils/content'
import { parsePullPath } from '#shared/utils/pull'
import { decodePath } from 'ufo'
import { defineHandler } from 'nuxt/server'

/** `/modules/<name>/<file key>.<media extension>`, the URL `docsMedia()` gives an image. */
const MEDIA_PATH_RE = new RegExp(`^/modules/([^/]+)/(.+(?:${DEFAULT_MEDIA_EXTENSIONS.map(ext => ext.replace('.', '\\.')).join('|')}))$`, 'i')

/**
 * Serve the images hosted module docs keep next to their pages, from the instance the page is read from:
 * the local checkout in dev, the PR's head commit in a preview (`/pull/:repo/:number/modules/…`).
 * Anything else falls through to the page.
 */
export default defineHandler(async (event) => {
  if (event.req.method !== 'GET' && event.req.method !== 'HEAD') return

  const pathname = decodePath(event.url.pathname)
  const preview = parsePullPath(pathname)
  const match = MEDIA_PATH_RE.exec(preview?.path ?? pathname)
  const name = match?.[1]
  if (!name || !hasModuleDocs(name)) return

  const key = moduleInstanceKey(name)
  // Module docs instances carry the `media()` plugin (`instancePlugins()`).
  const content = (preview
    ? await getInstanceForPull(await resolvePullPreview(preview.target), key)
    : await getInstanceAtHead(key)) as Awaited<ReturnType<typeof getInstanceAtHead>> & MediaMethods
  const item = content.stat(match[2]!)
  if (item?.meta.kind !== 'media' || !item.path.startsWith(`${moduleDocsPathPrefix(name)}/`)) return

  const body = await content.media.get(item.meta.key)
  if (body == null) return

  event.res.headers.set('content-type', item.meta.type || 'application/octet-stream')
  event.res.headers.set('x-content-type-options', 'nosniff')
  // An SVG opened on its own runs on this origin: no scripts, no requests.
  event.res.headers.set('content-security-policy', 'default-src \'none\'; style-src \'unsafe-inline\'; sandbox')
  // A media item changes with the commit the instance reads, as the pages do (`/modules/**` ISR).
  event.res.headers.set('cache-control', 'public, max-age=600')

  return body as Uint8Array
})
