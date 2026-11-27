import { verify } from '@octokit/webhooks-methods'
import { start } from 'workflow/api'
import { nuxtersPushSha } from '#shared/utils/nuxters'
import { syncNuxtersWorkflow } from '../../workflows/sync-nuxters'
import { createError, defineHandler, getRequestHeader, getRequestHost, getRequestProtocol, setResponseStatus, useRuntimeConfig } from 'nuxt/server'

/**
 * GitHub push webhook of nuxt/nuxters: when the CI commits the period files
 * (`public/contributors*.json`), start the `syncNuxtersWorkflow` that imports them.
 *
 * GitHub gives up after 10 seconds, so this only starts the run and answers 202.
 */
export default defineHandler(async (event) => {
  // Its own secret, not the content `WEBHOOK_SECRET`: it is set in the nuxt/nuxters webhook settings,
  // and it can be rotated without touching the webhooks of the content repositories.
  const secret = useRuntimeConfig().nuxters.webhookSecret
  if (!secret) {
    throw createError({ status: 501, statusText: 'Nuxters webhook is not configured' })
  }

  const signature = getRequestHeader(event, 'x-hub-signature-256')
  if (!signature) {
    throw createError({ status: 401, statusText: 'Missing signature' })
  }
  const raw = await event.req.text()
  if (!raw) {
    throw createError({ status: 400, statusText: 'Empty body' })
  }
  if (!(await verify(secret, raw, signature))) {
    throw createError({ status: 401, statusText: 'Invalid signature' })
  }

  const githubEvent = getRequestHeader(event, 'x-github-event')
  if (githubEvent !== 'push') {
    return { ok: true, skipped: 'not-a-push-event', event: githubEvent }
  }

  const target = nuxtersPushSha(JSON.parse(raw))
  if ('skipped' in target) {
    return { ok: true, skipped: target.skipped }
  }

  const baseURL = `${getRequestProtocol(event, { xForwardedProto: true })}://${getRequestHost(event, { xForwardedHost: true })}`
  const run = await start(syncNuxtersWorkflow, [{ baseURL, sha: target.sha }])

  console.log(`[nuxters] push ${target.sha} → workflow run ${run.runId}`)
  setResponseStatus(event, 202)
  return { ok: true, sha: target.sha, runId: run.runId }
})
