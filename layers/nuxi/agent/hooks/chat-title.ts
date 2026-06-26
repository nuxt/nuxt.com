import { defineHook } from 'eve/hooks'
import { appOrigin, chatIdFromContinuationToken, internalHeaders } from '../lib/internal-api.js'

export default defineHook({
  events: {
    async 'message.received'(event, ctx) {
      const chatId = chatIdFromContinuationToken(ctx.channel.continuationToken)
      const auth = ctx.session.auth.current
      if (!chatId || !auth || auth.principalType !== 'user') return

      const message = event.data.message
      if (!message?.trim()) return

      try {
        const response = await fetch(`${appOrigin()}/api/internal/chats/${encodeURIComponent(chatId)}/title`, {
          method: 'POST',
          headers: internalHeaders(),
          body: JSON.stringify({
            userId: auth.principalId,
            message: {
              role: 'user',
              parts: [{ type: 'text', text: message }]
            }
          })
        })

        if (!response.ok) {
          const text = await response.text().catch(() => '')
          console.warn(`[chat-title] title generation failed (${response.status}): ${text}`)
        }
      } catch (error) {
        console.warn('[chat-title] title generation request errored', error)
      }
    }
  }
})
