import { defineSchedule } from 'eve/schedules'
import type { ScheduleHandlerArgs } from 'eve/schedules'
import {
  receiveOnSlack,
  resolveSinceDays,
  skillWorkflowMessage
} from '../lib/workflows.js'

const SKILL_ID = 'weekly-digest'
const DEFAULT_WINDOW_DAYS = 7

export async function runWeeklyDigest({
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
  cron: '0 9 * * 1',
  async run({ receive, waitUntil, appAuth }) {
    waitUntil(runWeeklyDigest({ receive, appAuth }))
  }
})
