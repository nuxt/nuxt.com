<template>
  <header class="u-bg-white border-b u-border-gray-200">
    <ProjectNavbarDialog v-model="isOpen" :links="links" />

    <UContainer padded class="relative">
      <div class="flex items-center justify-between h-16">
        <button class="lg:hidden" @click="isOpen = true">
          <UIcon name="heroicons-outline:menu-alt-2" class="w-6 h-6 flex-shrink-0" />
        </button>

        <NuxtLink :to="{ name: '@team-projects' }" class="inline-flex">
          <UAvatar :src="`https://github.com/${project.repository.owner}.png`" :alt="project.name" size="sm" class="flex-shrink-0" />
        </NuxtLink>

        <TeamsDropdown compact />
      </div>
    </UContainer>
  </header>
</template>

<script setup lang="ts">
import type { Project } from '~/types'

defineProps({
  links: {
    type: Array,
    default: () => []
  }
})

const project: Project = inject('project')

const isOpen = ref(false)
</script>
