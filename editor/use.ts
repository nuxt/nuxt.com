import { Editor, editorViewCtx, parserCtx, rootCtx, serializerCtx } from '@milkdown/core'
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
import collaborative, { setRoom } from './plugins/collaborative'

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
      .use(collaborative(unref(options.room) ?? 'default'))
      .use(mdc)
      .use(slash)
      .use(trailingParagraph)

    return instance
  })

  const editor = ref(makeEditor())

  // Reactive content
  if (isRef(options.content)) {
    watch(options.content, (content) => {
      instance?.action((ctx) => {
        const view = ctx.get(editorViewCtx)
        const parser = ctx.get(parserCtx)
        const serializer = ctx.get(serializerCtx)
        const state = view.state
        if (content === serializer(state.doc)) {
          return
        }
        const doc = parser(content)
        if (!doc) { return }
        view.dispatch(state.tr.replace(0, state.doc.content.size, new Slice(doc.content, 0, 0)))
      })
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

  // Reactive room (collaborative support)
  if (isRef(options.room)) {
    watch(options.room, (room) => {
      instance?.action(setRoom(room))
      instance?.action(replaceAll(unref(options.content)))
    })
  }

  return editor
}
