import { defineSchedule } from 'eve/schedules'
import type { ScheduleHandlerArgs } from 'eve/schedules'
import { resolveSinceDays, sendToSlack, skillWorkflowMessage } from '../lib/workflow/shared.js'

export async function runShowcaseDiscovery({ to, appAuth, sinceDays }: {
  to: ScheduleHandlerArgs['to']
  appAuth: ScheduleHandlerArgs['appAuth']
  sinceDays?: number
}) {
  return sendToSlack({
    to,
    appAuth,
    message: skillWorkflowMessage('showcase-discovery', await resolveSinceDays(sinceDays))
  })
}

export default defineSchedule({
  cron: '30 6 * * 1',
  async run({ to, waitUntil, appAuth }) {
    waitUntil(runShowcaseDiscovery({ to, appAuth }))
  }
})
