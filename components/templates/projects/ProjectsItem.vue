<template>
  <!-- TODO: route :to="{ name: 'team-name', params: { team, name: project.name } } -->
  <ULink to="#">
    <UCard ring-class="ring-1 u-ring-gray-200 lg:hover:u-ring-gray-900 lg:hover:ring-2">
      <div class="flex flex-col space-y-6">
        <div class="truncate">
          <div class="flex items-center space-x-3">
            <UAvatar :alt="project.name" size="sm" class="flex-shrink-0" />

            <div class="text-left truncate">
              <p class="font-medium truncate">
                {{ project.name }}
              </p>

              <p class="text-sm font-medium truncate text-tw-gray-500">
                <a :href="project.url" target="_blank" class="hover:underline" @click.stop>{{ project.url }}</a>
              </p>
            </div>
          </div>

          <div class="flex items-center justify-between mt-6">
            <a :href="`https://github.com/${project.repository.owner}/${project.repository.name}`" target="_blank" rel="noopener" class="flex items-center space-x-1.5 u-text-gray-500 text-sm font-medium hover:underline truncate" @click.stop>
              <UIcon name="fa-brands:github" class="w-4 h-4" />
              <span class="truncate">{{ project.repository.owner }}/{{ project.repository.name }}</span>
            </a>
          </div>
        </div>

        <img class="bg-center bg-no-repeat bg-cover border rounded shadow-sm aspect-w-16 aspect-h-9" :style="`background-image: url(${project.screenshot.url});`">

        <div class="flex items-center justify-between space-x-3 text-xs">
          <span class="font-medium capitalize u-text-gray-700">{{ project.status }}</span>

          <time class="font-medium capitalize u-text-gray-700">
            Updated {{ useTimeAgo(new Date(project.updatedAt)).value }}
          </time>
        </div>
      </div>
    </UCard>
  </ULink>
</template>

<script setup lang="ts">

import type { PropType, Ref } from 'vue'
import { useTimeAgo } from '@vueuse/core'
import type { Project, User } from '~/types'

const props = defineProps({
  project: {
    type: Object as PropType<Project>,
    required: true
  }
})

const user = useStrapiUser() as Ref<User>

const team = computed(() => props.project.team ? props.project.team.slug : user.value.username)

</script>
