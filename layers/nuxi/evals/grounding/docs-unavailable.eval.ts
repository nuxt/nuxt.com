import { defineEval } from 'eve/evals'
import { satisfies } from 'eve/evals/expect'
import { readPageDown, searchDocsDown } from '../lib/fixtures'

export default defineEval({
  // `web_search` runs at the model provider and can't be stubbed, so Nuxi may still find the page there.
  description: 'When the docs tools fail, Nuxi says they were unavailable, never that nothing was found.',
  async test(t) {
    const session = await t.session({ stubs: [searchDocsDown, readPageDown] })
    const turn = await session.send('What does the `routeRules` option in nuxt.config do?')
    turn.succeeded()
    t.check(
      turn.reply ?? '',
      satisfies((reply: string) => !/\b(?:nothing|no results?|didn'?t find anything)\b/iu.test(reply), 'doesn\'t call a failure "nothing found"')
    )
    t.judge(
      'The response either answers from another source or says plainly that the documentation '
      + 'could not be reached, and never presents the outage as the docs having no answer.',
      { on: turn.reply }
    ).gate(0.7)
  }
})
