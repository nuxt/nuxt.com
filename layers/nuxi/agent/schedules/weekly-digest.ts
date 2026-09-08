import { defineSchedule } from 'eve/schedules'
import type { ScheduleHandlerArgs } from 'eve/schedules'
import {
  sendToSlack,
  resolveSinceDays,
  skillWorkflowMessage
} from '../lib/workflow/shared.js'

const SKILL_ID = 'weekly-digest'

export async function runWeeklyDigest({
  to,
  appAuth,
  sinceDays
}: {
  to: ScheduleHandlerArgs['to']
  appAuth: ScheduleHandlerArgs['appAuth']
  sinceDays?: number
}) {
  // No local fallback: leaves `workflow.sinceDays` in Global Config as the
  // effective default (see `resolveSinceDays`) instead of always winning over it.
  const windowDays = await resolveSinceDays(sinceDays)

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
