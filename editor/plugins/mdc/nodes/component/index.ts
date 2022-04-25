import { createCmdKey, createCmd, NodeSchema, Ctx } from '@milkdown/core'
import { wrapIn } from '@milkdown/prose'
import { kebabCase } from 'scule'
import type { ComponentSchema } from '../../../../types'
import { componentSchemasCtx } from '../../../../context'
import { createVueNode } from '../utils/prose'
import MarkdownComponent from './MarkdownComponent.vue'

export const TurnIntoComponent = createCmdKey<ComponentSchema>()

const attrs = {
  name: {},
  props: {},
  schema: { default: undefined },
  showProps: { default: false }
}

const parseMarkdown = (ctx: Ctx, id: string): NodeSchema['parseMarkdown'] => ({
  match: node => node.type === id,
  runner: (state, node, type) => {
    const { hName: name, hProperties: props } = node.data! as { hName: string; hProperties: Record<string, any> }
    const schema = ctx.get(componentSchemasCtx).find(schema => kebabCase(schema.name) === kebabCase(name))

    state.openNode(type, { name, props, schema } as any)
    state.next(node.children)
    state.closeNode()
  }
})

const toMarkdown = (id: string): NodeSchema['toMarkdown'] => ({
  match: node => node.type.name === id,
  runner: (state, node) => {
    const { name, props } = node.attrs
    state.openNode(id, undefined, {
      name,
      attributes: props
    })
    node.content.size && state.next(node.content)
    state.closeNode()
  }
})

export const containerComponent = createVueNode({
  id: 'containerComponent',
  schema: ctx => ({
    group: 'block',
    content: 'block*',
    attrs,
    parseMarkdown: parseMarkdown(ctx, 'containerComponent'),
    toMarkdown: toMarkdown('containerComponent')
  }),
  view: MarkdownComponent,
  commands: type => [
    createCmd(TurnIntoComponent, (schema) => {
      if (!schema) { return () => false }
      return wrapIn(type, {
        name: kebabCase(schema.name),
        props: {},
        schema
      })
    })
  ]
})

export const textComponent = createVueNode({
  id: 'textComponent',
  schema: ctx => ({
    group: 'inline',
    content: 'inline*',
    inline: true,
    attrs,
    parseMarkdown: parseMarkdown(ctx, 'textComponent'),
    toMarkdown: toMarkdown('textComponent')
  }),
  view: MarkdownComponent
})
