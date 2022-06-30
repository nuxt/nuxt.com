import { createSlice } from '@milkdown/ctx'
import { defaultValueCtx, parserCtx, serializerCtx, MilkdownPlugin } from '@milkdown/core'
import type { RenderVue } from '@milkdown/vue'
import { listenerCtx } from '@milkdown/plugin-listener'
import { kebabCase } from 'scule'
import { unref, UnwrapRef } from 'vue'
import type { Options } from './types'

export const componentSchemasCtx = createSlice<UnwrapRef<Options['components']>>([], 'componentSchemas')
export const renderVueCtx = createSlice<RenderVue>(() => () => ({} as never), 'renderVue')

export default (options: Options, renderVue: RenderVue): MilkdownPlugin => {
  const components = unref(options.components) ?? []

  for (const component of components) {
    component.slots = component.slots ?? []
    for (const prop of component.props) {
      prop.name = kebabCase(prop.name)
    }
  }

  return (pre) => {
    pre.inject(componentSchemasCtx, components)
    pre.inject(renderVueCtx, renderVue)

    return (ctx) => {
      let savedKey: string

      const content = unref(options.content) ?? { key: '', markdown: '', matter: {} }

      ctx.set(defaultValueCtx, unref(options.content)?.markdown ?? '')
      ctx.get(listenerCtx).markdownUpdated((_, markdown, prevMarkdown) => {
        if (prevMarkdown === null) {
          return
        }

        const { key, markdown: base } = unref(options.content) ?? { key: '', markdown: '', matter: {} }

        // Only compare when the file changed to avoid serializing + parsing everytime
        if (savedKey !== key) {
          savedKey = key
          const parser = ctx.get(parserCtx)
          const serializer = ctx.get(serializerCtx)
          if (serializer(parser(base)!) === content.markdown) {
            return
          }
        }

        options.onChanged?.(markdown)
      })
    }
  }
}
