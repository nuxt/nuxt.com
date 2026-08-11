import { withLeadingSlash, withoutTrailingSlash } from 'ufo'
import { renderContentFile } from '../../utils/markdown'

export default defineEventHandler(async (event) => {
  // Nitro doesn't populate a catch-all param when the segment has a suffix
  // ("[...slug].md"), so derive the content path from the request URL.
  const url = withoutTrailingSlash(event.path.split('?')[0] || '')
  const slug = decodeURIComponent(url.replace(/^\/raw\//, '').replace(/\.md$/, ''))
  if (!slug) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  }

  let path = withLeadingSlash(slug)
  if (path.endsWith('/index')) {
    path = path.slice(0, -6) || '/'
  }

  const file = await content.get(path)
  if (!file) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  }

  setResponseHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  return renderContentFile(file)
})
