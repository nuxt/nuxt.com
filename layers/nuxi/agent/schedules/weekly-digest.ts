import { defineSchedule } from 'eve/schedules'
import type { ScheduleHandlerArgs } from 'eve/schedules'
import {
  sendToSlack,
  resolveSinceDays,
  skillWorkflowMessage
} from '../lib/workflows.js'

const SKILL_ID = 'weekly-digest'
const DEFAULT_WINDOW_DAYS = 7

export async function runWeeklyDigest({
  to,
  appAuth,
  sinceDays
}: {
  to: ScheduleHandlerArgs['to']
  appAuth: ScheduleHandlerArgs['appAuth']
  sinceDays?: number
}) {
  const windowDays = resolveSinceDays(sinceDays, DEFAULT_WINDOW_DAYS)

  return sendToSlack({
    to,
    appAuth,
    message: skillWorkflowMessage(SKILL_ID, windowDays)
  })
}

export default defineSchedule({
  cron: '0 5 * * 1',
  async run({ to, waitUntil, appAuth }) {
    waitUntil(runWeeklyDigest({ to, appAuth }))
  }
})
