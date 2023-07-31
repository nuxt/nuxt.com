<template>
  <div class="space-y-3">
    <LazyClientOnly>
      <NuxtLink :to="adPartner._path" class="flex items-center bg-white dark:bg-gray-900 dark:hover:bg-gray-800 hover:bg-gray-100 rounded-xl h-[60px] p-4 lg:p-2 align-middle border border-gray-200 dark:border-gray-800 truncate">
        <img :src="adPartner.logo?.dark" class="mr-2 rounded-md h-8 hidden dark:block" alt="">
        <img :src="adPartner.logo?.light" class="mr-2 rounded-md h-8 dark:hidden" alt="">
        <p class="font-semibold text-sm truncate">
          {{ adPartner.title }}
        </p>
      </NuxtLink>
      <NuxtLink to="https://masteringnuxt.com/nuxt3?ref=nuxt" target="_blank" class="gap-1 p-4 lg:p-2 dark:hover:bg-gray-800 hover:bg-gray-100 flex flex-col items-start justify-between bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <img src="/assets/toc/mastering-nuxt.svg" class="hidden dark:block h-6 lg:h-full" alt="">
        <img src="/assets/toc/mastering-nuxt-light.svg" class="dark:hidden h-6 lg:h-full" alt="">
        <p class="text-sm">
          Learn Nuxt 3 with experts.
        </p>
      </NuxtLink>
      <NuxtLink to="/enterprise/jobs" class="relative p-4 lg:p-2 dark:hover:bg-gray-800 hover:bg-gray-100 flex items-center justify-between bg-white dark:bg-gray-900 rounded-xl h-[60px] border border-gray-200 dark:border-gray-800">
        <p class="font-semibold text-sm">
          Looking for a Nuxt Job?
        </p>
        <img src="/assets/toc/jobs.svg" class="hidden dark:block absolute right-0 bottom-0 w-12 lg:w-10" alt="">
        <img src="/assets/toc/jobs-light.svg" class="dark:hidden absolute right-0 bottom-0 w-12 lg:w-10" alt="">
      </NuxtLink>
    </LazyClientOnly>

    <AdsFallback v-if="$ads.adBlocked.value" />
    <AdsCarbon v-else :key="($route.params.slug as string)" />
  </div>
</template>

<script setup lang="ts">
const { $ads } = useNuxtApp()
const { adPartner, fetchList } = useAgencyPartners()

await fetchList()

if (adPartner.value) {
  useTrackEvent('Show Partner', { props: { partner: adPartner.value.title } })
}
</script>
