import { defineEval } from 'eve/evals'
import { satisfies } from 'eve/evals/expect'
import { docsHit, searchDocsStub, wordCount } from '../lib/fixtures'

const portHit = docsHit(
  '/docs/4.x/api/commands/dev',
  'options',
  'nuxt dev › Options',
  '`--port, -p`: Port to listen on (default: `NUXT_PORT || NITRO_PORT || PORT || nuxtOptions.devServer.port`).'
)

export default defineEval({
  description: 'A simple question gets a short answer, without a closing offer.',
  async test(t) {
    const session = await t.session({ stubs: [searchDocsStub([portHit])] })
    const turn = await session.send('How do I change the port of the Nuxt dev server?')
    turn.succeeded()
    t.check(wordCount(turn.reply), satisfies((words: number) => words > 0 && words <= 80, 'at most 80 words'))
    t.check(
      turn.reply ?? '',
      satisfies((reply: string) => !/want me to|let me know if/iu.test(reply), 'no closing offer')
    )
  }
})
