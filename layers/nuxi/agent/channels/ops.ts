import { defineChannel, POST } from 'eve/channels'
import {
  isManualDigestTriggerAllowed,
  scheduleAppAuth,
  verifyDigestTriggerAuth,
  type DigestMode
} from '../lib/digest-config.js'
import { runDigest } from '../lib/run-digest.js'

function parseDigestMode(req: Request): DigestMode {
  const url = new URL(req.url)
  const mode = url.searchParams.get('mode')?.trim()
  return mode === 'smoke' ? 'smoke' : 'weekly'
}

export default defineChannel({
  routes: [
    POST('/eve/v1/ops/digest/trigger', async (req, args) => {
      if (!isManualDigestTriggerAllowed()) {
        return Response.json({ error: 'Manual digest trigger is disabled' }, { status: 404 })
      }
      if (!verifyDigestTriggerAuth(req)) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const mode = parseDigestMode(req)
      args.waitUntil(runDigest({
        receive: args.receive,
        appAuth: scheduleAppAuth(),
        mode
      }))

      return Response.json({ ok: true, mode })
    })
  ]
})
