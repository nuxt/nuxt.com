import { kv } from 'hub:kv'
import { z } from 'zod'
import { createError, defineEventHandler, getRequestHeader, getRequestURL, readValidatedBody } from 'nuxt/server'
import { raycastReturnTo } from '../../../shared/utils/raycast'
import { issueRaycastCredential } from '../../../layers/nuxi/server/utils/raycast-auth'

export default defineEventHandler(async (event) => {
  event.res.headers.set('cache-control', 'no-store')
  event.res.headers.set('referrer-policy', 'no-referrer')
  if (getRequestHeader(event, 'origin') !== getRequestURL(event).origin || (getRequestHeader(event, 'sec-fetch-site') && getRequestHeader(event, 'sec-fetch-site') !== 'same-origin')) {
    throw createError({ statusCode: 403, statusMessage: 'Connect to Raycast from this website' })
  }
  const { user } = await requireUserSession(event)
  const body = await readValidatedBody(event, z.object({ returnTo: z.string().max(2048) }).parse)
  const returnTo = raycastReturnTo(body.returnTo)
  if (!returnTo) throw createError({ statusCode: 400, statusMessage: 'Open this page from Raycast to connect' })
  if (user.provider !== 'github' || user.role !== 'admin' || !(await isAuthorizedAdmin(toH3Event(event), user.username))) {
    throw createError({ statusCode: 403, statusMessage: 'Nuxi in Raycast is currently available to the Nuxt team' })
  }
  const credential = await issueRaycastCredential(kv, user.id)
  const callback = new URL(returnTo)
  callback.hash = new URLSearchParams({ token: credential.token, expires_in: String(credential.expiresIn) }).toString()
  return { redirectTo: callback.href }
})
