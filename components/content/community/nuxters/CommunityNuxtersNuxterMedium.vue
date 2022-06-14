<template>
  <li class="relative col-span-6 overflow-hidden border xl:col-span-3 u-border-gray-200 rounded-xl h-44 group">
    <img src="/assets/community/nuxters/nuxter-gradient.svg" alt="nuxter background" class="absolute object-cover h-44 left-20">
    <div class="absolute w-48 h-48 overflow-hidden transition-all rounded-full u-bg-gray-50 -top-2 -left-14 grayscale group-hover:grayscale-0">
      <img :src="nuxter.avatar_url" :alt="nuxter.github" class="w-full h-full">
    </div>
    <div class="absolute inset-y-0 flex justify-between left-40 right-6">
      <div class="flex flex-col justify-between py-6">
        <div>
          <div class="flex items-center gap-3">
            <h3 class="text-2xl font-semibold leading-none u-text-gray-900">
              @{{ nuxter.github }}
            </h3>
            <CommunityNuxtersNuxterBadge :role="nuxter.role" />
          </div>
          <div class="flex items-center gap-3 mt-2">
            <span class="font-medium u-text-gray-700">{{ nuxter.name }}</span>
            <NuxtLink v-if="nuxter.twitter" :to="`https://twitter.com/${nuxter.twitter}`" target="_blank">
              <UIcon name="uil:twitter" class="w-5 h-5 u-text-gray-900 hover:u-text-gray-600" />
            </NuxtLink>
            <NuxtLink v-if="nuxter.github" :to="`https://github.com/${nuxter.github}`" target="_blank">
              <UIcon name="uil:github" class="w-5 h-5 u-text-gray-900 hover:u-text-gray-600" />
            </NuxtLink>
          </div>
        </div>
        <div class="flex items-center gap-12">
          <CommunityNuxtersNuxterNumber :nuxter="nuxter" size="md" :type="sortedTypes[0]" />
        </div>
      </div>
      <div class="flex flex-col items-end justify-between flex-shrink-0 pb-6">
        <CommunityNuxtersNuxterRank :nuxter="nuxter" />
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
