import { defineSchedule } from 'eve/schedules'
import type { ScheduleHandlerArgs } from 'eve/schedules'
import {
  receiveOnSlack,
  resolveSinceDays,
  skillWorkflowMessage
} from '../lib/workflow/shared.js'

const SKILL_ID = 'weekly-digest'

export async function runWeeklyDigest({
  receive,
  appAuth,
  sinceDays
}: {
  receive: ScheduleHandlerArgs['receive']
  appAuth: ScheduleHandlerArgs['appAuth']
  sinceDays?: number
}) {
  // No local fallback: leaves `workflow.sinceDays` in Global Config as the
  // effective default (see `resolveSinceDays`) instead of always winning over it.
  const windowDays = await resolveSinceDays(sinceDays)

  return receiveOnSlack({
    receive,
    appAuth,
    message: skillWorkflowMessage(SKILL_ID, windowDays)
  })
}

export default defineSchedule({
  cron: '0 5 * * 1',
  async run({ receive, waitUntil, appAuth }) {
    waitUntil(runWeeklyDigest({ receive, appAuth }))
  }
})
