<template>
  <NuxtLink to="#">
    <TwCard variant="black" ring-class="ring-1 ring-tw-gray-200 lg:hover:ring-tw-gray-900 lg:hover:ring-2">
      <div class="relative flex flex-col lg:flex-row flex-1 gap-6">
        <div class="flex-1 truncate">
          <div class="flex items-center gap-3">
            <TwAvatar :src="`${project.url}/icon.png`" size="sm" class="flex-shrink-0" />

            <div class="truncate">
              <p class="font-medium">
                {{ project.name }}
              </p>

              <p class="text-sm text-tw-gray-500 font-medium truncate">
                <a :href="project.url" target="_blank" class="hover:underline" @click.stop>{{ project.url }}</a>
              </p>
            </div>
          </div>

          <div class="flex items-center justify-between mt-6 gap-3 relative">
            <a :href="`https://github.com/${project.repository.owner}/${project.repository.name}`" target="_blank" rel="noopener" class="relative flex items-center gap-1.5 text-tw-gray-500 text-sm font-medium hover:underline truncate" @click.stop>
              <SvgIcon name="brands/github" class="w-4 h-4 flex-shrink-0" />
              <span class="truncate">{{ project.repository.owner }}/{{ project.repository.name }}</span>
            </a>

            <div class="flex items-center gap-3">
              <span class="text-xs font-medium leading-5 text-right sm:flex-shrink-0 text-tw-gray-700 capitalize">{{ project.status }}</span>

              <span class="text-xs font-normal leading-5 text-right sm:flex-shrink-0 text-tw-gray-400">Updated <Timeago :datetime="project.updated_at" /></span>
            </div>
          </div>
        </div>

        <div class="lg:w-[153px]">
          <div class="relative flex-shrink-0 aspect-w-16 aspect-h-9 bg-tw-gray-50 rounded border border-tw-gray-200 overflow-hidden shadow-sm">
            <div class="bg-no-repeat bg-cover w-full h-full" :style="`background-image: url(${project.screenshot});`" />
          </div>
        </div>
      </div>
    </TwCard>
  </NuxtLink>
</template>

<script setup lang="ts">

import type { PropType, Ref } from 'vue'
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
