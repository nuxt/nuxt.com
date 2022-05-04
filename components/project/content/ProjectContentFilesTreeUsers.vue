<template>
  <UAvatarGroup v-if="usersGroup.length" :group="usersGroup" size="xxs" />
</template>

<script setup lang="ts">
import type { PropType, Ref } from 'vue'
import type { File, Root, Project, SocketUser, User } from '~/types'

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
const root: Root = inject('root')
const activeUsers: Ref<SocketUser[]> = inject('activeUsers')

const user = useStrapiUser() as Ref<User>
const { branch } = useProjectBranches(project)
const { openedDirs } = useProjectFilesTree(project, root)

const isDir = computed(() => props.file.type === 'directory')
const isOpen = computed(() => !!openedDirs.value[props.file.path])

const usersGroup = computed(() => {
  return activeUsers.value.reduce((acc, u) => {
    if (!!u.file && u.branch === branch.value.name && u.id !== user.value.id) {
      if (isDir.value && !isOpen.value) {
        if (u.file.startsWith(props.file.path)) {
          acc.push({ src: u.avatar, alt: u.username })
        }
      } else if (u.file === props.file.path) {
        acc.push({ src: u.avatar, alt: u.username })
      }
    }
    return acc
  }, [])
})
</script>
