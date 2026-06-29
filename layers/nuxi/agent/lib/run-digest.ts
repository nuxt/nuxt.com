import type { ScheduleHandlerArgs } from 'eve/schedules'
import slack from '../channels/slack.js'
import { buildDigestPrompt, type DigestMode, digestSlackChannelId } from './digest-config.js'

type DigestArgs = Pick<ScheduleHandlerArgs, 'receive' | 'appAuth'> & {
  mode?: DigestMode
}

export function runDigest({ receive, appAuth, mode = 'weekly' }: DigestArgs) {
  return receive(slack, {
    auth: appAuth,
    target: { channelId: digestSlackChannelId() },
    message: buildDigestPrompt({ mode })
  })
}
