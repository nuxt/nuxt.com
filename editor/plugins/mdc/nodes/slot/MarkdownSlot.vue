<template>
  <div
    class="bg-white dark:bg-gray-900 border border-black dark:border-gray-700 rounded-md px-4 py-2 my-4"
    data-test="markdown-slot"
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
