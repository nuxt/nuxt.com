<template>
  <UCard padded class="relative transition duration-200 hover:ring-2 hover:u-ring-gray-900">
    <NuxtLink :to="{ name: '@team-project', params: { team: team?.slug || user.username, project: project.slug } }" class="focus:outline-none" tabindex="-1">
      <span class="absolute inset-0" aria-hidden="true" />
    </NuxtLink>

    <div class="flex items-center gap-3 mb-6">
      <UAvatar :src="`https://github.com/${project.repository.owner}.png`" :alt="project.name" size="md" class="flex-shrink-0" />

      <div class="text-left truncate">
        <p class="font-semibold leading-5 truncate">
          {{ project.name }}
        </p>

        <a v-if="project.url" :href="project.url" target="_blank" tabindex="-1" class="relative text-sm font-medium u-text-gray-500 truncate hover:underline z-[1]">{{ project.url }}</a>
      </div>
    </div>

    <p class="mb-6 break-words u-text-gray-400 line-clamp-1">
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
import type { PropType, Ref } from 'vue'
import { useTimeAgo } from '@vueuse/core'
import type { User, Project, Team } from '~/types'

defineProps({
  project: {
    type: Object as PropType<Project>,
    required: true
  }
})

const team: Team = inject('team')
const user = useStrapiUser() as Ref<User>
</script>
