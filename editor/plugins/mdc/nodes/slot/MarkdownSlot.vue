<template>
  <div
    class="u-bg-white border u-border-gray-200 rounded-md px-4 py-2 my-2"
    data-test="markdown-slot"
    @mouseenter="showActions = true"
    @mouseleave="showActions = false"
  >
    <div class="flex justify-between items-center h-6">
      <span class="text-xs font-semibold u-text-gray-900">
        {{ name }}
      </span>
      <div class="flex flex-row justify-center items-center transition-opacity duration-200" :class="{ 'opacity-0': !showActions }" data-test="actions">
        <button
          v-for="{ icon, onClick } in actions"
          :key="icon"
          class="u-text-gray-500 hover:u-text-gray-700 focus:u-text-gray-700 p-1 -mr-2"
          :data-test="icon"
          @click="onClick"
        >
          <Icon :name="icon" />
        </button>
      </div>
    </div>
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { pascalCase } from 'scule'
import Icon from '../utils/Icon.vue'
import type { PathKey } from '../utils/icons'
import useNode from '../utils/useNode'

type Action = { icon: PathKey, onClick: () => void }

export default defineComponent({
  components: {
    Icon
  },
  setup () {
    const { node, remove } = useNode()

    const actions: Action[] = [
      { icon: 'trash', onClick: remove }
    ]

    return {
      name: pascalCase(node.attrs.name),
      actions,
      showActions: ref(false)
    }
  }
})
</script>
