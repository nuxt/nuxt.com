<script setup lang="ts">
const { toc } = useContent()
const emit = defineEmits(['move'])

const { adPartner, fetch: fetchPartners } = useAgencyPartners()

await fetchPartners()
</script>

<template>
  <nav class="flex flex-col space-y-1 sm:space-y-2">
    <template v-if="toc?.links?.length">
      <span class="items-center hidden overflow-hidden text-sm font-semibold lg:flex">
        <h2>Table of Contents</h2>
      </span>

      <DocsTocLinks :links="toc.links" @move="emit('move')" />
    </template>
    <LazyClientOnly>
      <hr class="mb-2">
      <span class="hidden">
        Agency partner:
      </span>
      <div>
        <NuxtLink :to="adPartner._path" class="block flex items-center bg-white dark:bg-gray-900 rounded-xl h-[60px] p-4 lg:p-2 align-middle border border-gray-200 dark:border-gray-800">
          <img :src="adPartner.logo.dark" role="presentation" class="mr-2 rounded-md h-8 light:hidden">
          <img :src="adPartner.logo.light" role="presentation" class="mr-2 rounded-md h-8 dark:hidden">
          <p class="font-semibold">
            {{ adPartner.title }}
          </p>
        </NuxtLink>
      </div>
      <NuxtLink to="/support/jobs" class="block relative h-[68px] p-4 lg:p-2 flex items-center justify-between bg-white dark:bg-gray-900 rounded-xl h-[60px] border border-gray-200 dark:border-gray-800">
        <p class="font-semibold">
          Looking for a Nuxt Job?
        </p>
        <img src="/assets/toc/jobs.svg" class="hidden dark:block absolute right-0 bottom-0 w-12 lg:w-10">
        <img src="/assets/toc/jobs-light.svg" class="dark:hidden absolute right-0 bottom-0 w-12 lg:w-10">
      </NuxtLink>
    </LazyClientOnly>
  </nav>
</template>
