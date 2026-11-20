import { defineEval, type EveEvalContext } from 'eve/evals'
import { satisfies } from 'eve/evals/expect'
import { searchDocsStub, useStateHit } from '../lib/fixtures'
import { ada, BOT_USER_ID, sebastien, slackMessage } from '../lib/slack'

// Ada brings Nuxi into a thread with a mention. Later replies arrive without one,
// as they do in a Slack thread Nuxi follows.
async function startThread(t: EveEvalContext) {
  const session = await t.session({ stubs: [searchDocsStub([useStateHit])] })
  const first = await session.send(slackMessage({
    from: ada,
    text: `<@${BOT_USER_ID}> what's the Nuxt way to share a counter between two components?`,
    ts: '1767268800.000100',
    mentioned: true
  }))
  first.succeeded()
  return session
}

export default [
  defineEval({
    description: 'A reply people send each other gets no_reply and no text.',
    async test(t) {
      const session = await startThread(t)
      const turn = await session.send(slackMessage({
        from: sebastien,
        text: `<@${ada.userId}> I can pair with you on the store refactor after lunch if you want.`,
        ts: '1767268900.000200',
        mentioned: false
      }))
      turn.succeeded()
      turn.calledTool('no_reply')
      t.check(turn.reply ?? '', satisfies((reply: string) => reply.trim() === '', 'posts no text'))
    }
  }),
  defineEval({
    description: 'A follow-up meant for Nuxi gets a short, plain-prose reply.',
    async test(t) {
      const session = await startThread(t)
      const turn = await session.send(slackMessage({
        from: ada,
        text: 'Nice, and does that value survive server-side rendering?',
        ts: '1767268900.000200',
        mentioned: false
      }))
      turn.succeeded()
      turn.notCalledTool('no_reply')
      t.check(turn.reply ?? '', satisfies((reply: string) => !/^#{1,6}\s|\|\s*---/mu.test(reply), 'no headings or tables'))
      t.judge(
        'The response answers whether useState survives server-side rendering directly, with no recap of '
        + 'the thread and no closing offer such as "want me to...?" or "let me know if...".',
        { on: turn.reply }
      ).gate(0.7)
    }
  })
]
