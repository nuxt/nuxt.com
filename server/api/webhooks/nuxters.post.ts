import { verify } from '@octokit/webhooks-methods'
import { start } from 'workflow/api'
import { nuxtersPushSha } from '#shared/utils/nuxters'
import { syncNuxtersWorkflow } from '../../workflows/sync-nuxters'

/**
 * GitHub push webhook of nuxt/nuxters: when the CI commits the period files
 * (`public/contributors*.json`), start the `syncNuxtersWorkflow` that imports them.
 *
 * GitHub gives up after 10 seconds, so this only starts the run and answers 202.
 */
export default defineEventHandler(async (event) => {
  const secret = useRuntimeConfig(event).webhookSecret || process.env.WEBHOOK_SECRET
  if (!secret) {
    throw createError({ statusCode: 501, statusMessage: 'Nuxters webhook is not configured' })
  }

  const signature = getHeader(event, 'x-hub-signature-256')
  if (!signature) {
    throw createError({ statusCode: 401, statusMessage: 'Missing signature' })
  }
  const raw = await readRawBody(event, 'utf8')
  if (!raw) {
    throw createError({ statusCode: 400, statusMessage: 'Empty body' })
  }
  if (!(await verify(secret, raw, signature))) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid signature' })
  }

  const githubEvent = getHeader(event, 'x-github-event')
  if (githubEvent !== 'push') {
    return { ok: true, skipped: 'not-a-push-event', event: githubEvent }
  }

  const target = nuxtersPushSha(JSON.parse(raw))
  if ('skipped' in target) {
    return { ok: true, skipped: target.skipped }
  }

  const baseURL = `${getRequestProtocol(event)}://${getRequestHost(event, { xForwardedHost: true })}`
  const run = await start(syncNuxtersWorkflow, [{ baseURL, sha: target.sha }])

  console.log(`[nuxters] push ${target.sha} → workflow run ${run.runId}`)
  setResponseStatus(event, 202)
  return { ok: true, sha: target.sha, runId: run.runId }
})
