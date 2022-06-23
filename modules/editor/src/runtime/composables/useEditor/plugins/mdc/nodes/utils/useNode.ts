import type { Node } from 'prosemirror-model'
import type { Transaction } from 'prosemirror-state'
import type { EditorView } from 'prosemirror-view'
import { nodeMetadata } from '@milkdown/vue'
import { inject } from 'vue'

type Metadata = { node: Node, view: EditorView, getPos: () => number }

type SmartDispatcher = (
  transactionBuilder: (params: Metadata) => Transaction,
  opts?: { skipUpdate?: boolean }
) => void

export default function useNode () {
  const { node, view, getPos } = inject(nodeMetadata) as Metadata

  // Smart dispatch with updated node
  const smartDispatch: SmartDispatcher = (transactionBuilder, { skipUpdate } = { skipUpdate: false }) => {
    // @ts-ignore
    node.attrs.skipUpdate = skipUpdate
    view.dispatch(
      transactionBuilder({
        node: view.state.doc.nodeAt(getPos())!,
        view,
        getPos
      })
    )
  }

  // Duplicate Markdown Component
  const duplicate = () => smartDispatch(({ node, view, getPos }) =>
    view.state.tr.insert(getPos() + node.nodeSize, node.copy(node.content))
  )

  // Remove Markdown Slot
  const remove = () => smartDispatch(({ node, view, getPos }) =>
    view.state.tr.replaceRangeWith(getPos(), getPos() + node.nodeSize, view.state.schema.nodes.paragraph.create())
  )

  // Update node attributes (without trigerring re-render)
  const updateAttributes =
    (updater: (attrs: Record<string, any>) => Record<string, any>) => smartDispatch(({ node, view, getPos }) => {
      return view.state.tr.setNodeMarkup(getPos(), undefined, {
        ...node.attrs,
        ...updater({ props: { ...node.attrs.props } })
      })
    }, { skipUpdate: true })

  return {
    node,
    duplicate,
    remove,
    updateAttributes
  }
}
