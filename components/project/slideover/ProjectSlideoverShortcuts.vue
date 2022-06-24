<template>
  <USlideover v-model="isOpen" side="right" panel-class="max-w-[384px]">
    <template #header>
      <div class="flex items-center gap-2">
        <UButton icon="heroicons-outline:x" variant="transparent" class="-ml-2 sm:-ml-4" @click="isOpen = false" />
        <span class="text-lg font-semibold u-text-gray-900">Shortcuts</span>
      </div>
    </template>

    <div class="flex flex-col gap-6 px-4 py-4 overflow-y-auto">
      <UInput
        v-model="q"
        name="q"
        placeholder="Search shortcuts..."
      />

      <div
        v-for="(shortcutItem, index) in filteredShortcuts"
        :key="index"
        class="mb-6"
      >
        <p class="mb-3 font-semibold">
          {{ shortcutItem.category }}
        </p>
        <div
          v-for="(item, i) in shortcutItem.items"
          :key="i"
          class="flex justify-between mb-1.5"
        >
          <span class="flex items-center text-sm font-medium u-text-gray-500">{{ item.text }}</span>

          <div class="flex items-center justify-end flex-shrink-0 w-24 h-6">
            <div
              v-for="(shortcut, j) in item.shortcuts"
              :key="j"
              class="flex items-center h-5 mr-1 bg-gray-100 rounded dark:bg-gray-700"
            >
              <span class="w-full px-1.5 text-center u-text-gray-600 text-xs">
                {{ shortcut }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p v-if="!filteredShortcuts.length" class="text-sm u-text-gray-400">
        No results.
      </p>
    </div>
  </USlideover>
</template>

<script setup lang="ts">
import type { WritableComputedRef } from 'vue'
import { useMagicKeys, whenever, and } from '@vueuse/core'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const { magicKeysOptions, notUsingInput } = useShortcuts()
const keys = useMagicKeys(magicKeysOptions({
  prevents: [{ key: '?', notUsingInput: true }]
}))

const q = ref('')
const shortcutsList = [{
  category: 'General',
  items: [
    { shortcuts: ['?'], text: 'Open shortcuts slideover' },
    { shortcuts: ['1'], text: 'Navigate to Content' },
    { shortcuts: ['2'], text: 'Navigate to Media' },
    { shortcuts: ['3'], text: 'Navigate to Settings' }
  ]
}, {
  category: 'Content / Media',
  items: [
    { shortcuts: ['⌘', 'B'], text: 'Open Branches modal' },
    { shortcuts: ['⌘', 'K'], text: 'Open Files modal' },
    { shortcuts: ['⌘', 'G'], text: 'Open current file on GitHub' },
    { shortcuts: ['⌘', 'S'], text: 'Save changes' }
  ]
}, {
  category: 'Live Preview',
  items: [
    { shortcuts: ['⌘', '.'], text: 'Open / Expand live preview' }
  ]
}]

whenever(and(keys['?'], notUsingInput), () => {
  isOpen.value = !isOpen.value
})

// Computed

const isOpen: WritableComputedRef<boolean> = computed({
  get () {
    return props.modelValue
  },
  set (value) {
    emit('update:modelValue', value)
  }
})

const filteredShortcuts = computed(() => {
  const regex = new RegExp(q.value, 'i')
  return shortcutsList.map(shortcutItem => ({
    category: shortcutItem.category,
    items: shortcutItem.items.filter((item) => {
      return item.text.search(regex) !== -1 || item.shortcuts.some(s => s.search(regex) !== -1)
    })
  })).filter(shortcutItem => !!shortcutItem.items.length)
})
</script>
