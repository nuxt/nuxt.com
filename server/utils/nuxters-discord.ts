import type { H3Event } from 'h3'
import type { NuxterBadges } from '#shared/types'
import { NUXTERS_HACKATHONS } from '#shared/utils/nuxters'

const DISCORD_API = 'https://discord.com/api/v10'

export const nuxtersDiscord = {
  /**
   * `enabled` is `false` until the OAuth app, the guild and the bot are all configured.
   * Each value comes from the runtime config (`NUXT_OAUTH_DISCORD_*`, `NUXT_NUXTERS_DISCORD_*`), or the
   * `NUXT_DISCORD_*` env vars of the Vercel project: read at runtime, they never end up in the build.
   */
  config(event: H3Event) {
    const { nuxters: { discord }, oauth } = useRuntimeConfig(event)
    const env = process.env
    const configured = discord.roles as Record<string, string | undefined>
    const config = {
      clientId: oauth?.discord?.clientId || env.NUXT_DISCORD_CLIENT_ID || '',
      clientSecret: oauth?.discord?.clientSecret || env.NUXT_DISCORD_CLIENT_SECRET || '',
      guildId: discord.guildId || env.NUXT_DISCORD_GUILD_ID || '',
      botToken: discord.botToken || env.NUXT_DISCORD_BOT_TOKEN || '',
      roles: {
        nuxter: configured.nuxter || env.NUXT_DISCORD_NUXTER_ROLE_ID || '',
        moduleAuthor: configured.moduleAuthor || env.NUXT_DISCORD_MODULE_MAINTAINER_ROLE_ID || '',
        // `NUXT_DISCORD_HACKATHON_ROLE_IDS_NUXTATHON1` for `nuxtathon1`
        ...Object.fromEntries(NUXTERS_HACKATHONS.map(hackathon => [
          hackathon.id,
          configured[hackathon.id] || env[`NUXT_DISCORD_HACKATHON_ROLE_IDS_${hackathon.id.toUpperCase()}`] || ''
        ]))
      } as Record<string, string>
    }
    const enabled = Boolean(config.clientId && config.clientSecret && config.guildId && config.botToken)
    return { enabled, ...config }
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
