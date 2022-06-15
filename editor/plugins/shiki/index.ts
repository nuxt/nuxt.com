import { prosePluginsCtx, MilkdownPlugin, createTimer, editorStateTimerCtx } from '@milkdown/core'
import { getHighlighter } from 'shiki-es'
import prose from './prose'

const shikiTimer = createTimer('shiki')

export default <MilkdownPlugin> ((pre) => {
  pre.record(shikiTimer)

  return async (ctx) => {
    ctx.update(editorStateTimerCtx, x => x.concat(shikiTimer))

    const highligther = await getHighlighter({
      theme: 'one-dark-pro',
      langs: ['bash', 'js', 'ts', 'json', 'html', 'css']
    })

    ctx.update(prosePluginsCtx, ps => [...ps, prose(ctx, highligther)])
    ctx.done(shikiTimer)
  }
})
