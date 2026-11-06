import { kv } from 'hub:kv'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { createError, defineEventHandler, readValidatedBody } from 'nuxt/server'
import { readRaycastCredential, revokeRaycastCredential } from '../../utils/raycast-auth'

export default defineEventHandler(async (event) => {
  requireInternalRequest(toH3Event(event))
  event.res.headers.set('cache-control', 'no-store')
  const { action, token } = await readValidatedBody(event, z.object({ action: z.enum(['authenticate', 'revoke']), token: z.string().max(256) }).parse)
  if (action === 'revoke') {
    await revokeRaycastCredential(kv, token)
    return { ok: true }
  }
  const credential = await readRaycastCredential(kv, token)
  if (!credential) throw createError({ statusCode: 401, statusMessage: 'Sign in to connect Nuxi' })
  const user = await db.query.users.findFirst({ where: () => eq(schema.users.id, credential.userId) })
  // Always check the current account and GitHub access; the bearer stores no roles.
  if (!user || user.provider !== 'github' || user.role !== 'admin' || !(await isAuthorizedAdmin(toH3Event(event), user.username))) {
    throw createError({ statusCode: 403, statusMessage: 'Nuxt team access required' })
  }
  return { id: user.id, name: user.name || user.username, login: user.username, role: user.role, avatarUrl: user.avatar, expiresAt: credential.expiresAt }
})
