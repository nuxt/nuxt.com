import { prosePluginsCtx, MilkdownPlugin, createTimer, editorStateTimerCtx } from '@milkdown/core'
import { getHighlighter, Lang } from 'shiki-es'
import prose from './prose'

const defaultLangs: Lang[] = [
  'javascript',
  'typescript',
  'bash',
  'sql',
  'json',
  'html',
  'css',
  'c',
  'cpp',
  'java',
  'ruby',
  'python',
  'go',
  'rust',
  'markdown'
]

const shikiTimer = createTimer('shiki')

export default <MilkdownPlugin> ((pre) => {
  pre.record(shikiTimer)

  return async (ctx) => {
    ctx.update(editorStateTimerCtx, x => x.concat(shikiTimer))

    const highligther = await getHighlighter({
      theme: 'one-dark-pro',
      langs: defaultLangs
    })

    ctx.update(prosePluginsCtx, ps => [...ps, prose(highligther)])
    ctx.done(shikiTimer)
  }
})
