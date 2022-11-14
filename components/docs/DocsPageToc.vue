<script setup lang="ts">
const { toc } = useContent()
const emit = defineEmits(['move'])

const { pending, data: sponsors, error } = useLazyFetch('/api/sponsors', {
  pick: ['platinum', 'gold']
})

const pickOne = (arr) => {
  return arr[Math.floor(Math.random() * arr.length)]
}

const sponsor = computed(() => pickOne([...sponsors.value?.platinum, ...sponsors.value?.gold]))
</script>

<template>
  <nav class="flex flex-col space-y-1 sm:space-y-2">
    <template v-if="toc?.links?.length">
      <span class="items-center hidden overflow-hidden text-sm font-semibold lg:flex">
        <h2>Table of Contents</h2>
      </span>

      <DocsTocLinks :links="toc.links" @move="emit('move')" />
    </template>
    <LazyClientOnly v-if="!pending && !error">
      <hr class="mb-2">
      <span class="hidden">
        Sponsored by:
      </span>
      <div>
        <NuxtLink :to="sponsor.sponsorUrl" target="_blank" class="block flex items-center bg-white dark:bg-gray-900 rounded-xl h-[60px] p-4 lg:p-2 align-middle border border-gray-200 dark:border-gray-800">
          <img :src="sponsor.sponsorLogo" role="presentation" class="mr-2 rounded-md h-8">
          <p class="font-semibold truncate">
            {{ sponsor.sponsorName }}
          </p>
        </NuxtLink>
      </div>
      <NuxtLink to="https://masteringnuxt.com/nuxt3?ref=nuxt" target="_blank" class="h-[72px] p-4 lg:p-2 flex flex-col items-start justify-between bg-white dark:bg-gray-900 rounded-xl h-[60px] border border-gray-200 dark:border-gray-800">
        <img src="/assets/toc/mastering-nuxt.svg" class="hidden dark:block h-6 lg:h-full">
        <img src="/assets/toc/mastering-nuxt-light.svg" class="dark:hidden h-6 lg:h-full">
        <p class="text-sm">
          Learn Nuxt 3 with experts.
        </p>
      </NuxtLink>
      <NuxtLink to="/jobs" target="_blank" class="relative h-[68px] p-4 lg:p-2 flex items-center justify-between bg-white dark:bg-gray-900 rounded-xl h-[60px] border border-gray-200 dark:border-gray-800">
        <p class="font-semibold">
          Looking for a Nuxt Jobs?
        </p>
        <img src="/assets/toc/jobs.svg" class="hidden dark:block absolute right-0 bottom-0 w-12 lg:w-10">
        <img src="/assets/toc/jobs-light.svg" class="dark:hidden absolute right-0 bottom-0 w-12 lg:w-10">
      </NuxtLink>
    </LazyClientOnly>
  </nav>
</template>
