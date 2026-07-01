import { defineChannel, POST } from 'eve/channels'
import {
  isManualWorkflowTriggerAllowed,
  parseSinceDays,
  parseSinceHours,
  scheduleAppAuth,
  verifyWorkflowTriggerAuth
} from '../lib/workflows.js'
import { runFirehoseSummary } from '../schedules/firehose-summary.js'
import { runWeeklyDigest } from '../schedules/weekly-digest.js'

export default defineChannel({
  routes: [
    POST('/eve/v1/ops/weekly-digest/trigger', async (req, args) => {
      if (!isManualWorkflowTriggerAllowed()) {
        return Response.json({ error: 'Manual workflow trigger is disabled' }, { status: 404 })
      }
      if (!verifyWorkflowTriggerAuth(req)) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const url = new URL(req.url)
      const parsedSinceDays = parseSinceDays(url.searchParams.get('sinceDays'))
      if (!parsedSinceDays.ok) {
        return Response.json({ error: parsedSinceDays.error }, { status: 400 })
      }

      args.waitUntil(runWeeklyDigest({
        receive: args.receive,
        appAuth: scheduleAppAuth,
        sinceDays: parsedSinceDays.value
      }))

      return Response.json({ ok: true, sinceDays: parsedSinceDays.value ?? null })
    }),
    POST('/eve/v1/ops/firehose-summary/trigger', async (req, args) => {
      if (!isManualWorkflowTriggerAllowed()) {
        return Response.json({ error: 'Manual workflow trigger is disabled' }, { status: 404 })
      }
      if (!verifyWorkflowTriggerAuth(req)) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const url = new URL(req.url)
      const parsedSinceHours = parseSinceHours(url.searchParams.get('sinceHours'))
      if (!parsedSinceHours.ok) {
        return Response.json({ error: parsedSinceHours.error }, { status: 400 })
      }

      args.waitUntil(runFirehoseSummary({
        receive: args.receive,
        appAuth: scheduleAppAuth,
        sinceHours: parsedSinceHours.value
      }))

      return Response.json({ ok: true, sinceHours: parsedSinceHours.value ?? null })
    })
  ]
})
