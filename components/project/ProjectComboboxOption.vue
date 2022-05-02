<template>
  <li class="p-2">
    <h2 v-if="label" class="px-3 my-2 text-xs font-semibold u-text-gray-900">
      {{ label }}
    </h2>

    <ul class="text-sm u-text-gray-700">
      <ComboboxOption
        v-for="(item, index) of items"
        :key="`${type}-${index}`"
        v-slot="{ active }"
        :value="item"
        :disabled="item.disabled"
        as="template"
      >
        <li :class="['flex select-none items-center rounded-md px-3 py-2 u-text-gray-400', active && 'u-bg-gray-100 u-text-gray-900', item.disabled ? 'cursor-not-allowed' : 'cursor-pointer']">
          <UIcon :name="item.icon" :class="['h-5 w-5 flex-none', item.iconColor]" aria-hidden="true" />
          <p class="flex-auto ml-3 truncate u-text-gray-400" :class="{ 'opacity-50': item.disabled }">
            <span class="u-text-gray-700">{{ item.name || item.label }}</span>
            <span v-if="item.path" class="ml-1 text-xs italic truncate">{{ item.path }}</span>
          </p>
          <div v-if="type !== 'actions'" class="flex-none ml-3">
            <span v-if="active" class="u-text-gray-500">Jump to...</span>
            <UAvatarGroup v-else :group="usersGroup(item)" size="xxs" />
          </div>
        </li>
      </ComboboxOption>
    </ul>
  </li>
</template>

<script setup lang="ts">
import { ComboboxOption } from '@headlessui/vue'
import type { PropType, Ref } from 'vue'
import type { Project, GitHubBranch, GitHubFile, SocketUser } from '~/types'

defineProps({
  type: {
    type: String,
    required: true
  },
  label: {
    type: String,
    default: ''
  },
  items: {
    type: Array as PropType<any>,
    default: () => []
  }
})

const project: Project = inject('project')
const activeUsers: Ref<SocketUser[]> = inject('activeUsers')

const { branch } = useProjectBranches(project)

function usersGroup (item: GitHubBranch | GitHubFile) {
  return activeUsers.value.reduce((acc, user) => {
    if (item.path) { // item is GitHubFile
      if (user.file === item.path && user.branch === branch.value) {
        acc.push({ src: user.avatar, alt: user.username })
      }
    } else if (user.branch === item.name) { // item is GitHubBranch
      acc.push({ src: user.avatar, alt: user.username })
    }
    return acc
  }, [])
}
</script>
