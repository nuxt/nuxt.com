<template>
  <USlideover v-model="isOpen">
    <template #header>
      <button @click="isOpen = false">
        <UIcon name="heroicons-outline:x" class="flex-shrink-0 w-6 h-6" />
      </button>

      <NuxtLink :to="{ name: '@team-projects' }" class="inline-flex">
        <UAvatar :src="`https://github.com/${project.repository.owner}.png`" :alt="project.name" size="sm" class="flex-shrink-0" />
      </NuxtLink>

      <TeamsDropdown compact />
    </template>

    <UVerticalNavigation :links="links" class="flex-1 px-2 py-4 overflow-y-scroll sm:px-4" @click="isOpen = false" />
  </USlideover>
</template>

<script setup lang="ts">
import type { WritableComputedRef } from 'vue'
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

const isOpen: WritableComputedRef<boolean> = computed({
  get () {
    return props.modelValue
  },
  set (value) {
    emit('update:modelValue', value)
  }
})

const project: Project = inject('project')
</script>
