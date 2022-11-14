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
      <NuxtLink :to="sponsor.sponsorUrl" class="block flex bg-white dark:bg-gray-900 rounded-md h-[60px] p-2 align-middle">
        <img :src="sponsor.sponsorLogo" role="presentation" class="mr-1 rounded-md">
        <p>{{ sponsor.sponsorName }}</p>
      </NuxtLink>
      <div class="bg-white dark:bg-gray-900 rounded-md h-[60px] p-2">
        <p>Looking for a Nuxt Job?</p>
      </div>
    </LazyClientOnly>
  </nav>
</template>
