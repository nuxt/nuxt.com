import { defaultValueCtx, Editor, editorViewCtx, parserCtx, rootCtx, serializerCtx } from '@milkdown/core'
import { emoji } from '@milkdown/plugin-emoji'
import { history } from '@milkdown/plugin-history'
import { listener } from '@milkdown/plugin-listener'
import { prism } from '@milkdown/plugin-prism'
import { tooltip } from '@milkdown/plugin-tooltip'
import { gfm } from '@milkdown/preset-gfm'
import { switchTheme, replaceAll } from '@milkdown/utils'
import { useEditor as useMilkdownEditor } from '@milkdown/vue'
import { Slice } from 'prosemirror-model'

// Internal context
import context, { componentSchemasCtx } from './context'

// Internal plugins
import mdc from './plugins/mdc'
import slash from './plugins/slash'
import trailingParagraph from './plugins/trailing-paragraph'
import collaborative, { getProvider, joinRoom, leaveRoom } from './plugins/collaborative'

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
  const hasCollab = Boolean(useRuntimeConfig().public.ywsUrl)

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

    if (hasCollab) {
      const { key: room } = unref(options.content)
      instance.use(collaborative(room))
    }

    return instance
  })

  const editor = ref(makeEditor())

  // Reactive content when content key change
  if (isRef(options.content)) {
    watch(() => unref(options.content).key, () => {
      const { key: room, markdown } = unref(options.content)

      // Leave current room
      leaveRoom()

      // Update markdown
      instance?.action(replaceAll(markdown))

      // Join new room
      joinRoom(room)
    })
  }

  // Reactive components
  if (isRef(options.components)) {
    watch(options.components, (components) => {
      instance?.action(ctx => ctx.set(componentSchemasCtx, components))
    })
  }

  // Reactive theme
  watch(theme, (value) => {
    instance?.action(switchTheme(value))
  })

  return editor
}
