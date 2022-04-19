<template>
  <UAvatarGroup v-if="usersGroup.length" :group="usersGroup" size="xxs" />
</template>

<script setup lang="ts">
import type { PropType, Ref } from 'vue'
import type { File, Project, SocketUser } from '~/types'

const props = defineProps({
  file: {
    type: Object as PropType<File>,
    required: true
  },
  openedDirs: {
    type: Object,
    default: () => ({})
  }
})

const project: Project = inject('project')
const activeUsers: Ref<SocketUser[]> = inject('activeUsers')

const { branch } = useProjectBranches(project)

const isDir = computed(() => props.file.type === 'directory')
const isOpen = computed(() => !!props.openedDirs[props.file.path])

const usersGroup = computed(() => {
  return activeUsers.value.reduce((acc, user) => {
    if (!!user.file && user.branch === branch.value.name) {
      if (isDir.value && !isOpen.value) {
        if (user.file.startsWith(props.file.path)) {
          acc.push({ src: user.avatar, alt: user.username })
        }
      } else if (user.file === props.file.path) {
        acc.push({ src: user.avatar, alt: user.username })
      }
    }
    return acc
  }, [])
})
</script>
