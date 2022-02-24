<template>
  <ProjectPage>
    <div class="lg:flex lg:items-center lg:justify-between">
      <div class="flex-1 min-w-0">
        <h2 class="text-2xl font-bold leading-7 u-text-gray-900 sm:text-3xl sm:truncate">
          {{ team ? team.slug : user.username }}/{{ project.name }}
        </h2>
        <div class="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
          <div class="mt-2 flex items-center text-sm u-text-gray-500">
            <UIcon name="heroicons-outline:clock" class="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
            <time>
              Updated {{ useTimeAgo(new Date(project.updatedAt)).value }}
            </time>
          </div>
        </div>
      </div>
      <div class="mt-5 flex items-center lg:mt-0 lg:ml-4 gap-3">
        <UButton label="Edit" icon="heroicons-outline:pencil" variant="secondary" />

        <UButton
          v-if="project.repository.url"
          :to="project.repository.url"
          target="_blank"
          label="View"
          icon="heroicons-outline:link"
          variant="secondary"
        />

        <UButton label="Publish" icon="heroicons-outline:check" />
      </div>
    </div>

    <UCard class="mt-8" />
  </ProjectPage>
</template>

<script setup lang="ts">
import { useTimeAgo } from '@vueuse/core'
import type { PropType, Ref } from 'vue'
import type { Team, Project, User } from '~/types'

defineProps({
  team: {
    type: Object as PropType<Team>,
    default: null
  },
  project: {
    type: Object as PropType<Project>,
    required: true
  }
})

const user = useStrapiUser() as Ref<User>
</script>
