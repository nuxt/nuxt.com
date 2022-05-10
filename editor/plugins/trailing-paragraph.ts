import { AtomList, createPlugin } from '@milkdown/utils'
import { Plugin, PluginKey, EditorView } from '@milkdown/prose'

const ensureTrailingParagraph = (view: EditorView) => {
  const doc = view.state.tr.doc

  if (doc.lastChild && doc.lastChild.type.name.match('(container|text)Component')) {
    view.dispatch(view.state.tr.insert(doc.content.size, view.state.schema.nodes.paragraph.create()))
  }
}

const plugin = createPlugin(() => ({
  prosePlugins: () => [
    new Plugin({
      key: new PluginKey('TRAILING_PARAGRAPH'),
      view: (view) => {
        ensureTrailingParagraph(view)

        return {
          update: ensureTrailingParagraph
        }
      }
    })
  ]
}))

export default AtomList.create([plugin()])
