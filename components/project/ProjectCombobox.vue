<template>
  <Combobox as="div" class="flex flex-col flex-1 min-h-0 divide-y u-divide-gray-100" @update:modelValue="onSelect">
    <div class="relative">
      <UIcon name="heroicons-outline:search" class="pointer-events-none absolute top-3.5 left-5 h-5 w-5 u-text-gray-400" aria-hidden="true" />
      <ComboboxInput ref="comboboxInput" :value="query" class="w-full h-12 pr-4 placeholder-gray-400 dark:placeholder-gray-500 bg-transparent border-0 pl-[3.25rem] u-text-gray-900 focus:ring-0 sm:text-sm" placeholder="Search..." @change="query = $event.target.value" />
    </div>

    <ComboboxOptions v-if="hasOptions" static hold class="relative flex-1 overflow-y-auto divide-y u-divide-gray-100 scroll-py-2">
      <li v-if="recentItems.length && !query" class="p-2">
        <h2 v-if="recentItemsLabel" class="px-3 my-2 text-xs font-semibold u-text-gray-900">
          {{ recentItemsLabel }}
        </h2>

        <ul class="text-sm u-text-gray-700">
          <ComboboxOption
            v-for="item of recentItems"
            :key="`${item.path ? item.path : item.name}`"
            v-slot="{ active }"
            :value="item"
            :disabled="item.status === 'deleted'"
            as="template"
          >
            <li :class="['flex select-none items-center rounded-md px-3 py-2 u-text-gray-400', active && 'u-bg-gray-100 u-text-gray-900', item.status === 'deleted' ? 'cursor-not-allowed' : 'cursor-pointer']">
              <UIcon :name="item.icon" :class="['h-5 w-5 flex-none', item.iconColor]" aria-hidden="true" />
              <p class="flex-auto ml-3 truncate u-text-gray-400" :class="{ 'line-through opacity-50': item.status === 'deleted' }">
                <span class="u-text-gray-700">{{ item.name }}</span>
                <span v-if="item.path" class="ml-1 text-xs italic truncate">{{ item.path }}</span>
              </p>
              <span v-if="active" class="flex-none ml-3 u-text-gray-500">Jump to...</span>
              <UAvatarGroup v-else :group="usersGroup(item)" size="xxs" />
            </li>
          </ComboboxOption>
        </ul>
      </li>

      <li v-if="filteredItems.length" class="p-2">
        <h2 v-if="itemsLabel" class="px-3 my-2 text-xs font-semibold u-text-gray-900">
          {{ itemsLabel }}
        </h2>

        <ul class="text-sm u-text-gray-700">
          <ComboboxOption
            v-for="item of filteredItems"
            :key="`${item.path ? item.path : item.name}`"
            v-slot="{ active }"
            :value="item"
            :disabled="item.status === 'deleted'"
            as="template"
          >
            <li :class="['flex select-none items-center rounded-md px-3 py-2 u-text-gray-400', active && 'u-bg-gray-100 u-text-gray-900', item.status === 'deleted' ? 'cursor-not-allowed' : 'cursor-pointer']">
              <UIcon :name="item.icon" :class="['h-5 w-5 flex-none', item.iconColor]" aria-hidden="true" />
              <p class="flex-auto ml-3 truncate u-text-gray-400" :class="{ 'line-through opacity-50': item.status === 'deleted' }">
                <span class="u-text-gray-700">{{ item.name }}</span>
                <span v-if="item.path" class="ml-1 text-xs italic truncate">{{ item.path }}</span>
              </p>
              <span v-if="active" class="flex-none ml-3 u-text-gray-500">Jump to...</span>
              <UAvatarGroup v-else :group="usersGroup(item)" size="xxs" />
            </li>
          </ComboboxOption>
        </ul>
      </li>

      <li v-if="filteredActions.length" class="p-2">
        <h2 v-if="actionsLabel" class="px-3 my-2 text-xs font-semibold u-text-gray-900">
          {{ actionsLabel }}
        </h2>

        <ul class="text-sm u-text-gray-700">
          <ComboboxOption v-for="a in filteredActions" :key="a.key" v-slot="{ active }" :value="a" as="template">
            <li :class="['flex cursor-pointer select-none items-center rounded-md px-3 py-2', active && 'u-bg-gray-100 u-text-gray-900']">
              <UIcon :name="a.icon" :class="['h-5 w-5 flex-none u-text-gray-400', active && 'u-text-gray-900', a.iconClass]" aria-hidden="true" />
              <span class="flex-auto ml-3 truncate">{{ a.label }}</span>
            </li>
          </ComboboxOption>
        </ul>
      </li>
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
import {
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption
} from '@headlessui/vue'
import type { PropType, Ref } from 'vue'
import type { GitHubBranch, GitHubFile, SocketUser } from '~/types'

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

const activeUsers: Ref<SocketUser[]> = inject('activeUsers')

const query = ref('')
const comboboxInput = ref(null)

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

// FIXME: Can no longer watch on modal visibility
// watch(() => isOpen.value, (value) => {
//   if (value) {
//     activateFirstOption()
//   }
// })

// Methods

function usersGroup (item: GitHubBranch | GitHubFile) {
  return activeUsers.value.reduce((acc, user) => {
    if ((item.path && user.file === item.path) || user.branch === item.name) {
      acc.push({ src: user.avatar, alt: user.username })
    }
    return acc
  }, [])
}

function activateFirstOption () {
  // hack combobox by using keyboard event
  // https://github.com/tailwindlabs/headlessui/blob/main/packages/%40headlessui-vue/src/components/combobox/combobox.ts#L692
  setTimeout(() => {
    comboboxInput.value?.$el.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp' }))
  }, 0)
}

function onSelect (option) {
  emit('select', option)

  // waiting for modal to be closed
  setTimeout(() => {
    query.value = ''
  }, 300)
}
</script>
