<template>
  <UCard
    padded
    body-class=""
    shadow-class=""
    background-class="bg-gray-50 dark:bg-gray-900"
    custom-class="bg-opacity-80 dark:bg-opacity-80"
    class="hover:ring-2 hover:u-ring-gray-900"
  >
    <NuxtLink :to="`https://vuejobs.com/jobs/${job.id}`" target="_blank" class="flex flex-col gap-2 px-4 py-5 sm:p-6">
      <div class="flex gap-4">
        <img :src="job.company.avatar" :alt="job.company.name" class="object-contain w-16 h-16 rounded-full sm:w-20 sm:h-20">
        <div class="flex flex-col flex-1 gap-2">
          <div class="flex flex-col gap-2 sm:flex-row">
            <span class="flex-shrink text-xl font-semibold u-text-gray-900">{{ job.title }}</span>
            <span class="self-start px-2 py-0.5 rounded-full whitespace-nowrap" :class="typeClass">{{ typeLabel }}</span>
          </div>
          <span class="text-xl u-text-gray-500">{{ job.location }}</span>
        </div>
        <span class="u-text-gray-400">{{ job.published_at.for_humans }}</span>
      </div>
      <div>
        <span class="text-xl u-text-gray-500" v-html="description"></span>
      </div>
    </NuxtLink>
  </UCard>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { CommunityJob } from '~/types'

const props = defineProps({
  job: {
    type: Object as PropType<CommunityJob>,
    required: true
  }
})

const { types } = useCommunityJobs()

const typeClass = computed(() => {
  switch (props.job.type) {
    case 'full-time':
      return 'bg-green-50 text-green-800'
    case 'part-time':
      return 'bg-blue-50 text-blue-800'
    case 'freelance':
      return 'bg-yellow-50 text-yellow-800'
    case 'internship':
      return 'bg-purple-50 text-purple-800'
    case 'temporary':
      return 'bg-pink-50 text-pink-800'
  }
})

const typeLabel = computed(() => types.value.find(type => type.value === props.job.type)?.text || props.job.type)

const description = computed(() => props.job.description.replace(/\n/g, '<br>'))
</script>
