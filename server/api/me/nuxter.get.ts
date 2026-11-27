import type { NuxterMe } from '#shared/types'
import { defineHandler } from 'nuxt/server'

/** The signed-in user's stats, badges and Discord link, for the /nuxters card. */
export default defineHandler(async (event): Promise<NuxterMe> => {
  const { user } = await requireUserSession(event)
  event.res.headers.set('cache-control', 'private, no-store')

  const [nuxter, row] = await Promise.all([
    // By GitHub id: stable when the user renames their account.
    nuxters.getByGithubId(user.providerId),
    db.query.users.findFirst({ where: () => eq(schema.users.id, user.id) })
  ])
  const discord = (row?.metadata as { discord?: { username?: string, roles?: string[] } } | null)?.discord

  return {
    username: user.username,
    nuxter,
    badges: await nuxters.badges(event, user, nuxter),
    discord: {
      enabled: nuxtersDiscord.config().enabled,
      username: discord?.username ?? null,
      roles: discord?.roles ?? []
    }
  }
})
