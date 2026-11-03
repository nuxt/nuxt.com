import { defineSchedule } from 'eve/schedules'
import type { ScheduleHandlerArgs } from 'eve/schedules'
import { sendToSlack, skillWorkflowMessage } from '../lib/workflow/shared.js'

export async function runSeoOpportunities({ to, appAuth, sinceDays = 28 }: {
  to: ScheduleHandlerArgs['to']
  appAuth: ScheduleHandlerArgs['appAuth']
  sinceDays?: number
}) {
  return sendToSlack({
    to,
    appAuth,
    message: skillWorkflowMessage('seo-opportunities', sinceDays)
  })
}

export default defineSchedule({
  cron: '0 7 * * 1',
  async run({ to, waitUntil, appAuth }) {
    waitUntil(runSeoOpportunities({ to, appAuth }))
  }
})
