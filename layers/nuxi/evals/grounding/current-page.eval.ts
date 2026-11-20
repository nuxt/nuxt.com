import { defineEval } from 'eve/evals'

const PAGE = '/docs/4.x/getting-started/data-fetching'

export default defineEval({
  description: 'A vague question with a current page reads that page directly instead of searching.',
  async test(t) {
    const session = await t.session({
      stubs: [{
        id: 'read-page',
        tool: 'read_page',
        outcome: { response: { path: PAGE, title: 'Data Fetching', content: '# Data Fetching\n\nNuxt comes with `useFetch`, `useAsyncData` and `$fetch` to fetch data. `useFetch` is the most straightforward way to fetch data in a component setup function, and avoids fetching twice on hydration.' } }
      }]
    })
    const turn = await session.send('tldr?', { clientContext: `Current page: ${PAGE}` })
    turn.succeeded()
    turn.calledTool('read_page', { input: { path: PAGE } })
    turn.notCalledTool('search_docs')
  }
})
