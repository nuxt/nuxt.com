<template>
  <li class="relative flex items-center justify-between h-32 col-span-6 overflow-hidden border md:col-span-3 xl:col-span-2 u-border-gray-200 rounded-xl group">
    <div class="flex items-center h-full">
      <img :src="nuxter.avatar_url" :alt="nuxter.github" class="w-16 h-16 mx-2 transition-all rounded-full grayscale group-hover:grayscale-0">
      <div class="flex flex-col justify-between h-full py-5">
        <div>
          <h3 class="text-lg font-semibold leading-none u-text-gray-900 line-clamp-1">
            @{{ nuxter.github }}
          </h3>
          <div class="flex items-center gap-3 mt-1">
            <span class="font-medium u-text-gray-500 line-clamp-1">{{ nuxter.name }}</span>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <CommunityNuxtersNuxterBadge :role="nuxter.role" />
          <NuxtLink v-if="nuxter.twitter" :to="`https://twitter.com/${nuxter.twitter}`" target="_blank">
            <UIcon name="uil:twitter" class="w-5 h-5 text-gray-400 dark:text-gray-50" />
          </NuxtLink>
          <NuxtLink v-if="nuxter.github" :to="`https://github.com/${nuxter.github}`" target="_blank">
            <UIcon name="uil:github" class="w-5 h-5 text-gray-400 dark:text-gray-50" />
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
defineProps({
  nuxter: {
    type: Object,
    required: true
  }
})

const { selectedSort } = useCommunityNuxters()

const sortedTypes = computed(() => {
  const types = ['activities', 'pull_requests', 'issues', 'comments']
  return [selectedSort.value.key, ...types.filter(type => type !== selectedSort.value.key)]
})
</script>
