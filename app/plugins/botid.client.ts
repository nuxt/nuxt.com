import { initBotId } from 'botid/client/core'

export default defineNuxtPlugin({
  enforce: 'pre',
  setup() {
    initBotId({
      protect: [
        { path: '/api/feedback', method: 'POST' },
        { path: '/api/newsletter/subscribe', method: 'POST' },
        { path: '/api/templates/preview', method: 'POST' },
        { path: '/eve/v1/session*', method: 'POST' }
      ]
    })
  }
})
