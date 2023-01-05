<template>
  <UCard
    padded
    body-class=""
    shadow-class=""
    background-class="bg-gray-50 dark:bg-gray-900"
    custom-class="bg-opacity-80 dark:bg-opacity-80"
    class="hover:ring-2 ucard"
  >
    <NuxtLink :to="job.link" target="_blank" class="flex flex-col gap-2 px-4 py-5 sm:p-6">
      <div class="grid grid-cols-2 gap-4 sm:flex">
        <img :src="job.organization.avatar" :alt="job.organization.name" class="object-contain w-16 h-16 rounded-full sm:w-14 sm:h-14">
        <span class="order-1 text-right sm:order-3 u-text-gray-400">{{ job.published_at }}</span>
        <div class="flex flex-col flex-1 order-2 col-span-2 gap-1">
          <div class="flex flex-col gap-2 sm:flex-row">
            <span class="flex-shrink text-xl font-semibold u-text-gray-900">{{ job.title }}</span>
            <span class="self-start px-2 py-0.5 rounded-full whitespace-nowrap u-bg-gray-200">{{ job.remote }}</span>
          </div>
          <p v-if="locations?.length" class="u-text-gray-500">
            <span v-for="location in locations" :key="location" class="location-item">{{ location }}</span>
          </p>
        </div>
      </div>
      <div>
        <span class="u-text-gray-500" v-html="description" />
      </div>
    </NuxtLink>
  </UCard>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { NuxtJob } from '../../../../types'

const props = defineProps({
  job: {
    type: Object as PropType<NuxtJob>,
    required: true
  }
})

const description = computed(() => props.job.description.replace(/\n/g, '<br>'))

/* Limit to 4 locations and discard the rest */
const locations = computed(() => props.job.locations?.map((location, index) => {
  if (index <= 3) {
    return location
  } else if (index === 4) {
    return '& others'
  } else {
    return null
  }
}).filter(v => v))
</script>

<style scoped lang="postcss">
.ucard:hover {
  --tw-ring-color: #00dc82
}

.ucard:has(a:focus-visible) {
  @apply ring-2;
  --tw-ring-color: #00dc82
}

.location-item {
  white-space: nowrap;
}

.location-item:not(:first-child)::before {
  content: '•';
  margin: 0 .5rem;
}
</style>
