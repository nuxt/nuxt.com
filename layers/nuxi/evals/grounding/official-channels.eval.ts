import { defineEval } from 'eve/evals'
import { includes, satisfies } from 'eve/evals/expect'

export default defineEval({
  description: 'Nuxi links the official YouTube channel, never the unrelated @nuxt one.',
  async test(t) {
    const turn = await t.send('Is there an official Nuxt YouTube channel with talks?')
    turn.succeeded()
    t.check(turn.reply, includes('youtube.com/@NuxtLabs'))
    t.check(
      turn.reply ?? '',
      // Warning about `youtube.com/@nuxt` in code is fine; linking it is not.
      satisfies((reply: string) => !/(?:https?:\/\/(?:www\.)?youtube\.com\/@nuxt|\]\([^)]*youtube\.com\/@nuxt)(?!labs)/iu.test(reply), 'no link to youtube.com/@nuxt')
    )
  }
})
