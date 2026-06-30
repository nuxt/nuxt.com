import { defineChannel, POST } from 'eve/channels'
import {
  isManualWorkflowTriggerAllowed,
  parseSinceDays,
  scheduleAppAuth,
  verifyWorkflowTriggerAuth
} from '../lib/workflows.js'
import { runWeeklyDigest } from '../schedules/weekly-digest.js'

export default defineChannel({
  routes: [
    POST('/weekly-digest/trigger', async (req, args) => {
      if (!isManualWorkflowTriggerAllowed()) {
        return Response.json({ error: 'Manual workflow trigger is disabled' }, { status: 404 })
      }
      if (!verifyWorkflowTriggerAuth(req)) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const url = new URL(req.url)
      const sinceDays = parseSinceDays(url.searchParams.get('sinceDays'))

      args.waitUntil(runWeeklyDigest({
        receive: args.receive,
        appAuth: scheduleAppAuth,
        sinceDays
      }))

      return Response.json({ ok: true, sinceDays: sinceDays ?? null })
    })
  ]
})
