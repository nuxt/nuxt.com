import { connectSlackCredentials } from '@vercel/connect/eve'
import {
  defaultSlackAuth,
  defineSlackRenderer,
  slackChannel,
  type SlackContext,
  type SlackInboundMessageContext,
  type SlackMessage
} from 'eve/channels/slack'
import { slackConnectorId } from '../lib/slack/connect.js'
import { findFullSlackMember, isHomeSlackTeam } from '../lib/slack/members.js'

function isHookConflictFailure(event: { code?: string, message?: string }) {
  const message = event.message ?? ''
  return event.code === 'HookConflictError'
    || message.includes('HookConflict')
    || message.includes('already in use by another workflow')
}

// Slack Connect events name the author's own workspace in `user_team` or `team`. Same-workspace
// events can omit both, and then the envelope's team is the author's.
function authorTeamId(message: SlackMessage): string | undefined {
  const { user_team: userTeam, team } = message.raw
  if (typeof userTeam === 'string') return userTeam
  return typeof team === 'string' ? team : message.teamId
}

/**
 * Every Slack caller gets admin mode (`lib/identity/admin-mode.ts`), so only full members of the
 * home workspace reach Nuxi: no guests, no Slack Connect users, no deactivated accounts. Other
 * apps' bots pass only from the home workspace, and never get admin mode. A failed lookup drops
 * the message (fail closed).
 *
 * Slack-specific behaviour lives in the always-on prompt (`instructions/surface.ts`); returning
 * it as channel `context` would prepend a fresh copy to history on every mention.
 */
async function admit(ctx: SlackContext, message: SlackMessage) {
  const author = message.author
  if (!author || !isHomeSlackTeam(authorTeamId(message))) return null
  const auth = defaultSlackAuth(message, ctx)
  if (!auth) return null
  if (author.isBot) return { auth }

  const member = await findFullSlackMember(author.userId)
  if (!member) return null
  // `app_mention`/`message` events only carry a user id; `context.ts` reads the name from here.
  if (auth.attributes.full_name || !member.name) return { auth }
  return { auth: { ...auth, attributes: { ...auth.attributes, full_name: member.name } } }
}

/** Kept in sync with `evals/lib/slack.ts`, which sends the same guidance over HTTP. */
export const FOLLOWED_THREAD_GUIDANCE
  = 'You are part of this Slack thread, so you see replies people send each other. This reply '
    + 'doesn\'t mention you. Answer only if it\'s meant for you or you can clearly help; otherwise '
    + 'call `no_reply`.'

/**
 * Un-mentioned messages: code channel messages (every one is for Nuxi), and replies in a thread
 * Nuxi is already part of. Top-level channel messages still need a mention, and other bots never
 * get here, so two bots can't loop. Needs the `message.channels` event and `channels:history`
 * scope (`message.groups` and `groups:history` for private channels) on the connector.
 */
async function onMessage(ctx: SlackInboundMessageContext, message: SlackMessage) {
  if (message.author?.isBot !== false) return null
  if (ctx.slack.codeChannel) return admit(ctx, message)

  // An edit only reaches a thread that already has a session.
  const followed = ctx.edit !== undefined
    || (message.threadTs !== message.ts && await ctx.isSubscribed())
  if (!followed) return null

  const admitted = await admit(ctx, message)
  return admitted && { ...admitted, status: 'deferred' as const, guidance: FOLLOWED_THREAD_GUIDANCE }
}

const sessionFailure = defineSlackRenderer({
  events: {
    async 'session.ended'(event, ctx, next) {
      if (event.data.outcome !== 'failed') return next()
      // DM + @mention (or any double dispatch on the same thread) races on one
      // continuation token — the winning run already handles the user message.
      if (isHookConflictFailure(event.data.error ?? {})) return

      await ctx.channel.thread.post(
        'Something went wrong and I cannot continue in this thread. Start a new thread to try again.'
      )
    }
  }
})

export default slackChannel({
  credentials: connectSlackCredentials(slackConnectorId()),
  botName: 'Nuxi',
  // A code channel is one session for one task, and every message in it reaches Nuxi without a
  // mention. `tools/open_code_channel.ts` moves coding requests into one.
  codeChannels: true,
  threadContext: { since: 'last-agent-reply' },
  onAppMention: admit,
  onDirectMessage: admit,
  onMessage,
  // The same gate for approval and question clicks, so a guest in a thread a member started
  // can't approve a `coder` pull request update.
  async onAnswers(ctx, submission) {
    const member = await findFullSlackMember(submission.user.id)
    return member ? { auth: ctx.defaultAuth } : null
  },
  renderers: [sessionFailure]
})
