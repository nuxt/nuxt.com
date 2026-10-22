import { defineSchedule } from 'eve/schedules'
import type { ScheduleHandlerArgs } from 'eve/schedules'
import { sendToSlack, skillWorkflowMessage } from '../lib/workflow/shared.js'

const SKILL_ID = 'showcase-check'

export async function runShowcaseCheck({
  to,
  appAuth
}: {
  to: ScheduleHandlerArgs['to']
  appAuth: ScheduleHandlerArgs['appAuth']
}) {
  return sendToSlack({
    to,
    appAuth,
    message: skillWorkflowMessage(SKILL_ID)
  })
}

export default defineSchedule({
  cron: '0 6 * * 1',
  async run({ to, waitUntil, appAuth }) {
    waitUntil(runShowcaseCheck({ to, appAuth }))
  }
})
