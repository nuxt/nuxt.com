import { themeManagerCtx, commandsCtx } from '@milkdown/core'
import { Node } from '@milkdown/prose'
import { AtomList } from '@milkdown/utils'
import { slash, createDropdownItem, defaultActions } from '@milkdown/plugin-slash'
import { kebabCase } from 'scule'
import { componentSchemasCtx } from '../context'
import { TurnIntoComponent } from './mdc/nodes/component'
import { TurnIntoSlot } from './mdc/nodes/slot'

const ignorePattern = /^(AppLayout|Debug|Markdown|Prose.*)$/

const isComponentNode = (node: Node) => ['containerComponent', 'textComponent'].includes(node.type.name)
const isSlotNode = (node: Node) => node.type.name === 'componentSlot'

export default AtomList.create([
  slash({
    config: (ctx) => {
      return ({ parentNode, isTopLevel, content }) => {
        const schemas = ctx.get(componentSchemasCtx)!

        // Only keep schemas that only have optional props
        const simpleSchemas = schemas.filter(
          schema => !ignorePattern.test(schema.name) && schema.props.every(prop => !prop.required)
        )

        // Empty
        if (!content) {
          return {
            placeholder:
              isComponentNode(parentNode)
                ? 'Type / to use slash commands or # for slots...'
                : 'Type / to use slash commands...'
          }
        }

        // Slash commands for components and slots
        if (content.startsWith('/') && (isTopLevel || isComponentNode(parentNode) || isSlotNode(parentNode))) {
          return {
            placeholder: content === '/' ? 'Type to filter...' : null,
            actions: defaultActions(ctx, content).concat(
              simpleSchemas
                .filter(schema =>
                  [schema.name.toLocaleLowerCase(), 'component'].some(key =>
                    key.includes(content.slice(1).toLocaleLowerCase())
                  )
                )
                .map(schema => ({
                  id: 'component',
                  dom: createDropdownItem(ctx.get(themeManagerCtx), schema.name, 'select'),
                  command: () => ctx.get(commandsCtx).call(TurnIntoComponent, schema)
                }))
            )
          }
        }

        // Slot commands for components
        if (content.startsWith('#') && isComponentNode(parentNode)) {
          const filter = content.slice(1).toLocaleLowerCase()
          const schema = schemas.find(schema => kebabCase(schema.name) === kebabCase(parentNode.attrs.name))

          const usedSlots = ((parentNode.content as any).content as Node[])
            .filter(child => isSlotNode(child))
            .map(child => kebabCase(child.attrs.name))

          const filteredSlots = (schema?.slots ?? []).filter(
            ({ name }) =>
              name !== 'default' &&
              !usedSlots.includes(kebabCase(name)) &&
              name.toLocaleLowerCase().includes(filter)
          )

          if (filteredSlots.length) {
            return {
              placeholder: filter ? '' : ' Type to filter...',
              actions: filteredSlots.map(slot => ({
                id: 'component',
                dom: createDropdownItem(ctx.get(themeManagerCtx), slot.name, 'table'),
                command: () => ctx.get(commandsCtx).call(TurnIntoSlot, slot)
              }))
            }
          }
        }
      }
    }
  })
])
