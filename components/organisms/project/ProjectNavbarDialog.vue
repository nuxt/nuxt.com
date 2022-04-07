<template>
  <USlideover v-model="isOpen">
    <template #header>
      <button @click="isOpen = false">
        <UIcon name="heroicons-outline:x" class="w-6 h-6 flex-shrink-0" />
      </button>

      <NuxtLink :to="{ name: '@team-projects' }" class="inline-flex">
        <UAvatar :src="`https://github.com/${project.repository.owner}.png`" :alt="project.name" size="sm" class="flex-shrink-0" />
      </NuxtLink>

      <ProfileDropdown size="xs" />
    </template>

    <UVerticalNavigation :links="links" class="py-4 px-2 flex-1 overflow-y-scroll" @click="isOpen = false" />
  </USlideover>
</template>

<script setup lang="ts">
import type { Project } from '~/types'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  links: {
    type: Array,
    default: () => []
  }
})
const emit = defineEmits(['update:modelValue'])

const isOpen = computed({
  get () {
    return props.modelValue
  },
  set (value) {
    emit('update:modelValue', value)
  }
})

const project: Project = inject('project')
</script>
