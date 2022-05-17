import { createSlice, Ctx } from '@milkdown/ctx'
import { defaultValueCtx, parserCtx, serializerCtx, MilkdownPlugin } from '@milkdown/core'
import type { ViewFactory } from '@milkdown/prose'
import { listenerCtx } from '@milkdown/plugin-listener'
import { kebabCase } from 'scule'
import { unref, UnwrapRef, DefineComponent } from 'vue'
import type { Options } from './types'

type VueRenderer = (Component: DefineComponent) => (ctx: Ctx) => ViewFactory

export const componentSchemasCtx = createSlice<UnwrapRef<Options['components']>>([], 'componentSchemas')
export const renderVueCtx = createSlice<VueRenderer>(() => () => () => ({}), 'renderVue')

export default (options: Options, renderVue: VueRenderer): MilkdownPlugin => {
  for (const component of unref(options.components ?? [])) {
    component.slots = component.slots ?? []
    for (const prop of component.props) {
      prop.name = kebabCase(prop.name)
    }
  }

  return (pre) => {
    pre.inject(componentSchemasCtx, unref(options.components) ?? [])
    pre.inject(renderVueCtx, renderVue)

    return (ctx) => {
      let savedKey

      ctx.set(defaultValueCtx, unref(options.content).markdown ?? '')
      ctx.get(listenerCtx).markdownUpdated((_, markdown, prevMarkdown) => {
        if (prevMarkdown === null) {
          return
        }

        const { key, markdown: base } = unref(options.content)

        // Only compare when the file changed to avoid serializing + parsing everytime
        if (savedKey !== key) {
          savedKey = key
          const parser = ctx.get(parserCtx)
          const serializer = ctx.get(serializerCtx)
          if (serializer(parser(base)) === markdown) {
            return
          }
        }

        options.onChanged?.(markdown)
      })
    }
  }
}
