<template>
  <li class="relative col-span-6 overflow-hidden border u-border-gray-200 rounded-xl h-44 group">
    <img src="/assets/community/nuxters/nuxter-gradient.svg" alt="nuxter background" class="absolute object-cover h-44 left-32">
    <div class="absolute w-56 h-56 overflow-hidden rounded-full u-bg-gray-50 -top-6 -left-10">
      <img :src="nuxter.avatar" :alt="nuxter.username" class="w-full h-full">
    </div>
    <div class="absolute inset-y-0 flex justify-between left-56 right-6 xl:right-10">
      <div class="flex flex-col justify-between py-6">
        <div>
          <div class="flex items-center gap-3">
            <h3 class="text-2xl font-semibold leading-none u-text-gray-900">
              @{{ nuxter.username }}
            </h3>
            <!-- <CommunityNuxtersNuxterBadge :role="nuxter.role" /> -->
          </div>
          <div class="flex items-center gap-3 mt-2">
            <span class="text-lg font-medium u-text-gray-700">{{ nuxter.name || nuxter.username }}</span>
            <!-- <NuxtLink v-if="nuxter.twitter" :to="`https://twitter.com/${nuxter.twitter}`" target="_blank">
              <UIcon name="uil:twitter" class="w-5 h-5 u-text-gray-900 hover:u-text-gray-600" />
            </NuxtLink> -->
            <NuxtLink :to="`https://github.com/${nuxter.username}`" target="_blank">
              <UIcon name="uil:github" class="w-5 h-5 u-text-gray-900 hover:u-text-gray-600" />
            </NuxtLink>
          </div>
        </div>
        <div class="items-center hidden gap-12 sm:flex">
          <CommunityNuxtersNuxterNumber :nuxter="nuxter" :size="numberSize" :type="sortedTypes[1]" />
          <CommunityNuxtersNuxterNumber :nuxter="nuxter" :size="numberSize" :type="sortedTypes[2]" />
          <CommunityNuxtersNuxterNumber :nuxter="nuxter" :size="numberSize" :type="sortedTypes[3]" />
        </div>
      </div>
      <div class="flex flex-col items-end justify-between flex-shrink-0 pb-6">
        <CommunityNuxtersNuxterRank :nuxter="nuxter" />
        <CommunityNuxtersNuxterNumber :nuxter="nuxter" size="md" :type="sortedTypes[0]" />
      </div>
    </div>
  </li>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import type { CommunityNuxter } from '~/types'

defineProps({
  nuxter: {
    type: Object as PropType<CommunityNuxter>,
    required: true
  }
})

const { selectedSort } = useCommunityNuxters()

const { smaller } = useBreakpoints(breakpointsTailwind)

const md = smaller('lg')

const sortedTypes = computed(() => {
  const types = ['activities', 'pull_requests', 'issues', 'comments']
  return [selectedSort.value.key, ...types.filter(type => type !== selectedSort.value.key)]
})

const numberSize = computed(() => {
  if (md.value) {
    return 'sm'
  } else {
    return 'md'
  }
})
</script>
