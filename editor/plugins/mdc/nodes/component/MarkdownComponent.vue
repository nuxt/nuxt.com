<template>
  <div
    class="px-4 py-3 my-4 border rounded-md u-bg-white u-border-gray-200"
    data-test="markdown-component"
    @mouseenter="showActions = true"
    @mouseleave="showActions = false"
  >
    <div class="flex items-center justify-between h-6">
      <span class="text-xs font-semibold u-text-gray-900" contenteditable="false">
        {{ name }}
      </span>
      <div class="flex flex-row items-center justify-center transition-opacity duration-200" :class="{ 'opacity-0': !showActions }" data-test="actions">
        <button
          v-for="{ icon, onClick } in actions"
          :key="icon"
          class="p-1 u-text-gray-500 hover:u-text-gray-700 focus:u-text-gray-700"
          :data-test="icon"
          @click="onClick"
        >
          <Icon :name="icon" />
        </button>
      </div>
    </div>
    <MarkdownComponentProps v-if="hasProps" v-show="showProps" />
    <!-- TODO: Uncomment once nuxt-component-beta handles default slots -->
    <!-- <div :class="{ hidden: !hasSlots }"> -->
    <div>
      <slot />
    </div>
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
    const hasSlots = schema && schema.slots.length > 0

    const showActions = ref(false)
    const showProps = ref(true)

    const actions: Action[] = [
      { icon: 'trash', onClick: remove },
      { icon: 'duplicate', onClick: duplicate }
    ]

    return {
      testKey: `component-${node.attrs.name}`,
      name: pascalCase(node.attrs.name),
      actions,
      hasProps,
      hasSlots,
      showActions,
      showProps
    }
  }
})
</script>
