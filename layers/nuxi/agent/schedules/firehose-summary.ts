import { defineSchedule } from 'eve/schedules'
import type { ScheduleHandlerArgs } from 'eve/schedules'
import { receiveOnSlack, skillFirehoseWorkflowMessage } from '../lib/workflows.js'
import {
  firehoseSlackChannelRef,
  isSlackChannelId,
  normalizeSlackChannelName
} from '../lib/slack-api.js'

const SKILL_ID = 'firehose-summary'
const DEFAULT_WINDOW_HOURS = 24

export async function runFirehoseSummary({
  receive,
  appAuth,
  sinceHours
}: {
  receive: ScheduleHandlerArgs['receive']
  appAuth: ScheduleHandlerArgs['appAuth']
  sinceHours?: number
}) {
  const hours = sinceHours ?? DEFAULT_WINDOW_HOURS
  const firehoseRef = firehoseSlackChannelRef()
  const firehoseName = isSlackChannelId(firehoseRef)
    ? firehoseRef
    : normalizeSlackChannelName(firehoseRef)

  return receiveOnSlack({
    receive,
    appAuth,
    message: skillFirehoseWorkflowMessage(SKILL_ID, hours, firehoseName)
  })
}

export default defineSchedule({
  cron: '0 5 * * 1-5',
  async run({ receive, waitUntil, appAuth }) {
    waitUntil(runFirehoseSummary({ receive, appAuth }))
  }
})
