import { defineChannel, POST } from 'eve/channels'
import {
  isManualWorkflowTriggerAllowed,
  parseSinceDays,
  parseSinceHours,
  scheduleAppAuth,
  verifyWorkflowTriggerAuth
} from '../lib/workflow/shared.js'
import { runDiscordGateway } from '../schedules/discord-gateway.js'
import { runFirehoseSummary } from '../schedules/firehose-summary.js'
import { runShowcaseCheck } from '../schedules/showcase-check.js'
import { runShowcaseDiscovery } from '../schedules/showcase-discovery.js'
import { runSeoOpportunities } from '../schedules/seo-opportunities.js'
import { runWeeklyDigest } from '../schedules/weekly-digest.js'

export default defineChannel({
  routes: [
    POST('/eve/v1/ops/discord-gateway/trigger', async (req, args) => {
      if (!(await isManualWorkflowTriggerAllowed())) {
        return Response.json({ error: 'Manual workflow trigger is disabled' }, { status: 404 })
      }
      if (!verifyWorkflowTriggerAuth(req)) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const result = await runDiscordGateway({ waitUntil: args.waitUntil })
      return Response.json(result, { status: result.started ? 200 : 409 })
    }),
    POST('/eve/v1/ops/weekly-digest/trigger', async (req, args) => {
      if (!(await isManualWorkflowTriggerAllowed())) {
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
        to: args.to,
        appAuth: scheduleAppAuth,
        sinceDays: parsedSinceDays.value
      }))

      return Response.json({ ok: true, sinceDays: parsedSinceDays.value ?? null })
    }),
    POST('/eve/v1/ops/firehose-summary/trigger', async (req, args) => {
      if (!(await isManualWorkflowTriggerAllowed())) {
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
        to: args.to,
        appAuth: scheduleAppAuth,
        sinceHours: parsedSinceHours.value
      }))

      return Response.json({ ok: true, sinceHours: parsedSinceHours.value ?? null })
    }),
    ...[
      { name: 'showcase-discovery', run: runShowcaseDiscovery },
      { name: 'seo-opportunities', run: runSeoOpportunities }
    ].map(({ name, run }) => POST(`/eve/v1/ops/${name}/trigger`, async (req, args) => {
      if (!(await isManualWorkflowTriggerAllowed())) {
        return Response.json({ error: 'Manual workflow trigger is disabled' }, { status: 404 })
      }
      if (!verifyWorkflowTriggerAuth(req)) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const parsed = parseSinceDays(new URL(req.url).searchParams.get('sinceDays'))
      if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 })
      if (name === 'seo-opportunities' && parsed.value !== undefined && parsed.value > 90) {
        return Response.json({ error: 'sinceDays must be at most 90 for SEO comparisons' }, { status: 400 })
      }
      args.waitUntil(run({ to: args.to, appAuth: scheduleAppAuth, sinceDays: parsed.value }))
      return Response.json({ ok: true, sinceDays: parsed.value ?? null })
    })),
    POST('/eve/v1/ops/showcase-check/trigger', async (req, args) => {
      if (!(await isManualWorkflowTriggerAllowed())) {
        return Response.json({ error: 'Manual workflow trigger is disabled' }, { status: 404 })
      }
      if (!verifyWorkflowTriggerAuth(req)) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }

      args.waitUntil(runShowcaseCheck({ to: args.to, appAuth: scheduleAppAuth }))

      return Response.json({ ok: true })
    })
  ]
})
