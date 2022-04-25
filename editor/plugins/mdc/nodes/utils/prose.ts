import { createNode } from '@milkdown/utils'
import { DefineComponent } from 'vue'
import { renderVueCtx } from '../../../../context'

export interface VueNodeSchema extends Omit<ReturnType<Parameters<typeof createNode>[0]>, 'view'> {
  view: DefineComponent<{}, {}, any>
}

export function createVueNode ({ id, schema, commands, view }: VueNodeSchema): ReturnType<typeof createNode> {
  return createNode(() => ({
    id,
    schema,
    commands,
    view: (ctx) => {
      const renderVue = ctx.get(renderVueCtx)
      const viewFactory = renderVue(view as Parameters<typeof renderVue>[0])(ctx)
      return (node, view, getPos, decorations) => {
        const nodeView = viewFactory(node, view, getPos, decorations)
        nodeView.update = (updatedNode) => {
          const skipUpdate = node.attrs.skipUpdate
          delete node.attrs.skipUpdate
          return skipUpdate || node.sameMarkup(updatedNode)
        }
        nodeView.ignoreMutation = (mutation) => {
          return mutation.type !== 'selection' && (!nodeView.contentDOM || !nodeView.contentDOM.contains(mutation.target))
        }
        return nodeView
      }
    }
  }))
}
