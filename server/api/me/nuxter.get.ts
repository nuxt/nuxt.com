import type { NuxterMe } from '#shared/types'

/** The signed-in user's stats, badges and Discord link, for the /nuxters card. */
export default defineEventHandler(async (event): Promise<NuxterMe> => {
  const { user } = await requireUserSession(event)
  setResponseHeader(event, 'cache-control', 'private, no-store')

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
      enabled: nuxtersDiscord.config(event).enabled,
      username: discord?.username ?? null,
      roles: discord?.roles ?? []
    }
  }
})
