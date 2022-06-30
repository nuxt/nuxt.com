<template>
  <div class="flex items-center gap-1.5">
    <UTooltip
      v-for="(activeUser, index) of activeUsers"
      :key="`${index}-${activeUser.id}`"
      class="flex items-center"
      tooltip-class="w-auto max-w-xs px-3 py-2.5 rounded shadow u-bg-gray-800 u-text-white text-xs text-center space-y-1"
      :class="{ 'cursor-pointer': canJump(activeUser) }"
      @click="jumpTo(activeUser)"
    >
      <UAvatar :src="activeUser.avatar" size="xs" />

      <template #text>
        <p class="text-sm font-medium leading-none">
          {{ activeUser.username }}
          {{ activeUser.id === user.id ? '(you)' : '' }}
        </p>
        <div v-if="canJump(activeUser)">
          <p v-if="activeUser.branch !== branch.name" class="italic u-text-gray-200">
            Jump to {{ activeUser.branch }} branch
          </p>
          <p v-else-if="!!activeUser.file" class="italic u-text-gray-200">
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
import type { Project, User, SocketUser, Root } from '~/types'

const router = useRouter()
const user = useStrapiUser() as Ref<User>

const project: Ref<Project> = inject('project')
const activeUsers: Ref<SocketUser[]> = inject('activeUsers')

const { branch, select: selectBranch } = useProjectBranches(project.value)
const { file: contentFile, select: selectContentFile } = useProjectFiles(project.value, 'content')
const { file: mediaFile, select: selectMediaFile } = useProjectFiles(project.value, 'public')

function canJump (activeUser) {
  return activeUser.id !== user.value?.id && (activeUser.branch !== branch.value.name || !!activeUser.file)
}

function jumpTo (activeUser: SocketUser) {
  if (activeUser.id === user.value?.id) {
    return
  }

  const { file: f, branch: b } = activeUser
  const root = f.split('/')[0] as Root

  if (b !== branch.value?.name) {
    selectBranch({ name: b })
  }

  const param = root === 'content' ? 'content' : 'media'
  const file = root === 'content' ? contentFile : mediaFile
  const selectFile = root === 'content' ? selectContentFile : selectMediaFile

  if (file.value && f !== file.value.path) {
    selectFile({ path: f, type: 'blob' })
  }

  router.push({ name: `@team-project-${param}` })
}
</script>
