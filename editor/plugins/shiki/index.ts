import { prosePluginsCtx, SchemaReady } from '@milkdown/core'
import { Ctx } from '@milkdown/ctx'
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

export default () => async (ctx: Ctx) => {
  const highligther = await getHighlighter({
    theme: 'one-dark-pro',
    langs: defaultLangs
  })

  await ctx.wait(SchemaReady)

  ctx.update(prosePluginsCtx, ps => [...ps, prose(highligther)])
}
