import { defineSchedule } from 'eve/schedules'
import type { ScheduleHandlerArgs } from 'eve/schedules'
import {
  receiveOnSlack,
  resolveSinceDays,
  skillWorkflowMessage
} from '../lib/workflows.js'

const SKILL_ID = 'analytics-digest'
const DEFAULT_WINDOW_DAYS = 7

export async function runAnalyticsDigest({
  receive,
  appAuth,
  sinceDays
}: {
  receive: ScheduleHandlerArgs['receive']
  appAuth: ScheduleHandlerArgs['appAuth']
  sinceDays?: number
}) {
  const windowDays = resolveSinceDays(sinceDays, DEFAULT_WINDOW_DAYS)

  return receiveOnSlack({
    receive,
    appAuth,
    message: skillWorkflowMessage(SKILL_ID, windowDays)
  })
}

export default defineSchedule({
  // 15 min after weekly-digest so both land close together for the Monday morning read.
  cron: '15 5 * * 1',
  async run({ receive, waitUntil, appAuth }) {
    waitUntil(runAnalyticsDigest({ receive, appAuth }))
  }
})
