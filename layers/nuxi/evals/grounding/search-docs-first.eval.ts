import { defineEval } from 'eve/evals'
import { includes } from 'eve/evals/expect'
import { searchDocsStub, useStateHit } from '../lib/fixtures'

export default defineEval({
  description: 'An API question goes through search_docs, and the answer links the section it used inline.',
  async test(t) {
    const session = await t.session({ stubs: [searchDocsStub([useStateHit])] })
    const turn = await session.send('How do I share state between components in Nuxt?')
    turn.succeeded()
    turn.calledTool('search_docs')
    t.check(turn.reply, includes('useState'))
    t.check(turn.reply, includes(`](${useStateHit.url})`))
  }
})
