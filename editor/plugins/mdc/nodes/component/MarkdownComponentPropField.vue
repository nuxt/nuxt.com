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
      type: String as () => String | null,
      default: (props: { schema: ComponentPropSchema }) => {
        return typeof props.schema.default !== 'undefined' && props.schema.default !== 'null'
          ? props.schema.default.replace(/^'|'$/g, '')
          : null
      }
    }
  },
  emits: ['change'],
  setup (props, { emit }) {
    const name = pascalCase(props.schema.name)
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
      type,
      emitChange
    }
  }
})
</script>

<template>
  <div class="flex items-center text-black dark:text-white">
    <div
      class="flex items-center h-7 px-2 border border-r-0 border-black dark:border-gray-300 rounded-l-md text-xs font-medium"
      v-text="name"
    />
    <div
      v-if="type === 'boolean'"
      class="flex items-center h-7 px-2 rounded-r-md bg-transparent border border-black dark:border-gray-300 font-medium text-xs flex items-center"
    >
      <input
        type="checkbox"
        :checked="value === 'true'"
        @change="emitChange"
      >
    </div>
    <select
      v-else-if="schema.values && schema.values.length"
      class="flex items-center h-7 px-2 rounded-r-md bg-transparent border border-black dark:border-gray-300 font-medium text-xs"
      :value="value"
      @change="emitChange"
    >
      <option v-for="option in schema.values" :key="option" class="text-black" :value="option" v-text="option" />
    </select>
    <input
      v-else
      class="flex items-center h-7 px-2 rounded-r-md bg-transparent border border-black dark:border-gray-300 font-medium text-xs"
      :type="type === 'number' ? 'number' : 'text'"
      :value="value"
      @input="emitChange"
      @keydown.stop
      @paste.stop
    >
  </div>
</template>
