import { noReply } from 'eve/tools/no_reply'

// Lets Nuxi stay quiet in a followed Slack thread when a reply isn't for it (`channels/slack.ts`),
// and lets a scheduled task skip posting when it has nothing to report.
export default noReply
