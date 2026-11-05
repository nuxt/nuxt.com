import { defineHook } from 'eve/hooks'
import { resolveContext } from '../lib/identity/context.js'

export default defineHook({
  events: {
    'turn.paused'(_event, ctx) {
      // The protocol has no approval/answer endpoint. Never approve implicitly
      // or leave an inaccessible prompt holding the conversation open.
      if (resolveContext(ctx.session.auth.current).surface === 'raycast') ctx.cancel()
    }
  }
})
