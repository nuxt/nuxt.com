<template>
  <li class="relative col-span-6 overflow-hidden border u-border-gray-200 rounded-xl h-44 group">
    <img src="/assets/community/nuxters/nuxter-gradient.svg" alt="nuxter background" class="absolute object-cover transition-all duration-200 h-44 left-32 grayscale group-hover:grayscale-0">
    <img :src="`https://github.com/${nuxter.github}.png`" :alt="nuxter.github" class="absolute w-56 h-56 transition-all duration-200 rounded-full -top-6 -left-10 grayscale group-hover:grayscale-0">
    <div class="absolute inset-y-0 flex justify-between left-56 right-10">
      <div class="flex flex-col justify-between py-6">
        <div>
          <div class="flex items-center gap-3">
            <h3 class="text-2xl font-semibold leading-none u-text-gray-900">
              @{{ nuxter.github }}
            </h3>
            <CommunityNuxtersNuxterBadge role="Ambassador" />
          </div>
          <div class="flex items-center gap-3 mt-2">
            <span class="text-lg font-medium u-text-gray-700">{{ nuxter.name }}</span>
            <NuxtLink v-if="nuxter.twitter" :to="`https://twitter.com/${nuxter.twitter}`" target="_blank">
              <UIcon name="uil:twitter" class="w-5 h-5 u-text-gray-900" />
            </NuxtLink>
            <NuxtLink v-if="nuxter.github" :to="`https://github.com/${nuxter.github}`" target="_blank">
              <UIcon name="uil:github" class="w-5 h-5 u-text-gray-900" />
            </NuxtLink>
          </div>
        </div>
        <div class="flex items-center gap-12">
          <CommunityNuxtersNuxterNumber :nuxter="nuxter" size="large" :type="sortedTypes[1]" />
          <CommunityNuxtersNuxterNumber :nuxter="nuxter" size="large" :type="sortedTypes[2]" />
          <CommunityNuxtersNuxterNumber :nuxter="nuxter" size="large" :type="sortedTypes[3]" />
        </div>
      </div>
      <div class="flex flex-col items-end justify-between flex-shrink-0 pb-6">
        <div class="relative">
          <img src="/assets/community/nuxters/rank-1.svg" alt="rank background">
          <span class="absolute inset-x-0 text-3xl font-semibold text-center top-3 u-text-white">#{{ nuxter.rank }}</span>
        </div>
        <CommunityNuxtersNuxterNumber :nuxter="nuxter" size="large" :type="sortedTypes[0]" />
      </div>
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
