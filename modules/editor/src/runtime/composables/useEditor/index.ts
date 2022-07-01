import { Editor, rootCtx } from '@milkdown/core'
import { emoji } from '@milkdown/plugin-emoji'
import { history } from '@milkdown/plugin-history'
import { listener, listenerCtx } from '@milkdown/plugin-listener'
import { tooltip } from '@milkdown/plugin-tooltip'
import { gfm } from '@milkdown/preset-gfm'
import { codeFence as cmCodeFence } from '@milkdown/preset-commonmark'
import { replaceAll, switchTheme } from '@milkdown/utils'
import { useEditor as useMilkdownEditor } from '@milkdown/vue'
import { computed, isRef, ref, unref, watch } from 'vue'
import { useRuntimeConfig } from '#imports'

// Types
import type { Options } from './types'

// Internal context
import context, { setComponents } from './context'

// Internal plugins
import codeFence from './plugins/code-fence'
import mdc from './plugins/mdc'
import slash from './plugins/slash'
import trailingParagraph from './plugins/trailing-paragraph'
import collaborative, { joinRoom } from './plugins/collaborative'
import shiki from './plugins/shiki'

// Theme
import { dark, light } from './theme'

const useTheme = () => {
  const colorMode = typeof useColorMode === 'function' ? useColorMode() : ref('dark')
  const theme = computed(() => colorMode.value === 'dark' ? dark : light)
  return theme
}

export const useEditor = (options: Options) => {
  const theme = useTheme()
  const isCollabEnabled = Boolean(useRuntimeConfig().public.ywsUrl)

  const { editor, getInstance } = useMilkdownEditor((root, renderVue) => {
    const instance = Editor.make()
      .config(ctx => ctx.set(rootCtx, root))
      .use(context(options, renderVue))
      .use(unref(theme))
      .use(emoji)
      .use(history)
      .use(listener)
      .use(gfm.replace(cmCodeFence, codeFence()))
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

  // Reactive content
  if (isRef(options.content)) {
    watch(options.content, () => {
      getInstance()?.action(
        isCollabEnabled
          ? joinRoom(options)
          : replaceAll(unref(options.content)?.markdown ?? '')
      )
    })
  }

  // Reactive components
  if (isRef(options.components)) {
    watch(options.components, (components) => {
      getInstance()?.action(setComponents(components))
    })
  }

  // Reactive theme
  watch(theme, (value) => {
    getInstance()?.action(switchTheme(value))
  })

  return editor
}
