<script lang="ts">
import { defineComponent } from 'vue'
import { pascalCase } from 'scule'
import type { ComponentPropSchema } from '../../../../types'

export default defineComponent({
  props: {
    schema: {
      type: Object as () => ComponentPropSchema,
      required: true
    },
    value: {
      type: String as () => string | null,
      default: (props: { schema: ComponentPropSchema }) => {
        return typeof props.schema.default !== 'undefined' && props.schema.default !== 'null'
          ? props.schema.default.replace(/^'|'$/g, '')
          : null
      }
    }
  },
  emits: ['change'],
  setup (props, { emit }) {
    const name = props.schema.name
    const label = pascalCase(name)
    const type = props.schema.type[0]

    const emitChange = ({ target }: Event) => {
      emit('change',
        type === 'boolean'
          ? (target as HTMLInputElement).checked ? 'true' : 'false'
          : (target as HTMLInputElement).value
      )
    }

    return {
      name,
      label,
      type,
      emitChange
    }
  }
})
</script>

<template>
  <UFormGroup :name="name" :label="label" label-class="text-xs font-medium u-text-gray-900">
    <UCheckbox
      v-if="type === 'boolean'"
      :name="name"
      :model-value="value === 'true'"
      size="xs"
      @update:model-value="emitChange"
    />
    <USelect
      v-else-if="schema.values && Array.isArray(schema.values) && schema.values.length"
      :name="name"
      :model-value="value"
      :options="schema.values"
      size="xs"
      @update:model-value="emitChange"
    />
    <UInput
      v-else
      :name="name"
      :type="type === 'number' ? 'number' : 'text'"
      :model-value="value"
      size="xs"
      @update:model-value="emitChange"
      @keydown.stop
      @paste.stop
    />
  </UFormGroup>
</template>
