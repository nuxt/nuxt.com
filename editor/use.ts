import { Editor, rootCtx } from '@milkdown/core'
import { emoji } from '@milkdown/plugin-emoji'
import { history } from '@milkdown/plugin-history'
import { listener, listenerCtx } from '@milkdown/plugin-listener'
import { tooltip } from '@milkdown/plugin-tooltip'
import { gfm } from '@milkdown/preset-gfm'
import { replaceAll, switchTheme } from '@milkdown/utils'
import { useEditor as useMilkdownEditor } from '@milkdown/vue'

// Internal context
import context, { componentSchemasCtx } from './context'

// Internal plugins
import mdc from './plugins/mdc'
import slash from './plugins/slash'
import trailingParagraph from './plugins/trailing-paragraph'
import collaborative, { joinRoom } from './plugins/collaborative'
import shiki from './plugins/shiki'

// Theme
import { dark, light } from './theme'

// Types
import type { Options } from './types'

const useTheme = () => {
  const colorMode = useColorMode()
  const theme = computed(() => colorMode.value === 'dark' ? dark : light)
  return theme
}

export const useEditor = (options: Options) => {
  let instance: Editor

  const theme = useTheme()
  const isCollabEnabled = Boolean(useRuntimeConfig().public.ywsUrl)

  const makeEditor = () => useMilkdownEditor((root, renderVue) => {
    instance = Editor.make()
      .config(ctx => ctx.set(rootCtx, root))
      .use(context(options, renderVue))
      .use(unref(theme))
      .use(emoji)
      .use(history)
      .use(listener)
      .use(gfm)
      .use(shiki)
      .use(tooltip)
      .use(mdc)
      .use(slash)
      .use(trailingParagraph)

    if (isCollabEnabled) {
      instance.use(collaborative)
      instance.ctx.get(listenerCtx).mounted(() => {
        instance.action(joinRoom(options))
      })
    }

    return instance
  })

  const editor = ref(makeEditor())

  // Reactive content
  if (isRef(options.content)) {
    watch(options.content, () => {
      instance.action(
        isCollabEnabled
          ? joinRoom(options)
          : replaceAll(unref(options.content).markdown)
      )
    })
  }

  // Reactive components
  if (isRef(options.components)) {
    watch(options.components, (components) => {
      instance.action(ctx => ctx.set(componentSchemasCtx, components))
    })
  }

  // Reactive theme
  watch(theme, (value) => {
    instance.action(switchTheme(value))
  })

  return editor
}
