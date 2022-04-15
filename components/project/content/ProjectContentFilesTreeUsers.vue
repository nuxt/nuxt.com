<template>
  <UAvatarGroup v-if="usersGroup.length" :group="usersGroup" size="xxs" />
</template>

<script setup lang="ts">
import type { PropType, Ref } from 'vue'
import type { File, SocketUser } from '~/types'

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

const activeUsers: Ref<SocketUser[]> = inject('activeUsers')

const isDir = computed(() => props.file.type === 'directory')
const isOpen = computed(() => !!props.openedDirs[props.file.path])

const usersGroup = computed(() => {
  let users = activeUsers.value.filter(user => !!user.file)

  if (isDir.value && !isOpen.value) {
    users = users.filter(user => user.file.startsWith(props.file.path))
  } else {
    users = users.filter(user => user.file === props.file.path)
  }
  return users.map(user => ({ src: user.avatar, alt: user.username }))
})
</script>
