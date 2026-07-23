import {
  defaultDiscordAuth,
  discordChannel,
  type DiscordCommandInteraction,
  type DiscordContext
} from 'eve/channels/discord'

const DISCORD_CONTEXT = [
  'The user is talking to Nuxi on Discord (slash command).',
  '**Discord formatting:** Use absolute nuxt.com links (`https://nuxt.com/docs/...`) — root-relative paths do not render as links on Discord. Standard Unicode emojis only (no Slack custom emojis). Never use `show_prompt` here. Keep replies compact — Discord splits messages over 2000 characters.'
]

export default discordChannel({
  // Credentials resolve from DISCORD_PUBLIC_KEY, DISCORD_APPLICATION_ID and
  // DISCORD_BOT_TOKEN env vars on the eve service.
  onCommand(_ctx: DiscordContext, interaction: DiscordCommandInteraction) {
    return {
      auth: defaultDiscordAuth(interaction),
      context: DISCORD_CONTEXT
    }
  },
  events: {
    async 'session.failed'(_event, channel) {
      await channel.discord.post(
        'Something went wrong and I cannot continue here. Run the command again to start over.'
      )
    }
  }
})
