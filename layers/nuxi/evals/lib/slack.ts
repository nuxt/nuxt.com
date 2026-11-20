// Evals run over eve's HTTP channel, so this rebuilds the block a Slack message
// gives the model. Matches FOLLOWED_THREAD_GUIDANCE in `agent/channels/slack.ts`.
const FOLLOWED_THREAD_GUIDANCE
  = 'You are part of this Slack thread, so you see replies people send each other. This reply '
    + 'doesn\'t mention you. Answer only if it\'s meant for you or you can clearly help; otherwise '
    + 'call `no_reply`.'

export const BOT_USER_ID = 'U0NUXI001'
export const ada = { userId: 'U0ADA0001', displayName: 'Ada' }
export const sebastien = { userId: 'U0SEB0001', displayName: 'Sébastien' }

export function slackMessage(input: {
  from: { userId: string, displayName: string }
  text: string
  ts: string
  mentioned: boolean
}): string {
  return [
    '<slack_message>',
    '<sender>',
    'type: user',
    `id: ${input.from.userId}`,
    `display_name: ${input.from.displayName}`,
    '</sender>',
    '<bot>',
    `id: ${BOT_USER_ID}`,
    `mentioned: ${input.mentioned}`,
    '</bot>',
    '<thread>',
    'team_id: T0NUXT001',
    'channel_id: C0NUXT001',
    'thread_ts: 1767268800.000100',
    `message_ts: ${input.ts}`,
    '</thread>',
    ...(input.mentioned ? [] : ['<guidance>', FOLLOWED_THREAD_GUIDANCE, '</guidance>']),
    '<content>',
    input.text,
    '</content>',
    '</slack_message>'
  ].join('\n')
}
