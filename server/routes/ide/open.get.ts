import { isAllowedIdeDeeplink } from '../../../layers/nuxi/shared/utils/ide-deeplinks'

export default defineEventHandler((event) => {
  const to = getQuery(event).to
  if (typeof to !== 'string' || !to.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Missing to parameter' })
  }

  const deeplink = to.trim()
  if (!isAllowedIdeDeeplink(deeplink)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid IDE deeplink' })
  }

  return sendRedirect(event, deeplink, 302)
})
