<template>
  <UCard class="relative" ring-class="ring-1 u-ring-gray-200 lg:hover:u-ring-gray-900 lg:hover:ring-2">
    <NuxtLink :to="{ name: '@team-project', params: { project: project.slug } }" class="focus:outline-none" tabindex="-1">
      <span class="absolute inset-0" aria-hidden="true" />
    </NuxtLink>

    <div class="flex items-center gap-3 mb-6">
      <UAvatar :src="`https://github.com/${project.repository.owner}.png`" :alt="project.name" size="md" class="flex-shrink-0" />

      <div class="text-left truncate">
        <p class="font-semibold truncate leading-5">
          {{ project.name }}
        </p>

        <a v-if="project.repository.url" :href="project.repository.url" target="_blank" tabindex="-1" class="relative text-sm font-medium u-text-gray-500 truncate hover:underline z-[1]">{{ project.repository.url }}</a>
      </div>
    </div>

    <p class="u-text-gray-400 mb-6 break-words line-clamp-3">
      {{ project.repository.description || '&nbsp;' }}
    </p>

    <div class="flex items-center justify-between gap-1 text-sm leading-none u-text-gray-400">
      <time>
        Updated {{ useTimeAgo(new Date(project.updatedAt)).value }}
      </time>
      <a
        :href="`https://github.com/${project.repository.owner}/${project.repository.name}`"
        target="_blank"
        rel="noopener"
        tabindex="-1"
        class="u-text-gray-500 hover:u-text-gray-700 z-[1]"
      >
        <UIcon name="fa-brands:github" class="w-4 h-4" />
      </a>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { useTimeAgo } from '@vueuse/core'
import type { Project } from '~/types'

defineProps({
  project: {
    type: Object as PropType<Project>,
    required: true
  }
})
</script>
