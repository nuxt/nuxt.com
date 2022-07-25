<template>
  <li class="relative flex items-center justify-between h-32 col-span-6 gap-1 overflow-hidden border md:col-span-3 xl:col-span-2 u-border-gray-200 rounded-xl">
    <div class="flex items-center h-full">
      <UAvatar :src="nuxter.avatar" :alt="nuxter.username" :text="nuxter.username" size="2xl" class="mx-2" />
      <div class="flex flex-col justify-between h-full py-5 truncate">
        <h3 class="text-lg font-semibold leading-none u-text-gray-900 line-clamp-1">
          @{{ nuxter.username }}
        </h3>
        <span class="font-medium u-text-gray-500 line-clamp-1">{{ nuxter.name || nuxter.username }}</span>
        <div class="flex items-center gap-3">
          <!-- <CommunityNuxtersNuxterBadge :role="nuxter.role" /> -->
          <!-- <NuxtLink v-if="nuxter.twitter" :to="`https://twitter.com/${nuxter.twitter}`" target="_blank">
            <UIcon name="uil:twitter" class="w-5 h-5 text-gray-400 dark:text-gray-50 hover:u-text-gray-600" />
          </NuxtLink> -->
          <NuxtLink :to="`https://github.com/${nuxter.username}`" target="_blank">
            <UIcon name="uil:github" class="w-5 h-5 u-text-gray-900 hover:u-text-gray-600" />
          </NuxtLink>
        </div>
      </div>
    </div>
    <div class="flex flex-col items-end justify-between flex-shrink-0 h-full pb-5 mr-6">
      <CommunityNuxtersNuxterRank :nuxter="nuxter" />
      <CommunityNuxtersNuxterNumber :nuxter="nuxter" size="sm" :type="sortedTypes[0]" />
    </div>
  </li>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { CommunityNuxter } from '~/types'

defineProps({
  nuxter: {
    type: Object as PropType<CommunityNuxter>,
    required: true
  }
})

const { selectedSort } = useCommunityNuxters()

const sortedTypes = computed(() => {
  const types = ['activities', 'pull_requests', 'issues', 'comments']
  return [selectedSort.value.key, ...types.filter(type => type !== selectedSort.value.key)]
})
</script>
