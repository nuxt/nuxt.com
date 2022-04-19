<template>
  <div class="flex items-center gap-1.5">
    <UTooltip
      v-for="(activeUser, index) of activeUsers"
      :key="`${index}-${activeUser.id}`"
      class="flex items-center"
      tooltip-class="w-auto max-w-xs px-3 py-2.5 rounded shadow u-bg-gray-800 u-text-white text-xs text-center space-y-1"
      :class="{ 'cursor-pointer': canJump(activeUser) }"
      @click="navigateTo(activeUser)"
    >
      <UAvatar :src="activeUser.avatar" size="xs" />

      <template #text>
        <p class="font-medium leading-none text-sm">
          {{ activeUser.username }}
          {{ activeUser.id === user.id ? '(you)' : '' }}
        </p>
        <div v-if="canJump(activeUser)">
          <p v-if="activeUser.branch !== branch.name" class="u-text-gray-200 italic">
            Jump to {{ activeUser.branch }} branch
          </p>
          <p v-else-if="!!activeUser.file" class="u-text-gray-200 italic">
            Jump to {{ getPathName(activeUser.file) }} file
          </p>
        </div>
      </template>
    </UTooltip>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import { getPathName } from '~/utils/tree'
import type { Project, User, SocketUser } from '~/types'

const router = useRouter()
const user = useStrapiUser() as Ref<User>

const project: Project = inject('project')
const activeUsers: Ref<SocketUser[]> = inject('activeUsers')

const { branch, select: selectBranch } = useProjectBranches(project)
const { file, select: selectContentFile, refresh: refreshContentFiles } = useProjectFiles(project, 'content')
const { refresh: refreshMediaFiles } = useProjectFiles(project, 'public')

function canJump (activeUser) {
  return activeUser.id === user.value.id && (activeUser.branch !== branch.value.name || !!activeUser.file)
}

async function navigateTo (activeUser: SocketUser) {
  if (activeUser.id === user.value?.id) {
    return
  }

  const { file: f, branch: b } = activeUser

  if (b !== branch.value?.name) {
    selectBranch({ name: b })

    await refreshContentFiles()
    refreshMediaFiles()
  }

  if (file.value && f !== file.value.path) {
    selectContentFile({ path: f, type: 'blob' })
  }

  router.push({ name: '@team-project-content' })
}
</script>
