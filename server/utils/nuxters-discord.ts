import type { H3Event } from 'h3'
import type { NuxterBadges } from '#shared/types'

const DISCORD_API = 'https://discord.com/api/v10'

export const nuxtersDiscord = {
  /** `enabled` is `false` until the OAuth app, the guild and the bot are all configured. */
  config(event: H3Event) {
    const { nuxters: { discord }, oauth } = useRuntimeConfig(event)
    const enabled = Boolean(oauth?.discord?.clientId && oauth?.discord?.clientSecret && discord.guildId && discord.botToken)
    return { enabled, ...discord }
  },

  /**
   * Add the user to the Nuxt guild, then give the roles their badges unlock.
   * Returns the role keys granted (`nuxter`, `moduleAuthor`, hackathon ids).
   */
  async grant(event: H3Event, { discordId, accessToken, badges }: { discordId: string, accessToken: string, badges: NuxterBadges }): Promise<string[]> {
    const { guildId, botToken, roles } = nuxtersDiscord.config(event)
    const headers = {
      'Authorization': `Bot ${botToken}`,
      'User-Agent': 'DiscordBot (https://nuxt.com/nuxters, 1.0)'
    }

    // 201 when added, 204 when already a member. `guilds.join` scope required.
    await $fetch(`${DISCORD_API}/guilds/${guildId}/members/${discordId}`, {
      method: 'PUT',
      headers,
      body: { access_token: accessToken }
    })

    const wanted: string[] = [
      ...(badges.nuxter ? ['nuxter'] : []),
      ...(badges.moduleAuthor ? ['moduleAuthor'] : []),
      ...badges.hackathons
    ]
    const roleIds = roles as Record<string, string | undefined>

    const granted: string[] = []
    for (const key of wanted) {
      const roleId = roleIds[key]
      if (!roleId) continue
      await $fetch(`${DISCORD_API}/guilds/${guildId}/members/${discordId}/roles/${roleId}`, { method: 'PUT', headers })
      granted.push(key)
    }
    return granted
  }
}
