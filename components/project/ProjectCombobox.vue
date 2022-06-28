<template>
  <Combobox @update:modelValue="onSelect">
    <div class="flex flex-col flex-1 min-h-0 divide-y u-divide-gray-100">
      <div class="relative">
        <UIcon name="uil:search-alt" class="pointer-events-none absolute top-3.5 left-5 h-5 w-5 u-text-gray-400" aria-hidden="true" />
        <ComboboxInput
          ref="comboboxInput"
          :value="query"
          class="w-full h-12 pr-4 placeholder-gray-400 dark:placeholder-gray-500 bg-transparent border-0 pl-[3.25rem] u-text-gray-900 focus:ring-0 sm:text-sm"
          placeholder="Search..."
          autocomplete="off"
          @change="query = $event.target.value"
        />
        <UIcon name="heroicons-outline:x" class="absolute top-3.5 right-5 h-5 w-5 u-text-gray-500" aria-hidden="true" @click="onClear" />
      </div>

      <ComboboxOptions v-if="hasOptions" static hold class="relative flex-1 overflow-y-auto divide-y u-divide-gray-100 scroll-py-2">
        <ProjectComboboxOption v-if="recentItems.length && !query" type="recentItems" :items="recentItems" :label="recentItemsLabel" />

        <ProjectComboboxOption v-if="filteredItems.length" type="items" :items="filteredItems" :label="itemsLabel" />

        <ProjectComboboxOption v-if="filteredActions.length" type="actions" :items="filteredActions" :label="actionsLabel" />
      </ComboboxOptions>

      <div v-else class="flex flex-col items-center justify-center flex-1 px-6 py-14 sm:px-14">
        <UIcon name="uil:search-alt" class="w-6 h-6 mx-auto text-gray-400" aria-hidden="true" />
        <p class="mt-4 text-sm text-gray-900">
          {{ query ? "We couldn't find any items with that term. Please try again." : "We couldn't find any items." }}
        </p>
      </div>
    </div>
  </Combobox>
</template>

<script setup lang="ts">
import { Combobox, ComboboxInput, ComboboxOptions } from '@headlessui/vue'
import type { ComputedRef, PropType } from 'vue'
import type { GitHubBranch, GitHubFile } from '~/types'
import { searchTextRegExp } from '~/utils'

const props = defineProps({
  items: {
    type: Array as PropType<(GitHubBranch | GitHubFile)[]>,
    default: () => []
  },
  itemsLabel: {
    type: String,
    default: ''
  },
  recentItems: {
    type: Array as PropType<(GitHubBranch | GitHubFile)[]>,
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

const emit = defineEmits(['select', 'close'])

const query = ref('')
const comboboxInput = ref(null)

onMounted(() => {
  activateFirstOption()
})

// Computed

const filteredItems: ComputedRef<(GitHubBranch | GitHubFile)[]> = computed(() => {
  let filteredItems = [...props.items]

  if (query.value) {
    const queryRegExp = searchTextRegExp(query.value)
    filteredItems = filteredItems.filter(item => [(item as GitHubFile).path, item.name]
      .filter(Boolean)
      .some(value => value.search(queryRegExp) !== -1)
    )
  }
  filteredItems = filteredItems.slice(0, 24)
  return filteredItems
})

const filteredActions = computed(() => {
  const queryRegExp = searchTextRegExp(query.value)
  return [...props.actions].filter((a) => {
    return a.static || (
      (a.visible === undefined || a.visible) && (!query.value || [a.key, a.label].filter(Boolean).some(value => value.search(queryRegExp) !== -1))
    )
  })
})

const hasOptions = computed(() => (props.recentItems.length && !query) || filteredItems.value.length || filteredActions.value.length)

// Methods

function activateFirstOption () {
  // hack combobox by using keyboard event
  // https://github.com/tailwindlabs/headlessui/blob/main/packages/%40headlessui-vue/src/components/combobox/combobox.ts#L692
  setTimeout(() => {
    comboboxInput.value?.$el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
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

function onClear () {
  if (query.value) {
    query.value = ''
  } else {
    emit('close')
  }
}
</script>
