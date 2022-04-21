<template>
  <Combobox as="div" class="flex flex-col flex-1 min-h-0 divide-y u-divide-gray-100" @update:modelValue="onSelect">
    <div class="relative">
      <UIcon name="heroicons-outline:search" class="pointer-events-none absolute top-3.5 left-5 h-5 w-5 u-text-gray-400" aria-hidden="true" />
      <ComboboxInput ref="comboboxInput" :value="query" class="w-full h-12 pr-4 placeholder-gray-400 dark:placeholder-gray-500 bg-transparent border-0 pl-[3.25rem] u-text-gray-900 focus:ring-0 sm:text-sm" placeholder="Search..." @change="query = $event.target.value" />
    </div>

    <ComboboxOptions v-if="hasOptions" static hold class="relative flex-1 overflow-y-auto divide-y u-divide-gray-100 scroll-py-2">
      <ProjectComboboxOption v-if="recentItems.length && !query" type="recentItems" :items="recentItems" :label="recentItemsLabel" />

      <ProjectComboboxOption v-if="filteredItems.length" type="items" :items="filteredItems" :label="itemsLabel" />

      <ProjectComboboxOption v-if="filteredActions.length" type="action" :items="filteredActions" :label="actionsLabel" />
    </ComboboxOptions>

    <div v-else class="py-14 px-6 flex-1 flex flex-col items-center justify-center sm:px-14">
      <UIcon name="heroicons-outline:search" class="mx-auto h-6 w-6 text-gray-400" aria-hidden="true" />
      <p class="mt-4 text-sm text-gray-900">
        {{ query ? "We couldn't find any items with that term. Please try again." : "We couldn't find any items." }}
      </p>
    </div>
  </Combobox>
</template>

<script setup lang="ts">
import { Combobox, ComboboxInput, ComboboxOptions } from '@headlessui/vue'
import type { PropType } from 'vue'

const props = defineProps({
  items: {
    type: Array as PropType<any>,
    default: () => []
  },
  itemsLabel: {
    type: String,
    default: ''
  },
  recentItems: {
    type: Array as PropType<any>,
    default: () => []
  },
  recentItemsLabel: {
    type: String,
    default: 'Recent'
  },
  actions: {
    type: Array as PropType<any>,
    default: () => []
  },
  actionsLabel: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['select'])

const query = ref('')
const comboboxInput = ref(null)

onMounted(() => {
  activateFirstOption()
})

// Computed

const filteredItems = computed(() => {
  let filteredItems = [...props.items]

  if (query.value) {
    filteredItems = filteredItems.filter(item => [item.path, item.name]
      .filter(Boolean)
      .some(value => value.search(new RegExp(query.value, 'i')) !== -1)
    )
  }
  filteredItems = filteredItems.slice(0, 24)
  return filteredItems
})

const filteredActions = computed(() => {
  return [...props.actions].filter((a) => {
    return a.static || (
      (a.visible === undefined || a.visible) && (!query.value || [a.key, a.label].filter(Boolean).some(value => value.search(new RegExp(query.value, 'i')) !== -1))
    )
  })
})

const hasOptions = computed(() => (props.recentItems.length && !query) || filteredItems.value.length || filteredActions.value.length)

// Watch

watch(() => query.value, (value, oldValue) => {
  if (value !== oldValue) {
    activateFirstOption()
  }
})

// Methods

function activateFirstOption () {
  // hack combobox by using keyboard event
  // https://github.com/tailwindlabs/headlessui/blob/main/packages/%40headlessui-vue/src/components/combobox/combobox.ts#L692
  setTimeout(() => {
    comboboxInput.value?.$el.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp' }))
  }, 0)
}

function onSelect (option) {
  if (option.disabled) {
    return
  }

  emit('select', option, { query: query.value })

  // waiting for modal to be closed
  setTimeout(() => {
    query.value = ''
  }, 300)
}
</script>
