<template>
  <ProjectPage>
    <div class="flex-1 p-4 sm:p-6 lg:p-8">
      <div class="lg:flex lg:items-center lg:justify-between">
        <div class="flex-1 min-w-0">
          <h2 class="text-2xl font-bold leading-7 u-text-gray-900 sm:text-3xl sm:truncate">
            {{ team?.slug || user.username }}/{{ project.name }}
          </h2>
          <div class="flex flex-col mt-1 sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
            <div class="flex items-center mt-2 text-sm u-text-gray-500">
              <UIcon name="heroicons-outline:clock" class="flex-shrink-0 mr-1.5 h-5 w-5 u-text-gray-400" aria-hidden="true" />
              <time>
                Updated {{ useTimeAgo(new Date(project.updatedAt)).value }}
              </time>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-3 mt-5 lg:mt-0 lg:ml-4">
          <UButton label="Edit" :to="{ name: '@team-project-content' }" icon="heroicons-outline:pencil" variant="secondary" />

          <UButton
            v-if="project.repository.url"
            :to="project.repository.url"
            target="_blank"
            label="View"
            icon="heroicons-outline:link"
            variant="secondary"
          />

          <UButton label="Open on GitHub" :to="`https://github.com/${project.repository.owner}/${project.repository.name}`" target="_blank" icon="fa-brands:github" />
        </div>
      </div>

      <UCard class="mt-8" padded />
    </div>
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
