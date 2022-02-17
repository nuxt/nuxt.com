<template>
  <UCard>
    <div class="space-y-6">
      <div class="flex items-center gap-3">
        <UAvatar :src="`https://github.com/${project.repository.owner}.png`" :alt="project.name" size="sm" class="flex-shrink-0" />

        <div class="text-left">
          <p class="font-semibold leading-none">
            {{ project.name }}
          </p>

          <p v-if="project.repository.url" class="text-sm font-medium u-text-gray-500 leading-none mt-1">
            <a :href="project.repository.url" target="_blank" class="hover:underline">{{ project.repository.url }}</a>
          </p>
        </div>
      </div>

      <p class="u-text-gray-400">
        {{ project.repository.description }}
      </p>

      <div class="flex items-center gap-1 text-sm leading-none u-text-gray-400">
        <time class="">
          {{ useTimeAgo(new Date(project.updatedAt)).value }}
        </time>
        <span>via</span>
        <a
          :href="`https://github.com/${project.repository.owner}/${project.repository.name}`"
          target="_blank"
          rel="noopener"
          class="u-text-gray-500 hover:u-text-gray-700"
        >
          <UIcon name="fa-brands:github" class="w-4 h-4" />
        </a>
      </div>
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
