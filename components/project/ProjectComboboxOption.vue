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
        <li :class="['flex justify-between select-none items-center rounded-md px-3 py-2 u-text-gray-400', active && 'u-bg-gray-100 u-text-gray-900', item.disabled ? 'cursor-not-allowed' : 'cursor-pointer']">
          <div class="flex items-center">
            <UIcon :name="item.icon" :class="['h-5 w-5', (item as GitHubFile).iconColor, (item as GitHubFile).iconClass]" aria-hidden="true" />
            <div class="flex items-center ml-3 truncate u-text-gray-400" :class="{ 'opacity-50': item.disabled }">
              <span class="u-text-gray-700">{{ item.name || (item as any).label }}</span>
              <span v-if="(item as GitHubFile).path" class="ml-1 text-xs italic truncate">{{ (item as GitHubFile).path }}</span>
              <UTooltip v-if="(item as GitHubBranch).pull" placement="right" container-class="z-10 px-2" class="ml-3">
                <UBadge size="sm">
                  <span class="font-normal">#{{ (item as GitHubBranch).pull.number }}</span>
                  <UIcon
                    :name="(item as GitHubBranch).pull.success ? 'uil:check' : 'uil:times'"
                    :class="(item as GitHubBranch).pull.success ? 'text-green-500' : 'text-red-500'"
                    class="w-5 h-5 ml-1"
                    @click.stop="redirectToGithubPull((item as GitHubBranch).pull.url)"
                  />
                </UBadge>
                <template #text>
                  <span>{{ (item as GitHubBranch).pull.description }}</span>
                </template>
              </UTooltip>
            </div>
          </div>
          <div v-if="type !== 'actions'" class="ml-3">
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
    type: Array as PropType<(GitHubBranch | GitHubFile)[]>,
    default: () => []
  }
})

const project: Project = inject('project')
const activeUsers: Ref<SocketUser[]> = inject('activeUsers')

const { branch } = useProjectBranches(project)

function usersGroup (item: GitHubBranch | GitHubFile) {
  return activeUsers.value.reduce((acc, user) => {
    if ((item as GitHubFile).path) {
      if (user.file === (item as GitHubFile).path && user.branch === branch.value.name) {
        acc.push({ src: user.avatar, alt: user.username })
      }
    } else if (user.branch === item.name) { // item is GitHubBranch
      acc.push({ src: user.avatar, alt: user.username })
    }
    return acc
  }, [])
}

function redirectToGithubPull (url) {
  window.open(url, '_blank')
}
</script>
