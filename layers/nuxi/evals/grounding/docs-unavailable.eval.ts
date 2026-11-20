import { defineEval } from 'eve/evals'
import { readPageDown, searchDocsDown } from '../lib/fixtures'

export default defineEval({
  // `web_search` runs at the model provider and can't be stubbed, so Nuxi may still find the page there.
  description: 'When the docs tools fail, Nuxi says they were unavailable, never that nothing was found.',
  async test(t) {
    const session = await t.session({ stubs: [searchDocsDown, readPageDown] })
    const turn = await session.send('What does the `routeRules` option in nuxt.config do?')
    turn.succeeded()
    t.judge(
      'The response does not claim that the documentation has no answer or that nothing was found '
      + 'about the question. Explaining what the option does, or saying the docs could not be '
      + 'reached, both pass.',
      { on: turn.reply }
    ).gate(0.7)
  }
})
