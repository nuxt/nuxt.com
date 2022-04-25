<template>
  <div
    class="bg-white dark:bg-black  border border-black dark:border-gray-700 rounded-md px-4 py-2 my-4"
    data-test="markdown-component"
    @mouseenter="showActions = true"
    @mouseleave="showActions = false"
  >
    <div class="flex justify-between items-center h-6">
      <span class="text-xs font-bold text-black dark:text-gray-400">
        {{ name }}
      </span>
      <div class="flex flex-row justify-center items-center transition-opacity duration-200" :class="{ 'opacity-0': !showActions }" data-test="actions">
        <button
          v-for="{ icon, onClick } in actions"
          :key="icon"
          class="text-black dark:text-gray-400 hover:text-gray-500 dark:hover:text-white p-1"
          :data-test="icon"
          @click="onClick"
        >
          <Icon :name="icon" />
        </button>
      </div>
    </div>
    <MarkdownComponentProps v-if="hasProps" v-show="showProps" />
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, unref } from 'vue'
import { pascalCase } from 'scule'
import type { ComponentSchema } from '../../../../types'
import Icon from '../utils/Icon.vue'
import type { PathKey } from '../utils/icons'
import useNode from '../utils/useNode'
import MarkdownComponentProps from './MarkdownComponentProps.vue'

type Action = { icon: PathKey, onClick: () => void }

export default defineComponent({
  components: {
    Icon,
    MarkdownComponentProps
  },
  setup () {
    const { node, duplicate, remove, updateAttributes } = useNode()
    const schema = node.attrs.schema as ComponentSchema

    const hasProps = schema && schema.props.length > 0

    const showActions = ref(false)
    const showProps = ref(!!node.attrs.showProps)

    const actions: Action[] = [
      { icon: 'trash', onClick: remove },
      { icon: 'duplicate', onClick: duplicate }
    ]

    if (hasProps) {
      actions.push({
        icon: 'adjustments',
        onClick: () => {
          showProps.value = !showProps.value
          // Preserve state of props panel
          updateAttributes(() => ({ showProps: unref(showProps) }))
        }
      })
    }

    return {
      testKey: `component-${node.attrs.name}`,
      name: pascalCase(node.attrs.name),
      actions,
      hasProps,
      showActions,
      showProps
    }
  }
})
</script>
