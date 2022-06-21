<template>
  <header class="border-b u-bg-white u-border-gray-200">
    <ProjectNavbarDialog v-model="isOpen" :links="links" />

    <UContainer padded class="relative">
      <div class="flex items-center justify-between h-16">
        <button @click="isOpen = true">
          <UIcon name="heroicons-outline:menu-alt-2" class="flex-shrink-0 w-6 h-6" />
        </button>

        <h2 class="text-lg font-semibold u-text-gray-900">
          {{ project.name }}
        </h2>

        <TeamsDropdown compact />
      </div>
    </UContainer>
  </header>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { Project } from '~/types'

defineProps({
  links: {
    type: Array,
    default: () => []
  }
})

const project: Ref<Project> = inject('project')

const isOpen = ref(false)
</script>
