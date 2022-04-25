<script lang="ts">
import { defineComponent } from 'vue'
import type { ComponentPropSchema } from '../../../../types'
import useNode from '../utils/useNode'
import MarkdownComponentPropField from './MarkdownComponentPropField.vue'

export default defineComponent({
  components: {
    MarkdownComponentPropField
  },
  setup () {
    const { node, updateAttributes } = useNode()

    const updateProp = ({ schema: { name, default: defaultValue, type: [type] }, value }: { schema: ComponentPropSchema, value: string }) => {
      updateAttributes(({ props }) => {
        const isDefault =
          (defaultValue && (defaultValue === 'null' ? '' : defaultValue.replace(/^'|'$/g, '')) === value) ||
          (!defaultValue && type === 'boolean' && value === 'false')

        if (isDefault) {
          delete props[name]
          delete props[`:${name}`]
        } else {
          props[type === 'string' ? name : `:${name}`] = value
        }

        return { props }
      })
    }

    return {
      schemas: node.attrs.schema?.props ?? [],
      props: node.attrs.props,
      updateProp
    }
  }
})
</script>

<template>
  <div class="my-4 gap-2 flex flex-wrap items-center" data-test="props-panel">
    <MarkdownComponentPropField
      v-for="schema in schemas"
      :key="schema.name"
      :schema="schema"
      :value="props[schema.name] || props[`:${schema.name}`]"
      @change="value => updateProp({ schema, value })"
    />
  </div>
</template>
