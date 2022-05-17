import { Editor, rootCtx } from '@milkdown/core'
import { emoji } from '@milkdown/plugin-emoji'
import { history } from '@milkdown/plugin-history'
import { listener } from '@milkdown/plugin-listener'
import { prism } from '@milkdown/plugin-prism'
import { tooltip } from '@milkdown/plugin-tooltip'
import { gfm } from '@milkdown/preset-gfm'
import { switchTheme, replaceAll } from '@milkdown/utils'
import { useEditor as useMilkdownEditor } from '@milkdown/vue'

// Internal context
import context, { componentSchemasCtx } from './context'

// Internal plugins
import mdc from './plugins/mdc'
import slash from './plugins/slash'
import trailingParagraph from './plugins/trailing-paragraph'
import collaborative, { switchRoom } from './plugins/collaborative'

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

  const makeEditor = () => useMilkdownEditor((root, renderVue) => {
    instance = Editor.make()
      .config(ctx => ctx.set(rootCtx, root))
      .use(context(options, renderVue))
      .use(unref(theme))
      .use(emoji)
      .use(history)
      .use(listener)
      .use(gfm)
      .use(prism) // TODO: Use custom plugin to add Shiki support
      .use(tooltip)
      .use(mdc)
      .use(slash)
      .use(trailingParagraph)

    if (useRuntimeConfig().public.ywsUrl) {
      const { key: room } = unref(options.content)
      instance.use(collaborative(room))
    }

    return instance
  })

  const editor = ref(makeEditor())

  // Reactive content
  if (isRef(options.content)) {
    watch(options.content, async () => {
      const { key: room, markdown } = unref(options.content)

      // Switch room
      await switchRoom(room)

      // Ensure collaborative is synced with markdown fetched from API for the current file
      // TODO: We may try to setup Redis around YWS server for better synchronization (one place to sync)
      instance.action(replaceAll(markdown))
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
